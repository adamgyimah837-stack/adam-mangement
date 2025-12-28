import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const { email, firstName, lastName, role = 'student', guardianName, guardianEmail, class_id } = body || {};

    if (!email || !firstName) return new Response(JSON.stringify({ error: 'email and firstName are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // generate default password
    const genPassword = () => {
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      return Array.from(arr).map((b) => (b % 36).toString(36)).join('') + '!A1';
    };

    const password = genPassword();

    let clerkId: string | null = null;
    let clerkCreateError: any = null;
    let inviteSent = false;

    if (CLERK_SECRET_KEY) {
      try {
        const createRes = await fetch('https://api.clerk.com/v1/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          },
          body: JSON.stringify({
            email_address: email,
            first_name: firstName,
            last_name: lastName || undefined,
            password,
          }),
        });

        const text = await createRes.text();
        let createData: any = {}; try { if (text) createData = JSON.parse(text); } catch (e) { createData = { raw: text }; }

        if (!createRes.ok) {
          clerkCreateError = createData;
        } else {
          clerkId = createData.id;

          // attempt to send Clerk invite/email if Clerk supports invitations endpoint
          try {
            const inviteRes = await fetch('https://api.clerk.com/v1/invitations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
              },
              body: JSON.stringify({ email_address: email }),
            });
            inviteSent = inviteRes.ok;
          } catch (e) {
            inviteSent = false;
          }
        }
      } catch (e) {
        clerkCreateError = { message: e.message || String(e) };
      }
    } else {
      clerkCreateError = { message: 'CLERK_SECRET_KEY not configured' };
    }

    // create DB records
    let profileId: string | null = null;
    let createdStudentId: string | null = null;
    let createdTeacherId: string | null = null;

    if (clerkId) {
      try {
        const fullName = `${firstName} ${lastName || ''}`.trim();
        const { data: profileData, error: profileErr } = await supabase.from('profiles').insert({ id: clerkId, full_name: fullName || firstName, email }).select().single();
        if (!profileErr) profileId = profileData?.id || clerkId;
      } catch (e) {
        console.warn('Profile insert error', e);
      }

      try {
        await supabase.from('user_roles').insert({ user_id: clerkId, role });
      } catch (e) {
        console.warn('User role insert error', e);
      }

      if (role === 'student') {
        try {
          const studentCode = 'S' + Date.now().toString().slice(-6);
          const { data: sData, error: sErr } = await supabase.from('students').insert({ user_id: clerkId, student_id: studentCode, guardian_name: guardianName || null, guardian_email: guardianEmail || null, class_id: class_id || null }).select().single();
          if (!sErr) createdStudentId = sData?.id;
        } catch (e) { console.warn('Student insert error', e); }
      }

      if (role === 'teacher') {
        try {
          const tCode = 'T' + Date.now().toString().slice(-6);
          const { data: tData, error: tErr } = await supabase.from('teachers').insert({ user_id: clerkId, teacher_id: tCode }).select().single();
          if (!tErr) createdTeacherId = tData?.id;
        } catch (e) { console.warn('Teacher insert error', e); }
      }

      if (role === 'parent') {
        // parents stored as profiles + user_roles; you may want a parents table—current schema uses profiles and user_roles
      }
    }

    // update profiles/user tables already done; return response (include password if invite wasn't sent so admin can inform user)
    return new Response(JSON.stringify({
      email,
      clerkId,
      profileId,
      studentId: createdStudentId,
      teacherId: createdTeacherId,
      inviteSent,
      password: inviteSent ? null : password,
      error: clerkCreateError || null,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
