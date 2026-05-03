# Page: Custom Order (`/custom-order`)

## Purpose
Let customers request a bespoke 3D print by describing what they need and optionally uploading a model file.

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Navbar                                                      │
├──────────────────────────────────────────────────────────────┤
│  pt-[64px]                                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  [Header block — left-aligned]                      │     │
│  │  How it works                                       │     │
│  │  1 → 2 → 3 steps                                   │     │
│  │                                                     │     │
│  │  [Form — max-w-2xl]                                 │     │
│  │  Full name                                          │     │
│  │  Email                                              │     │
│  │  Phone (optional)                                   │     │
│  │  Describe your project  (Textarea lg)               │     │
│  │  Material / colour preference  (Textarea sm)        │     │
│  │  Budget range  (Select)                             │     │
│  │  Attach file  (FileUpload)                          │     │
│  │  [Send enquiry]                                     │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## Header Block

`<h1>`: "Custom 3D print enquiry" — `text-4xl font-bold`

Sub-copy: `text-lg text-secondary`. Max-width: 480px.

"How it works" steps (horizontal strip, 3 items):
```
①  Describe your project
②  We'll send a quote
③  Approve and we'll print it
```
Each step: icon (24px, brand-primary) + short label. `text-sm font-medium`. `gap-x-8`.

---

## Form Fields

| Field | Component | Required |
|-------|-----------|---------|
| Full name | Input md | Yes |
| Email | Input md (type=email) | Yes |
| Phone | Input md (type=tel) | No |
| Project description | Textarea lg (8 rows) | Yes |
| Material / colour preference | Textarea sm (3 rows) | No |
| Budget range | Select | No |
| Attach file (.stl, .obj, .step, .3mf) | FileUpload | No |

### Budget range options

```
<option value="">Select a budget (optional)</option>
<option value="under-50">Under £50</option>
<option value="50-150">£50 – £150</option>
<option value="150-500">£150 – £500</option>
<option value="500+">£500+</option>
<option value="not-sure">Not sure yet</option>
```

---

## Validation

All required fields validated on submit.
File: accepted types `.stl .obj .step .3mf`, max 50 MB.
Email: validate format on blur.

On validation error: scroll to first invalid field, move focus there.

---

## Submit state

"Send enquiry" button — primary lg, full-width on mobile.

On submit:
1. Button → "Sending…" + spinner
2. File uploads first (if attached)
3. API call to `POST /api/custom-order`
4. Success → show success block (replace form):

```
    [CheckCircle 48px, success]

    Enquiry sent

    We'll review your project and get back to you
    at [email] within 2 business days.

    [Back to home]
```

5. Error → Toast error + form remains editable.

---

## Error state (form level)

If the API call fails:
```
Toast (error): "We couldn't send your enquiry. Check your connection and try again."
```

If file upload fails:
```
FileUpload component shows error state: "File upload failed. Try a smaller file or a different format."
```

---

## State machine

```
IDLE → SUBMITTING → SUCCESS
SUBMITTING → ERROR → IDLE (user can retry)
```

---

## Meta

```
<title>Custom Order | 3dthium</title>
<meta name="description" content="Request a custom 3D print. Describe your project, attach a file, and we'll send you a quote within 2 business days." />
```
