# 3dthium Brand Voice & Microcopy

---

## Brand Character

3dthium is a specialist 3D-print store for people who know exactly what they want. The brand is:

- **Direct** — say what it is, don't oversell
- **Capable** — expert craft, not mass production
- **Understated** — quality speaks; the copy doesn't shout
- **Human** — made by real people, not a warehouse algorithm

Not:
- Hype-driven ("Amazing! Incredible! You'll love this!")
- Overly technical (no jargon the customer can't act on)
- Overly casual (no "hey there" or excessive exclamation marks)

---

## Tone by Context

| Context | Tone | Example |
|---------|------|---------|
| Marketing / hero | Confident, warm | "Printed to order. Built to last." |
| Product descriptions | Informative, specific | "Food-safe PLA. 0.2 mm layer height. Available in 12 colours." |
| Transactional (checkout, account) | Clear, reassuring | "Order placed. You'll receive a confirmation email shortly." |
| Errors | Honest, actionable | "We couldn't process your card. Please check your details and try again." |
| Empty states | Helpful, not apologetic | "Nothing here yet. Start by browsing our products." |
| Loading | Neutral | "Loading your orders…" |
| Admin | Functional, terse | "Product saved." / "Order marked as shipped." |

---

## Do / Don't Word List

| Do | Don't |
|----|-------|
| Add to cart | Add to bag / Add to basket |
| Remove | Delete (for cart items — "Delete" is for destructive admin actions) |
| Place order | Submit order / Complete purchase |
| Pay now | Checkout (as a verb — it's a noun; "Go to checkout" is fine) |
| Sign in | Login / Log in / Sign-in |
| Sign up | Register / Create account |
| Forgot password? | Reset password (as a link label) |
| Your orders | My orders |
| Order confirmed | Payment successful |
| Something went wrong | Error / Oops (either too vague or too cute) |
| Try again | Retry / Refresh |
| Contact us | Get in touch |
| Custom order | Custom print / Bespoke |
| Printing | Processing (for order status — say what it actually is) |
| Track shipment | Track package |

---

## Button Verb Conventions

Buttons should be imperative verbs that describe what happens next.

| Action | Label |
|--------|-------|
| Add product to cart | **Add to cart** |
| Proceed to checkout | **Go to checkout** |
| Finalise payment | **Pay now** |
| Submit custom order enquiry | **Send enquiry** |
| Submit contact form | **Send message** |
| Save admin form | **Save** (not "Submit") |
| Confirm destructive action | **Delete** (not "Yes" or "Confirm") |
| Cancel without saving | **Cancel** |
| Go back | **Back** |
| Load more products | **Load more** |
| Retry failed action | **Try again** |

---

## Error Message Style

Errors must:
1. Say what happened in plain terms
2. Tell the user what to do next
3. Never blame the user

Template: `[What failed]. [What to do next].`

| Scenario | Message |
|----------|---------|
| Payment declined | "Your payment was declined. Check your card details or try a different card." |
| Address validation failed | "We need a complete delivery address before we can continue." |
| Out of stock | "This variant is out of stock. Choose a different option or check back soon." |
| Network error | "Something went wrong. Check your connection and try again." |
| Session expired | "Your session has expired. Sign in to continue." |
| File too large (custom order) | "That file is too large. Please upload a file under 50 MB." |
| Invalid promo code | "That code isn't valid or has expired." |
| Promo code already used | "This code has already been used on your account." |
| Field required | "[Field name] is required." (e.g., "Email address is required.") |
| Invalid email | "Enter a valid email address." |

---

## Success Message Style

Successes must confirm the action and set expectations.

| Action | Message |
|--------|---------|
| Order placed | "Order confirmed. We'll email your receipt and tracking details shortly." |
| Added to cart | "Added to cart." |
| Product saved (admin) | "Product saved." |
| Category deleted (admin) | "Category deleted." |
| Password changed | "Password updated. You can now sign in with your new password." |
| Custom order sent | "Enquiry sent. We'll be in touch within 2 business days." |
| Contact form sent | "Message sent. We'll reply within 1–2 business days." |
| Email changed | "Email address updated." |

---

## Empty State Copy

| Page / context | Heading | Body | CTA |
|----------------|---------|------|-----|
| Orders (no orders) | "No orders yet" | "When you place an order, it'll appear here." | "Browse products" |
| Cart (empty) | "Your cart is empty" | "Add a product to get started." | "Browse products" |
| Products (no results) | "No products found" | "Try a different category or search term." | "Clear filters" |
| Admin — products (empty) | "No products yet" | "Add your first product to get started." | "Add product" |
| Admin — orders (empty) | "No orders yet" | — | — |
| Admin — custom orders (empty) | "No custom order enquiries" | — | — |
| Admin — users (empty) | "No users found" | — | — |
| Search — no results | "No results for "[term]"" | "Check the spelling or try a broader search." | "Clear search" |

---

## Loading Copy

Keep loading labels short and descriptive. Never show a bare spinner with no text (unless it's an inline button spinner).

| Context | Label |
|---------|-------|
| Page loading | "Loading…" (no label needed if skeleton is shown) |
| Submitting form | "Saving…" |
| Processing payment | "Processing your payment…" |
| Uploading file | "Uploading…" |
| Generating variations (admin) | "Generating…" |
| Sending email | "Sending…" |

---

## Number & Currency Format

- Currency: always `£` prefix, no space. Two decimal places. `£12.00`, `£1,250.00`.
- Price range: `£12.00 – £18.00` (en-dash, spaces each side).
- Large numbers: comma separator. `1,234 orders`.
- Dates: `12 Jan 2025` (day month year, no ordinal, abbreviated month). Not `01/12/2025`.
- Times: `14:32` (24-hour). Not `2:32 PM`.

---

## Capitalisation

- Product names: Title Case (as entered by admin).
- Category names: Title Case.
- Button labels: Sentence case. ("Add to cart" not "Add To Cart".)
- Navigation labels: Title Case. ("My Orders", "Sign In".)
- Error messages: Sentence case, ending with a period.
- Success messages: Sentence case, ending with a period.
- Page titles (`<title>`): `[Page name] | 3dthium`. E.g., `Checkout | 3dthium`.
