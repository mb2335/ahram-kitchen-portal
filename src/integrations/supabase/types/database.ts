
import type { Database as DatabaseDefinition } from './tables';

export interface Database {
  public: {
    Tables: {
      [K in keyof DatabaseDefinition['public']['Tables']]: DatabaseDefinition['public']['Tables'][K]
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
