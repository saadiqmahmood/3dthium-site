# Page: Contact (`/contact`)

## Purpose
Let customers send a general enquiry.

---

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar                                                     │
├─────────────────────────────────────────────────────────────┤
│  pt-[64px]                                                  │
│                                                             │
│  ┌────────────────────────────┐  ┌──────────────────────┐  │
│  │  Get in touch              │  │  Contact details     │  │
│  │  ─────────────             │  │  Email: ...          │  │
│  │  Sub-copy                  │  │  Response time: ...  │  │
│  │                            │  └──────────────────────┘  │
│  │  [Form — max-w-lg]         │                            │
│  │  Name                      │                            │
│  │  Email                     │                            │
│  │  Subject (optional)        │                            │
│  │  Message (Textarea lg)     │                            │
│  │  [Send message]            │                            │
│  └────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

Mobile: single column.

---

## Heading block

`<h1>`: "Get in touch" — `text-4xl font-bold`

Sub-copy: "Have a question about an order, a product, or anything else? We reply within 1–2 business days."
`text-lg text-secondary`. Max-width: 400px.

---

## Contact details panel (right column)

Standard Card.

```
Email: hello@3dthium.com
Response time: Within 1–2 business days
```

`text-base text-secondary`. Email as a `<a href="mailto:...">` in `text-link`.

---

## Form fields

| Field | Component | Required |
|-------|-----------|---------|
| Name | Input md | Yes |
| Email | Input md (type=email) | Yes |
| Subject | Input md | No |
| Message | Textarea lg (6 rows), max 1000 chars | Yes |

---

## Submit

"Send message" — primary md.

On submit:
1. Button → "Sending…" + spinner
2. `POST /api/contact`
3. Success → show inline success block (replace form):
```
    [CheckCircle 48px, success]

    Message sent

    We'll reply to [email] within 1–2 business days.

    [Back to home]
```

4. Error → Toast error.

**This replaces the current fake `setTimeout` implementation.**

---

## Validation

Required fields on submit. Email format on blur. Message minimum 10 characters.

---

## State machine

```
IDLE → SUBMITTING → SUCCESS
SUBMITTING → ERROR → IDLE
```

---

## Meta

```
<title>Contact | 3dthium</title>
<meta name="description" content="Get in touch with the 3dthium team. We reply within 1–2 business days." />
```
