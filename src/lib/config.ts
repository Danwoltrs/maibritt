// Configuration management with environment variable validation

interface AppConfig {
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  development: boolean
}

// Helper function to get environment variable with fallback
const getEnvVar = (key: string, fallback?: string): string => {
  const value = process.env[key] || fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Create configuration with proper error handling
const createConfig = (): AppConfig => {
  // Use process.env directly which should work with Next.js env config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fpzhswuivxkrtyrxussw.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemhzd3VpdnhrcnR5cnh1c3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODM0NzMsImV4cCI6MjA3NDY1OTQ3M30.3yKVC4cEaJQAcix3WcdqWmWb-oNx28wev3pfOTaDJ2g'
  
  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    development: process.env.NODE_ENV === 'development'
  }
}

export const config = createConfig()

// Export convenience flags
export const isProduction = process.env.NODE_ENV === 'production'
export const isDevelopment = process.env.NODE_ENV === 'development'