import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const CLERK_SECRET_KEY = Deno.env.get("CLERK_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase configuration missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // fetch pending imports
    const { data: pending, error: fetchErr } = await supabase
      .from('pending_user_imports')
      .select('*')
      .eq('status', 'pending')
      .limit(limit);

    if (fetchErr) throw fetchErr;

    const results: any[] = [];

    for (const row of pending || []) {
      const id = row.id;
      const email = row.email;
      const first_name = row.first_name || '';
      const last_name = row.last_name || '';
      const role = row.role || 'student';

      // generate default password
      const genPassword = () => {
        const arr = new Uint8Array(8);
        crypto.getRandomValues(arr);
        return Array.from(arr).map((b) => (b % 36).toString(36)).join('') + '!A1';
      };

      const password = genPassword();

      let clerkId: string | null = null;
      let clerkError: any = null;

      if (CLERK_SECRET_KEY) {
        try {
          const res = await fetch('https://api.clerk.com/v1/users', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email_address: email,
              first_name,
              last_name: last_name || undefined,
              password,
            })
          });

          const text = await res.text();
          let clerkData = {} as any;
          try { clerkData = text ? JSON.parse(text) : {}; } catch (e) { clerkData = { raw: text }; }

          if (!res.ok) {
            clerkError = clerkData;
          } else {
            clerkId = clerkData.id;
          }
        } catch (err) {
          clerkError = { message: err.message || String(err) };
        }
      } else {
        clerkError = { message: 'CLERK_SECRET_KEY not configured' };
      }

      // Create DB records: profiles, user_roles, and student/teacher rows
      let profileId: string | null = null;
      let roleRecordError: any = null;
      let createdStudentId: string | null = null;
      let createdTeacherId: string | null = null;

      try {
        if (clerkId) {
          // Insert profile (may fail if profiles.id FK to auth.users exists)
          try {
            const fullName = `${first_name} ${last_name}`.trim();
            const { data: profileData, error: profileErr } = await supabase
              .from('profiles')
              .insert({ id: clerkId, full_name: fullName || first_name, email })
              .select()
              .single();

            if (profileErr) {
              // Log but continue
              console.warn('Profile insert warning', profileErr.message || profileErr);
            } else {
              profileId = profileData?.id || clerkId;
            }
          } catch (e) {
            console.warn('Profile insert exception', e);
          }

          // Insert role
          try {
            const { error: roleErr } = await supabase.from('user_roles').insert({ user_id: clerkId, role });
            if (roleErr) roleRecordError = roleErr;
          } catch (e) {
            roleRecordError = e;
          }

          // Create role-specific records
          if (role === 'student') {
            try {
              const studentId = 'S' + Date.now().toString().slice(-6);
              const guardianName = row.metadata?.guardian_name || row.metadata?.guardian || row.guardian_name || null;
              const guardianEmail = row.metadata?.guardian_email || row.metadata?.guardian_email || null;

              const { data: studentData, error: studentErr } = await supabase.from('students').insert({
                user_id: clerkId,
                student_id: studentId,
                guardian_name: guardianName,
                guardian_email: guardianEmail,
                class_id: row.metadata?.class_id || null,
              }).select().single();

              if (studentErr) {
                console.warn('Student insert warning', studentErr.message || studentErr);
              } else {
                createdStudentId = studentData?.id;

                // Try to find matching parent by guardian name and link
                if (guardianName) {
                  try {
                    const { data: matchingProfiles } = await supabase.from('profiles').select('id,full_name').ilike('full_name', `%${guardianName}%`).limit(5);
                    if (matchingProfiles && matchingProfiles.length > 0) {
                      // pick first profile that has parent role
                      for (const p of matchingProfiles) {
                        const { data: ur } = await supabase.from('user_roles').select('role').eq('user_id', p.id).eq('role', 'parent');
                        if (ur && ur.length > 0) {
                          // update student with parent_user_id if column exists
                          try {
                            await supabase.from('students').update({ parent_user_id: p.id }).eq('id', createdStudentId);
                          } catch (e) {
                            console.warn('Failed to set parent_user_id', e);
                          }
                          break;
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('Parent lookup error', e);
                  }
                }
              }
            } catch (e) {
              console.warn('Student insert exception', e);
            }
          }

          if (role === 'teacher') {
            try {
              const teacherCode = 'T' + Date.now().toString().slice(-6);
              const { data: teacherData, error: teacherErr } = await supabase.from('teachers').insert({
                user_id: clerkId,
                teacher_id: teacherCode,
              }).select().single();

              if (teacherErr) {
                console.warn('Teacher insert warning', teacherErr.message || teacherErr);
              } else {
                createdTeacherId = teacherData?.id;
              }
            } catch (e) {
              console.warn('Teacher insert exception', e);
            }
          }
        }
      } catch (e) {
        console.warn('DB creation error', e);
      }

      // update pending row with result and DB ids
      const updatePayload: any = {
        status: clerkId ? 'processed' : 'failed',
        metadata: { ...row.metadata, clerkId: clerkId || null, profileId: profileId || null, studentId: createdStudentId || null, teacherId: createdTeacherId || null, error: clerkError || roleRecordError || null, generatedPassword: password },
        updated_at: new Date().toISOString(),
      };

      try {
        await supabase.from('pending_user_imports').update(updatePayload).eq('id', id);
      } catch (e) {
        console.warn('Failed to update pending row', e);
      }

      results.push({ id, email, success: !!clerkId, clerkId, profileId, studentRowId: createdStudentId, teacherRowId: createdTeacherId, error: clerkError || roleRecordError, password: clerkId ? password : null });
    }

    return new Response(JSON.stringify({ results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
