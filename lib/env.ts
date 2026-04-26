import { z } from 'zod'

const schema = z.object({
  // Server-only
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  SHIPPO_API_KEY: z.string().min(1, 'SHIPPO_API_KEY is required'),
  NEXT_PUBLIC_BASE_URL: z.string().url('NEXT_PUBLIC_BASE_URL must be a valid URL'),

  // Public (available in browser bundles)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required'),

  // Optional
  SHIPPO_WEBHOOK_SECRET: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

// Validate at module load — fails loudly in dev/prod if anything is missing.
// On the client only public vars are available; skip server-only validation there.
function parseEnv() {
  if (typeof window !== 'undefined') {
    // Client-side: only validate public vars
    const clientSchema = schema.pick({
      NEXT_PUBLIC_BASE_URL: true,
      NEXT_PUBLIC_SUPABASE_URL: true,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: true,
      NODE_ENV: true,
    })
    const result = clientSchema.safeParse(process.env)
    if (!result.success) {
      console.error('[env] Missing public environment variables:', result.error.format())
    }
  } else {
    // Server-side: validate everything
    const result = schema.safeParse(process.env)
    if (!result.success) {
      const missing = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`)
      throw new Error(`[env] Missing or invalid environment variables:\n${missing.join('\n')}`)
    }
  }

  return process.env as unknown as z.infer<typeof schema>
}

export const env = parseEnv()
