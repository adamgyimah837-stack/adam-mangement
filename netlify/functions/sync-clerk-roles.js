const fetch = require('node-fetch');

// Netlify Function: sync roles from Clerk to Supabase `user_roles` table
// Expects env: CLERK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const CLERK_API_KEY = process.env.CLERK_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

  if (!CLERK_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'CLERK_API_KEY not configured' }) };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return { statusCode: 500, body: JSON.stringify({ error: 'Supabase not configured' }) };

  try {
    let users = [];
    let page = 0;
    const limit = 100;
    while (true) {
      const res = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${page * limit}`, {
        headers: { Authorization: `Bearer ${CLERK_API_KEY}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Clerk API error: ${res.status} ${txt}`);
      }
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      users = users.concat(batch);
      if (batch.length < limit) break;
      page += 1;
    }

    const mappings = [];
    users.forEach((u) => {
      const role = (u.public_metadata && u.public_metadata.role) || (u.private_metadata && u.private_metadata.role) || null;
      if (role) mappings.push({ user_id: u.id, role });
    });

    if (mappings.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No roles found to sync' }) };
    }

    // Upsert to Supabase REST (on_conflict=user_id)
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates, return=representation',
      },
      body: JSON.stringify(mappings),
    });

    const upsertText = await upsertRes.text();
    if (!upsertRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to upsert user_roles', details: upsertText }) };
    }

    // Some Supabase REST responses may return an empty body; avoid JSON.parse on empty string
    let details = null;
    if (upsertText && upsertText.trim().length > 0) {
      try {
        details = JSON.parse(upsertText);
      } catch (e) {
        details = upsertText;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Synced roles', count: mappings.length, details }) };
  } catch (err) {
    console.error('sync-clerk-roles error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
