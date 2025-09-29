import { supabase } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
}

export interface ResetPasswordRequest {
  email: string
}

export interface ChangePasswordRequest {
  newPassword: string
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn({ email, password }: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { user: null, session: null, error }
      }

      // Log successful login activity
      await this.logLoginActivity(data.user?.id, 'login_success')

      return {
        user: data.user,
        session: data.session,
        error: null
      }
    } catch (error) {
      console.error('Sign in exception:', error)
      return {
        user: null,
        session: null,
        error: error as AuthError
      }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
      }

      return { error }
    } catch (error) {
      console.error('Sign out exception:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('Get current user error:', error)
        return null
      }

      return user
    } catch (error) {
      console.error('Get current user exception:', error)
      return null
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Get current session error:', error)
        return null
      }

      return session
    } catch (error) {
      console.error('Get current session exception:', error)
      return null
    }
  }

  /**
   * Reset password via email
   */
  static async resetPassword({ email }: ResetPasswordRequest): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      })

      if (error) {
        console.error('Reset password error:', error)
      }

      return { error }
    } catch (error) {
      console.error('Reset password exception:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Update user password
   */
  static async updatePassword({ newPassword }: ChangePasswordRequest): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('Update password error:', error)
      }

      return { error }
    } catch (error) {
      console.error('Update password exception:', error)
      return { error: error as AuthError }
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getCurrentSession()
    return !!session
  }

  /**
   * Setup auth state change listener
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)

      // Log auth events
      if (event === 'SIGNED_IN' && session?.user) {
        this.logLoginActivity(session.user.id, 'session_start')
      } else if (event === 'SIGNED_OUT') {
        this.logLoginActivity(null, 'session_end')
      }
    })
  }

  /**
   * Log login activity for security monitoring
   */
  private static async logLoginActivity(
    userId: string | null,
    event: 'login_success' | 'login_failed' | 'session_start' | 'session_end'
  ): Promise<void> {
    try {
      // Get basic device/location info
      const userAgent = navigator.userAgent
      const language = navigator.language
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Note: In production, you might want to get more detailed location info
      // using a geolocation service, but for privacy reasons we keep it minimal

      const activityLog = {
        user_id: userId,
        event_type: event,
        user_agent: userAgent,
        language,
        timezone,
        timestamp: new Date().toISOString(),
        ip_address: null, // This would be handled server-side in production
      }

      // Log to console for now - in production this could go to a logging service
      console.log('Auth activity:', activityLog)

      // Optionally store in database if you have a user_activity table
      // await supabase.from('user_activity').insert(activityLog)

    } catch (error) {
      console.error('Failed to log login activity:', error)
      // Don't throw - logging failures shouldn't break auth flow
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default AuthService