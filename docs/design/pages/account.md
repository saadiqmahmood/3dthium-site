# Page: Account (`/account`)

## Purpose
Let users view and edit their profile, address, and change their password.

---

## Layout (desktop)

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar                                                      │
├──────────────────────────────────────────────────────────────┤
│  PageHeader: "My Account"                                    │
│  Subtitle: "Manage your profile and preferences."            │
│  ──────────────────────────────────────────────────          │
│                                                              │
│  ┌───────────────────────┐  ┌──────────────────────────┐    │
│  │  Profile              │  │  Delivery address        │    │
│  │  ─────────────        │  │  ────────────────        │    │
│  │  Name  [Edit]         │  │  [Address fields]        │    │
│  │  Email [Edit]         │  │  [Save address]          │    │
│  │                       │  └──────────────────────────┘    │
│  │  Change password      │                                   │
│  │  ─────────────────    │                                   │
│  │  [Current password]   │                                   │
│  │  [New password]       │                                   │
│  │  [Confirm new]        │                                   │
│  │  [Update password]    │                                   │
│  └───────────────────────┘                                   │
│                                                              │
│  [Sign out]  ← ghost button, below cards                     │
└──────────────────────────────────────────────────────────────┘
```

Mobile: single column.

---

## Profile Card

Standard Card.

| Field | Display | Editable |
|-------|---------|---------|
| First name + Last name | Text | Yes — inline edit or modal |
| Email | Text | Yes — email change triggers confirmation |

Edit pattern: show "Edit" link (ghost button sm) next to each field. On click, field becomes an Input. "Save" and "Cancel" buttons appear inline.

Do not use a full modal for simple field edits on this page.

---

## Delivery Address Card

Standard form — all address fields (same as checkout step 1).
"Save address" button — primary md.

Success: Toast "Address saved."
Error: Toast "Couldn't save your address. Try again."

---

## Change Password Card

| Field | Type | Required |
|-------|------|---------|
| Current password | password | Yes |
| New password | password | Yes |
| Confirm new password | password | Yes |

Validation:
- New password: min 8 characters.
- Confirm: must match new password — validate on blur.
- Show/hide password toggle (eye icon) on all three.

"Update password" — primary md.
Success: Toast "Password updated."
Error: Toast "Couldn't update password. Check your current password and try again."

---

## Sign Out

Ghost button, below all cards. Positioned bottom-left of content.
Label: "Sign out"
On click: confirm (no modal — just sign out immediately). Redirect to `/`.

---

## Loading state

Show skeleton cards (2 blocks) while fetching user data.

---

## Error state

If user not authenticated: redirect to `/auth?redirect=/account`.

If user data fetch fails:
```
ErrorState
heading: "Couldn't load your account"
CTA: "Try again"
```

---

## Meta

```
<title>My Account | 3dthium</title>
```
`noindex`.
