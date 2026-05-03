# Page: Auth (`/auth`, `/auth/reset`)

## Purpose
Sign in, sign up, and reset password.

---

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Navbar                                                  │
├──────────────────────────────────────────────────────────┤
│  pt-[64px]                                               │
│                                                          │
│  [Auth card — centred, max-w-sm]                         │
│                                                          │
│  ┌───────────────────────────────────────────────────┐   │
│  │  3dthium  ← small logo/wordmark                   │   │
│  │                                                   │   │
│  │  Sign in  (or  Create account  or  Reset password) │   │
│  │                                                   │   │
│  │  [Form fields]                                    │   │
│  │                                                   │   │
│  │  [Primary action button — full width]             │   │
│  │                                                   │   │
│  │  [Switch mode link]                               │   │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Vertically centred: `min-height: calc(100vh - navbar-height)`.

---

## Auth Card

Standard Card, max-width: 400px (sm).
Padding: `space-8` (32px).

### Logo / wordmark
`text-2xl font-medium text-primary`: "3dthium"
Centred. `margin-bottom: space-6`.

---

## Sign In Mode

### Heading
`<h1>`: "Sign in" — `text-2xl font-bold`. Left-aligned.

### Fields

| Field | Type | Autocomplete |
|-------|------|-------------|
| Email address | email | email |
| Password | password | current-password |

Password field: show/hide toggle (eye icon, `aria-label="Show password"`).

### "Forgot password?" link
Below password field, right-aligned. `text-sm text-link`.
On click: switch to Reset mode (no navigation, swap form state).

### Primary action
"Sign in" — primary, full-width.

Loading: "Signing in…" + spinner.
Error: `ErrorState inline` or Toast — e.g., "Incorrect email or password."

### Switch mode
`"Don't have an account? Sign up"` — centred, `text-sm text-secondary`. "Sign up" is `text-link`.

---

## Sign Up Mode

### Heading
`<h1>`: "Create account" — `text-2xl font-bold`.

### Fields

| Field | Type | Autocomplete |
|-------|------|-------------|
| First name | text | given-name |
| Last name | text | family-name |
| Email address | email | email |
| Password | password | new-password |
| Confirm password | password | new-password |

Password: min 8 characters. Show strength indicator (3 levels: weak / fair / strong) below the password field. Not required — visual hint only.

Confirm password: validate match on blur.

### Primary action
"Create account" — primary, full-width.

### Switch mode
`"Already have an account? Sign in"` — `text-sm text-secondary`. "Sign in" is `text-link`.

---

## Reset Password Mode (`/auth/reset` or inline toggle)

### Step 1: Request reset

Heading: "Forgot your password?" — `text-2xl font-bold`.
Sub-copy: "Enter your email and we'll send a reset link." — `text-sm text-secondary`.

Field: Email address (email, autocomplete=email).

Primary action: "Send reset link" — primary, full-width.

Success (replace form):
```
[EnvelopeIcon 48px, brand-primary]

Check your inbox

We've sent a reset link to [email].
If you don't see it, check your spam folder.

[Back to sign in]
```

### Step 2: Set new password (on the `/auth/reset?token=...` page)

Heading: "Set new password"

Fields:
- New password
- Confirm new password

Primary action: "Update password" — primary, full-width.

Success: redirect to sign-in with Toast "Password updated. Sign in with your new password."

---

## Validation

All fields validated on submit. Email format on blur. Password match on confirm-field blur.

Field-level errors below each field (see Input spec).

---

## Focus management

On page load: focus the email input.
On mode switch: focus the heading of the new mode.

---

## State machine

```
SIGN_IN
  → SUBMITTING → SUCCESS (redirect to / or ?redirect param)
  → SUBMITTING → AUTH_ERROR → SIGN_IN

SIGN_UP
  → SUBMITTING → SUCCESS (auto sign-in, redirect)
  → SUBMITTING → AUTH_ERROR → SIGN_UP

RESET_REQUEST
  → SUBMITTING → EMAIL_SENT

RESET_SET
  → SUBMITTING → SUCCESS (redirect to SIGN_IN)
```

---

## Meta

```
<title>Sign in | 3dthium</title>
```
`noindex`.
