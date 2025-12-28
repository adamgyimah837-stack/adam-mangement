const fetch = require('node-fetch');

// Netlify Function to create Clerk users. Set CLERK_API_KEY as environment variable.
// Deploy to Netlify (or adapt for Vercel) and use the frontend page at /admin/create-user to call /api/create-clerk-user

exports.handler = async function (event) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST' },
      body: '' 
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { email, firstName, lastName, role } = body;

    if (!email || !firstName) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing email or firstName' }) 
      };
    }

    const CLERK_API_KEY = process.env.CLERK_API_KEY;
    if (!CLERK_API_KEY) {
      console.error('CLERK_API_KEY not configured');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'CLERK_API_KEY not configured on server' }) 
      };
    }

    // Create user in Clerk
    const clerkRes = await fetch('https://api.clerk.com/v1/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLERK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_address: email,
        first_name: firstName,
        last_name: lastName || undefined,
      })
    });

    let clerkData = {};
    try {
      const text = await clerkRes.text();
      if (text) clerkData = JSON.parse(text);
    } catch (parseErr) {
      console.error('Clerk API JSON parse error:', parseErr);
    }

    if (!clerkRes.ok) {
      console.error('Clerk API error:', clerkData);
      return { 
        statusCode: clerkRes.status || 500, 
        body: JSON.stringify({ 
          error: clerkData?.errors?.[0]?.message || clerkData?.message || 'Failed to create Clerk user',
          details: clerkData
        }) 
      };
    }

    // Persist role mapping in Supabase user_roles table via Supabase service role
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
    let mappingInserted = false;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE && clerkData.id) {
      try {
        const mapRes = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_ROLE,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ user_id: clerkData.id, role })
        });

        if (!mapRes.ok) {
          const txt = await mapRes.text();
          console.warn('Failed to insert user_roles mapping:', mapRes.status, txt);
        } else {
          mappingInserted = true;
        }
      } catch (err) {
        console.warn('Error inserting user_roles mapping:', err.message);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        id: clerkData.id, 
        email: clerkData.email_addresses?.[0]?.email_address || email, 
        mappingInserted,
        message: 'User created successfully'
      })
    };
  } catch (err) {
    console.error('Server error:', err.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message || 'Server error' }) 
    };
  }
};
