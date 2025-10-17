#!/bin/bash

# Drizzle Setup Script
# Run this to set up your local development environment

echo "🚀 Setting up Drizzle ORM for 3dthium..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo ""
    echo "Please create .env.local with your Supabase credentials:"
    echo ""
    echo "# Database (choose one)"
    echo "# Local:"
    echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/3dthium_dev\""
    echo ""
    echo "# Or Production:"
    echo "# DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres\""
    echo ""
    echo "# Supabase (required for Storage & Auth)"
    echo "NEXT_PUBLIC_SUPABASE_URL=\"your-url\""
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=\"your-key\""
    echo "SUPABASE_SERVICE_ROLE_KEY=\"your-key\""
    echo ""
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env.local; then
    echo "⚠️  DATABASE_URL not found in .env.local"
    echo ""
    echo "Adding DATABASE_URL for local development..."
    echo "" >> .env.local
    echo "# Database - Local PostgreSQL" >> .env.local
    echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/3dthium_dev\"" >> .env.local
    echo "✅ Added DATABASE_URL to .env.local"
else
    echo "✅ DATABASE_URL already set in .env.local"
fi

echo ""
echo "🐳 Starting PostgreSQL with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Start PostgreSQL
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Check if container is running
if docker ps | grep -q "3dthium_postgres"; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ Failed to start PostgreSQL"
    echo "Run: docker-compose logs"
    exit 1
fi

echo ""
echo "📊 Pushing schema to database..."
npm run db:push

echo ""
echo "🌱 Seeding database with test data..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Start development server: npm run dev"
echo "  2. View database: npm run db:studio"
echo "  3. Stop database: docker-compose down"
echo ""
echo "🎉 Happy coding!"

