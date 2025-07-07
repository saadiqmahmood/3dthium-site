# Shipping Integration Setup Guide

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Shippo Configuration
SHIPPO_API_KEY=your_shippo_api_key

# Business Address (Update with your actual address)
BUSINESS_NAME=3Dthium
BUSINESS_STREET=123 Business Street
BUSINESS_CITY=London
BUSINESS_STATE=England
BUSINESS_POSTCODE=SW1A 1AA
BUSINESS_PHONE=+44 20 1234 5678
BUSINESS_EMAIL=orders@3dthium.com
```

## Database Migrations

Run these SQL migrations in your Supabase database:

1. **Add shipping to orders table:**
```sql
-- Run the contents of database/add_shipping_to_orders.sql
```

2. **Add shipping to checkout_carts table:**
```sql
-- Run the contents of database/add_shipping_to_checkout_carts.sql
```

## Shippo Setup

1. **Sign up for Shippo**: Go to [shippo.com](https://shippo.com) and create an account
2. **Get API Key**: Navigate to Settings > API Keys and copy your test/live key
3. **Configure Royal Mail**: In Shippo dashboard, enable Royal Mail as a carrier
4. **Test Integration**: Use the test API key first, then switch to live

## Business Address Configuration

Update the business address in `pages/api/shipping/rates.ts` with your actual address:

```typescript
const address_from: ShippingAddress = {
  name: 'Your Business Name',
  street1: 'Your Street Address',
  city: 'Your City',
  state: 'Your County',
  zip: 'Your Postcode',
  country: 'GB',
  phone: 'Your Phone',
  email: 'Your Email'
}
```

## Testing the Integration

1. **Start the development server**: `npm run dev`
2. **Add items to cart** and go to checkout
3. **Fill in shipping address** and test rate calculation
4. **Complete a test purchase** to verify the full flow

## Deployment Checklist

- [ ] Add environment variables to production
- [ ] Run database migrations
- [ ] Update business address in production code
- [ ] Test shipping rate calculation
- [ ] Test complete checkout flow
- [ ] Verify order creation with shipping info

## Admin Features

The admin panel will now show:
- Shipping address for each order
- Shipping method and cost
- Tracking information (when available)
- Option to generate shipping labels

## Next Steps

1. **Customize shipping rates** based on your business needs
2. **Add more carriers** if needed (DHL, UPS, etc.)
3. **Implement shipping label generation** in admin panel
4. **Add email notifications** with tracking information
5. **Set up automated fulfillment** workflows 