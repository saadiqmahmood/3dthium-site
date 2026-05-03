# Admin Page: Users (`/admin/users`)

See `admin-layout.md` for chrome and table patterns.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  PageHeader: "Users" (312)                                       │
│  ──────────────────────────────────────────────────────         │
│                                                                  │
│  [Filter bar]                                                    │
│  [Search email or name]  [Role: All ▾]  [Clear]                  │
│                                                                  │
│  [Users table]                                                   │
│  Name        Email             Joined        Role    Actions     │
│  Jane Smith  jane@example.com  12 Jan 25     User    [E][D]     │
│  Bob Admin   bob@example.com   1 Jan 25      Admin   [E]        │
│  ...                                                             │
│                                                                  │
│  [Pagination]                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Table columns

| Column | Content | Notes |
|--------|---------|-------|
| Name | First + last name | |
| Email | Email address | `text-sm text-secondary` |
| Joined | Date | `text-sm text-secondary` |
| Role | "Admin" (brand badge) or "User" (neutral badge) | |
| Actions | [Edit] [Delete] — no Delete for admins | |

---

## Edit User (modal md)

```
Heading: "Edit user"

First name *   Last name *
Email *  (read-only — changing email is a Supabase auth action)
Is admin  (Checkbox)

[Cancel]  [Save]
```

No password reset in this panel — Supabase handles it. Add a "Send password reset email" ghost button sm in the modal footer.

---

## Delete user

Confirmation modal sm:
```
"Delete [name] ([email])?"
"Their account and order history will be permanently removed."
[Cancel]  [Delete]
```

Do not show Delete for users with is_admin = true (hide the button entirely).

---

## Role filter

"Role: All" / "Admins" / "Users" — Select sm.

---

## Empty state

No users found:
```
No users match your search.
[Clear filters]
```

---

## Loading

Skeleton table: 10 rows × 5 columns.
