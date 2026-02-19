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
  const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
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