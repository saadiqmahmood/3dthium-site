# Component: Toast

_Refining the existing `components/ui/Toast.tsx`._

---

## Anatomy

```
┌──────────────────────────────────────────────┐
│  [Icon]  Message text                  [×]   │
└──────────────────────────────────────────────┘
```

---

## Position

```
position: fixed
bottom: space-6 (24px)
right: space-6 (24px)
z-index: z-toast (600)
```

On mobile (< 640px): centered horizontally (`left: 50%; transform: translateX(-50%)`), `bottom: space-20` to avoid the browser toolbar.

---

## Variants

### Success
```
bg: surface (#ffffff)
border: 1px solid success-border (#bbf7d0)
text: success (#16a34a)
icon: CheckCircle (16px, success colour)
```

### Error
```
bg: danger-subtle (#fef2f2)
border: 1px solid danger-border (#fecaca)
text: danger (#dc2626)
icon: XCircle (16px, danger colour)
```

### Info (add this variant)
```
bg: info-subtle (#eff6ff)
border: 1px solid info-border (#bfdbfe)
text: info (#2563eb)
icon: InfoIcon (16px, info colour)
```

### Warning (add this variant)
```
bg: warning-subtle (#fefce8)
border: 1px solid warning-border (#fde68a)
text: warning (#ca8a04)
icon: AlertTriangle (16px, warning colour)
```

---

## Dimensions & Spacing

```
border-radius: radius-md (8px)
padding: px-4 py-3
min-width: 240px
max-width: 380px
shadow: shadow-md
gap between icon and text: space-2 (8px)
```

---

## Dismiss

### Auto-dismiss
Default: 4000ms. The progress/time is not shown visually (no timer bar needed for this app's scope).

### Manual dismiss
`×` button (icon button sm) at right of toast.
`aria-label="Dismiss notification"`

---

## Animation

**Enter**: slide up from bottom + fade in (`translateY(8px) → 0`, `opacity 0 → 1`), 200ms.
**Exit**: fade out + slide down, 150ms.
`prefers-reduced-motion`: fade only.

---

## Stacking

When multiple toasts exist simultaneously, stack them with `space-y-2` (8px) above the first. Max 3 toasts at once — oldest dismissed automatically when 4th arrives.

---

## Accessibility

```tsx
<div
  role="status"       // success, info, warning (polite)
  aria-live="polite"  // or "assertive" for errors
>
  ...
</div>
```

Use `role="alert"` + `aria-live="assertive"` for error toasts only (interrupts screen reader). Use `role="status"` + `aria-live="polite"` for success/info/warning.

The dismiss button must be keyboard reachable and have `aria-label`.

---

## API (props spec for frontend)

```ts
type ToastProps = {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number  // ms, default 4000
  onClose: () => void
}
```

Managed by a `ToastContext` at `_app.tsx` level. Components call `useToast().show({ message, type })`.
