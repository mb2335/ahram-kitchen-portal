
export interface TimeSlot {
  id: string;
  start_time: string; // Format: HH:MM (24-hour)
  end_time: string;   // Format: HH:MM (24-hour)
  available: boolean;
  booked_by?: string; // Order ID if booked
  date?: string;      // ISO date string if slot is for a specific date
}

export interface DeliverySchedule {
  id: string;
  category_id?: string;
  day_of_week: number; // 0-6 (Sunday to Saturday)
  time_slots: TimeSlot[];
  active: boolean;
}
