# DealersHub setup guide

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Edge Functions

## Frontend

Required Node version for the supplied setup:
22.12.0 or newer.

Install dependencies:

    npm install

Check and build:

    npm run build

Start development:

    npm run dev

## Frontend environment

Create .env.local from .env.example.

Required values:

    VITE_SUPABASE_URL=
    VITE_SUPABASE_ANON_KEY=

Use a publishable or anon key.

Never put a service-role or secret key in a
VITE-prefixed environment variable.

Restart Vite after changing environment values.

## Backend environment

Supabase-hosted Edge Functions provide:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Additional application configuration:

- APP_URL
- INVITATION_TTL_SECONDS

APP_URL is the frontend application's origin.

During local frontend development, this is:

    http://localhost:5173

INVITATION_TTL_SECONDS must be explicitly configured
and aligned with the approved invitation policy and
Supabase Auth email-link expiration settings.

Do not invent a production invitation lifetime.

## Authentication redirect URLs

Allow these URLs for the relevant environment:

- /reset-password
- /accept-invitation

Use complete URLs in the Supabase dashboard.

Production URLs must use the actual deployed domain.

## Migration order

Run migrations in filename order, starting with:

    202611130001_identity_businesses.sql

The current series also includes:

    202611130010_business_onboarding.sql

These initial migrations target a fresh database.

Do not apply them blindly to an existing schema.

RLS policies are intentionally restrictive.

## Current functionality

- Authentication screen foundation
- Session context
- Database entities and permission helpers
- Private media storage policies
- Transactional business onboarding RPC
- Business onboarding Edge Function
- Pending invitation creation
- New-account invitation email submission

## Remaining work

- Business registration UI
- Onboarding UI
- Verified role and business selection
- Invitation callback and acceptance
- Existing-account invitation inbox
- Dealer access management
- Salesperson assignment management
- Product management
- Cart and checkout
- Transactional order submission
- Order status management
- Dashboards and platform administration

## Invitation rules

Creating an invitation does not grant business access.

Invitation acceptance must:

1. Verify the authenticated user's email.
2. Lock the invitation.
3. Check status and expiration.
4. Recheck that the business is active.
5. Verify the invitation's store ownership.
6. Create the intended dealer access or membership.
7. Mark the invitation accepted in the same transaction.

A dealer invitation must not overwrite unrelated
business access.

A salesperson invitation must not silently change an
existing business administrator's role.

## Security verification before deployment

Check:

- Tenant isolation
- Dealer access restrictions
- Salesperson assignment restrictions
- Business suspension
- Invitation replay and expiration
- Role escalation prevention
- Private file access
- Order validation and duplicate submission handling

Frontend build success does not validate SQL or
Edge Functions.