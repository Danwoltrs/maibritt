import { supabase } from '@/lib/supabase'

export interface AiUsageStats {
  totalCalls: number
  totalCost: number
}

export class AiUsageService {
  static async getUsageStats(): Promise<AiUsageStats> {
    try {
      const { data, error } = await supabase
        .from('ai_usage_log')
        .select('estimated_cost')

      if (error) throw error

      const rows = data || []
      return {
        totalCalls: rows.length,
        totalCost: rows.reduce((sum, r) => sum + Number(r.estimated_cost), 0),
      }
    } catch (error) {
      console.error('Error fetching AI usage stats:', error)
      return { totalCalls: 0, totalCost: 0 }
    }
  }
}
