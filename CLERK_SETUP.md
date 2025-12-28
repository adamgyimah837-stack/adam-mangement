# Clerk + Supabase Integration Setup

## Overview
The app uses Clerk for authentication and Supabase to store user roles. When creating new users, the Supabase Edge Function securely handles Clerk API calls.

## Setup Steps

### 1. Set up Supabase Environment Variables

Add these to your `.env` file:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 2. Deploy the Supabase Edge Function

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your Supabase project:
```bash
supabase link --project-ref vadcuernpdhhujbgbfxn
```

3. Set the CLERK_SECRET_KEY secret:
```bash
supabase secrets set CLERK_SECRET_KEY=your_clerk_secret_key
```

4. Deploy the function:
```bash
supabase functions deploy create-clerk-user
```

#### Option B: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `create-clerk-user`
5. Copy the code from `supabase/functions/create-clerk-user/index.ts`
6. Set the environment variable `CLERK_SECRET_KEY` in function settings

### 3. Get Your Clerk Secret Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Developers → API Keys**
4. Copy your **Secret Key** (starts with `sk_live_` or `sk_test_`)

### 4. Verify the Setup

Test the user creation:
1. Go to the admin dashboard
2. Navigate to **Create Clerk User**
3. Fill in the form with test data
4. Click **Create User**

### Troubleshooting

#### Error: "CLERK_SECRET_KEY not configured"
- Make sure the secret is set in Supabase Edge Function settings
- Redeploy the function after setting the secret

#### Error: "Supabase configuration missing"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in Supabase

#### Error: "Failed to create Clerk user"
- Check the Clerk dashboard for API errors
- Verify the email address is not already in use
- Check function logs in Supabase dashboard

#### User created but role not assigned
- Check that the `user_roles` table exists
- Verify user_id column constraints
- Check Supabase RLS policies allow inserts

### Environment Variables Reference

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `.env` / Vite | Frontend Clerk setup |
| `CLERK_SECRET_KEY` | Supabase Secrets | Edge Function authentication |
| `VITE_SUPABASE_URL` | `.env` / Vite | Supabase database URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` / Vite | Supabase anonymous key |

### Security Notes

- **CLERK_SECRET_KEY** is stored securely in Supabase secrets, never exposed to frontend
- All API calls to Clerk happen on the server (Edge Function)
- User roles are stored in Supabase with RLS policies for security

### Testing Locally

To test the Edge Function locally:

```bash
supabase functions serve create-clerk-user
```

Then call it with:
```bash
curl -i --location --request POST http://localhost:54321/functions/v1/create-clerk-user \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com","firstName":"Test","lastName":"User","role":"student"}'
```
