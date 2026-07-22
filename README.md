# Mint Scribbles

Mint Scribbles is a curated stationery storefront for ready-made bundles and
individual paper goods. Customers can prepare a collection order without an
online payment, while the owner has a private administration area protected by
ChatGPT sign-in and an approved-email check.

## Current release

Phase 1 includes:

- responsive stationery storefront
- shopping bag and collection-order request flow
- private `/admin` owner area
- server-side owner email verification
- admin foundations for future order and product management
- secure sign-out and search-engine blocking for admin pages

The live site is currently kept private while the ordering system is developed.

## Technology

- Next.js and React
- Vinext and Vite
- Cloudflare Workers-compatible deployment through OpenAI Sites
- Drizzle ORM, ready for the Phase 2 order database

## Local development

Node.js 22.13 or newer is required.

```bash
npm install
npm run dev
```

Create a local `.env` file using `.env.example` and set the approved owner
email:

```bash
MINT_ADMIN_EMAIL=mohamedusama881@gmail.com
```

Do not commit `.env` files or credentials.

## Validation

```bash
npm run build
```

## Project structure

- `app/page.tsx` — storefront, bag and collection checkout
- `app/admin/` — protected owner administration pages
- `app/chatgpt-auth.ts` — ChatGPT sign-in helpers
- `db/` and `drizzle/` — database foundation for later phases
- `.openai/hosting.json` — Sites project configuration

## Business contact

For Mint Scribbles enquiries and order requests, use
`mohamedusama881@gmail.com`.

## Roadmap

- Phase 2: database-backed customer order capture
- Phase 3: owner order management and status updates
- Later phases: product management, stock availability, custom bundles,
  notifications and optional online payments
