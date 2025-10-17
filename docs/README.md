# 3dthium Documentation

## 📚 Table of Contents

### 🚀 Getting Started
- **[Main README](../README.md)** - Project overview and setup

### 🗄️ Database (Drizzle ORM)
- **[Quick Start Guide](drizzle/DRIZZLE_QUICKSTART.md)** ⭐ - Start here!
- **[Quick Commands Reference](drizzle/DRIZZLE_COMMANDS.md)** - Daily commands
- **[Complete Setup Guide](drizzle/DRIZZLE_COMPLETE.md)** - Full documentation
- **[Quick Fix Guide](drizzle/QUICK_FIX.md)** - Troubleshooting
- **[Local Development Strategy](LOCAL_DEVELOPMENT_STRATEGY.md)** - Architecture
- **[Full Drizzle Setup](DRIZZLE_SETUP.md)** - Detailed setup

### 📦 Product Management
- **[Product Upload System](product-upload/PRODUCT_UPLOAD_COMPLETE.md)** - Image upload & product creation

### 📄 Other Docs
- **[Shipping Setup](../SHIPPING_SETUP.md)** - Shippo integration

---

## 🎯 Quick Links

### For Daily Development
1. [Drizzle Quick Commands](drizzle/DRIZZLE_COMMANDS.md#-daily-commands)
2. [Local Development Strategy](LOCAL_DEVELOPMENT_STRATEGY.md#the-hybrid-approach)

### For New Team Members
1. [Drizzle Quick Start](drizzle/DRIZZLE_QUICKSTART.md)
2. [Product Upload System](product-upload/PRODUCT_UPLOAD_COMPLETE.md)

### For Troubleshooting
1. [Quick Fix Guide](drizzle/QUICK_FIX.md)
2. [Drizzle Complete Guide](drizzle/DRIZZLE_COMPLETE.md#-troubleshooting)

---

## 📁 Project Structure

```
3dthium/
├── docs/                          # Documentation
│   ├── drizzle/                   # Database (Drizzle ORM)
│   │   ├── DRIZZLE_QUICKSTART.md  # ⭐ Start here
│   │   ├── DRIZZLE_COMMANDS.md    # Daily commands
│   │   ├── DRIZZLE_COMPLETE.md    # Full guide
│   │   └── QUICK_FIX.md           # Troubleshooting
│   ├── product-upload/            # Product management
│   │   └── PRODUCT_UPLOAD_COMPLETE.md
│   └── README.md                  # This file
│
├── components/                    # React components
│   ├── admin/                     # Admin UI
│   │   ├── AdminLayout.tsx
│   │   ├── ImageManager.tsx       # Image upload
│   │   └── ImageUpload.tsx
│   └── sections/                  # Public sections
│
├── pages/                         # Next.js pages
│   ├── api/                       # API routes
│   │   └── admin/                 # Admin APIs
│   └── admin/                     # Admin pages
│       ├── categories.tsx         # Category management
│       └── create-product.tsx     # Product creation
│
├── drizzle/                       # Database (Drizzle)
│   ├── schema.ts                  # Database schema
│   ├── migrate.ts                 # Migration runner
│   └── seed.ts                    # Test data seeder
│
├── database/                      # SQL scripts (legacy)
│   └── *.sql                      # Manual SQL scripts
│
├── lib/                           # Core libraries
│   ├── db.ts                      # Drizzle client
│   └── supabaseClient.ts          # Supabase client
│
├── scripts/                       # Helper scripts
│   └── setup-drizzle.sh           # Drizzle setup script
│
├── drizzle.config.ts              # Drizzle configuration
├── docker-compose.yml             # Local PostgreSQL
└── env.example                    # Environment template
```

---

## 🔄 Development Workflow

### 1. **Start Development**
```bash
docker-compose up -d  # Start PostgreSQL
npm run dev           # Start Next.js
```

### 2. **Make Database Changes**
```bash
# Edit drizzle/schema.ts
npm run db:push       # Apply changes
npm run db:studio     # View changes
```

### 3. **View Data**
```bash
npm run db:studio     # Opens Drizzle Studio
```

### 4. **Stop Everything**
```bash
docker-compose down   # Stop PostgreSQL
# Ctrl+C to stop Next.js
```

---

## 🎯 Common Tasks

### Create a New Product
1. Go to `/admin/create-product`
2. Fill in details, upload images
3. Images auto-upload to Supabase Storage
4. Product saves to database

### Add a New Category
1. Go to `/admin/categories`
2. Click "Add Category"
3. Fill in details
4. Category saves to database

### Make Schema Changes
1. Edit `drizzle/schema.ts`
2. Run `npm run db:push`
3. Changes applied to database

---

## 🆘 Need Help?

1. **Quick fixes**: [docs/drizzle/QUICK_FIX.md](drizzle/QUICK_FIX.md)
2. **Full guide**: [docs/drizzle/DRIZZLE_COMPLETE.md](drizzle/DRIZZLE_COMPLETE.md)
3. **Commands**: [docs/drizzle/DRIZZLE_COMMANDS.md](drizzle/DRIZZLE_COMMANDS.md)

---

## 🎉 You're All Set!

Everything is organized and documented. Start with the [Drizzle Quick Start](drizzle/DRIZZLE_QUICKSTART.md) if you're new to the project.

