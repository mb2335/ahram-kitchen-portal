
import type { Tables } from './tables';

export interface Database {
  public: {
    Tables: {
      [K in keyof Tables]: Tables[K]
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
