
import type { Tables as GenericTables } from './tables';

export interface Database {
  public: {
    Tables: GenericTables
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
