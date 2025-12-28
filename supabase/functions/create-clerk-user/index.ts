import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName?: string;
  role: "admin" | "teacher" | "student" | "parent";
}

serve(async (req) => {
  console.log("Function called with method:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Accept either a single user object or an array for bulk creation
    const users = Array.isArray(body) ? body : [body];

    const clerkApiKey = Deno.env.get("CLERK_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // helper to generate a simple default password
    const generatePassword = () => {
      const array = new Uint8Array(8);
      crypto.getRandomValues(array);
      return Array.from(array)
        .map((b) => (b % 36).toString(36))
        .join("") + "!A";
    };

    const results: any[] = [];

    for (const u of users) {
      const email = (u.email || u.email_address || "").toString().trim();
      const firstName = (u.firstName || u.first_name || u.name || "").toString().trim();
      const lastName = (u.lastName || u.last_name || "").toString().trim();
      const role = (u.role || "student").toString();

      if (!email || !firstName) {
        results.push({ email, success: false, error: "Missing email or firstName" });
        continue;
      }

      let clerkUserId: string | null = null;
      let generatedPassword: string | null = null;

      if (clerkApiKey) {
        try {
          generatedPassword = generatePassword();
          const clerkRes = await fetch("https://api.clerk.com/v1/users", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${clerkApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email_address: email,
              first_name: firstName,
              last_name: lastName || undefined,
              password: generatedPassword,
            }),
          });

          const text = await clerkRes.text();
          let clerkData: any = {};
          try {
            if (text) clerkData = JSON.parse(text);
          } catch (parseErr) {
            console.warn("Clerk JSON parse error", parseErr);
          }

          if (!clerkRes.ok) {
            results.push({ email, success: false, error: clerkData || `Clerk error ${clerkRes.status}` });
            continue;
          }

          clerkUserId = clerkData.id;
        } catch (err) {
          results.push({ email, success: false, error: err.message || String(err) });
          continue;
        }
      }

      // Insert role mapping in Supabase
      try {
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: clerkUserId || email,
          role: role,
        });

        if (roleError) {
          console.warn(`Role insert failed for ${email}:`, roleError.message);
        }
      } catch (err) {
        console.warn("Supabase insert error:", err);
      }

      results.push({
        email,
        success: true,
        id: clerkUserId || null,
        role,
        password: generatedPassword || null,
      });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
