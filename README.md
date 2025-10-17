# 3dthium - Multi-Category E-commerce Platform

A modern e-commerce platform built with Next.js, Supabase, and Drizzle ORM, supporting multiple product categories with dynamic attributes.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for local PostgreSQL)
- Supabase account

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your keys
   ```

3. **Start local database:**
   ```bash
   docker-compose up -d
   npm run db:push
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Database Studio: `npm run db:studio`

## 📚 Documentation

📖 **[Full Documentation](docs/README.md)** - Complete guides and references

### Quick Links
- **[Drizzle Quick Start](docs/drizzle/DRIZZLE_QUICKSTART.md)** ⭐ - Database setup
- **[Daily Commands](docs/drizzle/DRIZZLE_COMMANDS.md)** - Common tasks
- **[Product Upload Guide](docs/product-upload/PRODUCT_UPLOAD_COMPLETE.md)** - Image management
- **[Troubleshooting](docs/drizzle/QUICK_FIX.md)** - Common issues

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth
- **Payment:** Stripe
- **Shipping:** Shippo

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes (dev)
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate migrations (prod)
npm run db:migrate       # Run migrations (prod)
npm run db:seed          # Seed test data
npm run db:reset         # Reset database

# Docker
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop PostgreSQL
docker-compose logs      # View logs
```

## 🏗️ Project Structure

```
3dthium/
├── components/          # React components
│   ├── admin/          # Admin UI (categories, products, images)
│   ├── auth/           # Authentication
│   ├── sections/       # Homepage sections
│   └── ui/             # Reusable UI components
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── admin/          # Admin pages
│   └── *.tsx           # Public pages
├── drizzle/            # Database
│   ├── schema.ts       # Database schema
│   ├── migrate.ts      # Migration runner
│   └── seed.ts         # Test data
├── lib/                # Core libraries
│   ├── db.ts           # Drizzle client
│   └── supabaseClient.ts  # Supabase client
├── context/            # React contexts
├── styles/             # CSS styles
├── docs/               # Documentation
└── database/           # Legacy SQL scripts
```

## 🎯 Features

### Admin Features
- ✅ Category management (hierarchical)
- ✅ Dynamic product attributes per category
- ✅ Multi-image upload with auto-cropping
- ✅ Product creation wizard
- ✅ Order management
- ✅ User management

### Customer Features
- ✅ Browse products by category
- ✅ Shopping cart
- ✅ Stripe checkout
- ✅ Order tracking
- ✅ Custom order requests

### Developer Features
- ✅ Type-safe database queries (Drizzle)
- ✅ Local development with Docker
- ✅ Drizzle Studio for data management
- ✅ Hot module replacement
- ✅ Environment-based configuration

## 🔧 Configuration

### Environment Variables

See `env.example` for all required variables:

```bash
# Database (local or Supabase)
DATABASE_URL="postgresql://..."

# Supabase (Storage & Auth)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
STRIPE_SECRET_KEY="..."

# Shippo
SHIPPO_API_KEY="..."
```

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

Database will automatically use Supabase in production.

### Manual Deployment

```bash
npm run build
npm run start
```

## 🆘 Support

- **Documentation:** [docs/README.md](docs/README.md)
- **Issues:** Check [Troubleshooting Guide](docs/drizzle/QUICK_FIX.md)
- **Database:** [Drizzle Commands](docs/drizzle/DRIZZLE_COMMANDS.md)

## 📄 License

MIT

---

**Built with ❤️ using Next.js, Supabase, and Drizzle ORM**
