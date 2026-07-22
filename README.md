# Mint Scribbles

Mint Scribbles is a curated stationery storefront for ready-made bundles and
individual paper goods. Customers can prepare a collection order without an
online payment, while the owner has a private administration area protected by
ChatGPT sign-in and an approved-email check.

## Current release

Phase 5 includes everything from Phases 1–3, plus:

- database-backed storefront catalogue
- protected product creation and editing
- owner-managed names, descriptions, prices, badges and visual styles
- live and sold-out availability controls
- safe product archive and restore workflow
- checkout pricing and availability verified from the live catalogue
- historical order snapshots preserved when products change

The live site is currently kept private while the ordering system is developed.

## Technology

- Next.js and React
- Vinext and Vite
- Cloudflare Workers-compatible deployment through OpenAI Sites
- Drizzle ORM and Cloudflare D1 for durable order storage

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
- `db/` and `drizzle/` — order, catalogue and migration schemas
- `.openai/hosting.json` — Sites project configuration

## Business contact

For Mint Scribbles enquiries and order requests, use
`mohamedusama881@gmail.com`.

## Roadmap

- Phase 4 is intentionally deferred: customer tracking and notifications
- Phase 6: custom bundle builder and bundle pricing rules
- Phase 7: optional online payments and launch preparation
