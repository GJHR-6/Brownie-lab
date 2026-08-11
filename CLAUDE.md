# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server (Next.js)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)
- No test suite is configured in this repo.
- Database schema changes live in `supabase/migrations/*.sql` as sequential numbered files (no ORM/migration tool) — add a new numbered file rather than editing an existing one.

## Architecture

**Two apps in one Next.js project**, split by App Router route group:
- `src/app/(site)/` — public storefront (Spanish-language: "Brownie Lab", artisanal brownies/galletas in Honduras)
- `src/app/admin/(dashboard)/` — full admin back office (orders/Kanban, inventory, costs/margins, promotions, gift cards, loyalty, delivery zones, reports, etc.)

**Data layer**: Supabase (Postgres + Auth + Storage), accessed almost exclusively through **Next.js Server Actions** in `src/actions/*.ts` (one file per domain: `pedidos.ts`, `productos.ts`, `cajas.ts`, etc.) rather than API routes. `src/app/api/` is reserved for things Server Actions can't do: web-push, Apple/Google Wallet pass generation, CSV export, coupon validation, and the Supabase auth callback.

Three Supabase client variants in `src/lib/supabase/`, each with a distinct trust boundary:
- `client.ts` — browser client (anon key)
- `server.ts` — SSR client bound to request cookies (anon key + user session)
- `service.ts` — service-role client that **bypasses RLS**; server-only, never import from client components

**Admin auth**: `requireAdmin()` in `src/lib/adminAuth.ts` must guard every admin server action. Google login accepts any Google account — being authenticated is not the same as being an admin — so this helper checks both a valid session *and* membership in the `admin_users` table. Don't gate admin actions on session presence alone.

**Product data**: live products come from Supabase (`productos` table, joined with `categorias`, typed in `src/types/database.ts`). `src/data/products.json` and `chef-specials.json` are unused legacy fixtures — don't wire new code to them.

**Client state**: Zustand stores in `src/lib/` (`cartStore.ts`, `wishlistStore.ts`, `recentStore.ts`) for cart/wishlist/recently-viewed. No Redux/Context-based global state.

**Styling**: Tailwind v4, CSS-first config (no `tailwind.config.js`) — global design tokens (colors, radii, shadows, fluid spacing/type scale) are CSS custom properties defined in `src/app/globals.css` and consumed via inline `style={{ ... }}`, with Tailwind utility classes layered on top mainly for flex/grid layout. When touching styled UI, reuse the existing `--choco-*`, `--orange`, `--amber`, `--paper*`, `--r-*` (radius), `--shadow-*` tokens rather than introducing new hardcoded values. `src/config/store.ts` also declares a `theme` block of Tailwind class names, but it's effectively unused — the CSS custom properties in `globals.css` are what's actually applied.

**Store identity/config**: `src/config/store.ts` centralizes name, tagline, WhatsApp number, currency, socials, and bank transfer details — check here before hardcoding any of those elsewhere.

**Cart/checkout flow**: not a single cart page — `src/app/(site)/cart/PedidoFlow.tsx` is a client-side multi-stage wizard (`start → signin → stores/address → menu → giftcard/catering → review`), with stage components under `cart/stages/` and state persisted to `sessionStorage`.

**Composed items priced server-side**: cart items that aren't single products (Personaliza custom builds, "Arma tu caja" boxes) travel with a structured `composicion`, and `crearPedidoPublico` (`src/actions/publico.ts`) recalculates the real price against the DB via `recalcularComposiciones` before accepting an order — never trust a client-submitted price for composed items.

**Known debt/roadmap**: see `PENDIENTES.md` (Spanish) for the current punch list on the admin panel — e.g. order costs aren't snapshotted at order time (historical margins drift when ingredient costs change), box contents aren't checked against per-category production limits, and ingredient recipes don't yet carry quantities.
