# Account Page — Build Plan

## Audit findings

### Broken right now
- `/account/change-email` — linked from profile tab, returns 404
- `/account/change-password` — linked from profile tab, returns 404
- Reorder writes raw data to `localStorage` as `'cart'` — wrong shape, CartContext never reads it
- Orders tab calls `router.push('/orders')` and navigates away; the inline orders section is dead code
- h1 still `font-light` (sed change didn't persist — file needs direct edit)
- Styling uses dark emerald tints, stone/blue colours — doesn't match site palette

### Missing features
- Display name (editable, stored in Supabase user metadata)
- Saved delivery addresses (`user_addresses` table needed)
- Favourites shortcut card on profile tab

---

## Priority order

| # | Item | Status |
|---|------|--------|
| 1 | `/account/change-password` page | ✅ Done |
| 2 | `/account/change-email` page | ✅ Done |
| 3 | Fix reorder (CartContext, not localStorage) | ✅ Done |
| 4 | Restyle account page to match site palette | ✅ Done |
| 5 | Display name editing (Supabase user_metadata) | ✅ Done |
| 6 | Clean up Orders tab (remove dead section, clean link to /orders) | 🟡 Todo |
| 7 | Saved delivery addresses | ✅ Done |
| 8 | Favourites shortcut card | ✅ Done |

---

## Design rules for all account pages

- Layout: `min-h-screen bg-white pt-24 pb-16`, max-w-lg card centered
- Card: `bg-white border border-gray-100 rounded-lg shadow-sm p-8` (CLAUDE.md panel style)
- Back link: `text-sm text-zinc-400 hover:text-zinc-700`, arrow-left icon, 8 lines above card
- Page title: `text-2xl font-bold text-zinc-900`
- Subtitle/hint: `text-sm font-light text-zinc-500`
- Labels: `text-sm font-light text-zinc-700 mb-1.5`
- Inputs: `border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-light focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none`
- Error text: `text-xs text-red-500 mt-1.5`
- Primary button: `bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg py-2.5 text-sm font-medium`
- Secondary button: `border border-gray-200 text-zinc-600 hover:bg-gray-50`
- Success state: emerald check icon in `bg-emerald-50` circle, then heading + soft description
- Supabase client: use `useSupabase()` hook for `updateUser` calls
