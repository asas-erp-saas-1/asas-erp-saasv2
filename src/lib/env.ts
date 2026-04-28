import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, 'Supabase URL is required').default('https://placeholder.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('placeholder'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(8).optional(),
  NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const safeUrl = (url: string | undefined) => {
  if (!url || url.includes('votre_url') || url.includes('your-project-ref')) {
    return 'https://placeholder.supabase.co';
  }
  return url;
};

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: safeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
});

export type Env = z.infer<typeof envSchema>;
