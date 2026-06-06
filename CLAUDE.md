# Project Instructions

## Git

- **Never perform any git operation unless explicitly told to.** This includes `git add`, `git commit`, `git push`, `git merge`, `git pull`, `git checkout`, `git branch`, `git stash`, and any other git command that modifies state.
- Wait for clear explicit instructions such as "commit this", "commit and push", "merge to main", "push to dev" before touching git.
- Commit author must always be: `Abdullahi Mahmood <mahmoodsaadiq@gmail.com>`

## Style

- Tailwind CSS only — no shadcn/ui, no new component libraries.
- **Always match the site's existing aesthetic for every new feature and edit:**
  - Colour palette: emerald and zinc throughout. Emerald (`emerald-600` primary, `emerald-500` accents) for interactive and active states. Zinc (`zinc-900`, `zinc-700`, `zinc-500`, `zinc-100`) for text and backgrounds.
  - Typography: `font-light` for body text and labels, `font-medium`/`font-semibold` sparingly for emphasis. `text-sm` or `text-base` — nothing oversized.
  - Inputs and selects: `border border-gray-200 rounded-lg px-4 py-2 text-sm font-light` with `focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none`.
  - Buttons: primary = `bg-emerald-600 text-white hover:bg-emerald-700`, secondary = `border border-gray-200 text-zinc-600 hover:bg-gray-50`, destructive = `text-red-600 border border-red-200 hover:bg-red-50`.
  - Cards and panels: `bg-white rounded-lg border border-gray-100 shadow-sm` with `p-6`.
  - Spacing: generous padding (`p-5`, `p-6`), consistent gaps (`gap-4`, `gap-6`).
  - No hard shadows, no bright colours outside the palette, no rounded-full on rectangular containers.
  - When in doubt, look at an existing nearby component and match it exactly.
