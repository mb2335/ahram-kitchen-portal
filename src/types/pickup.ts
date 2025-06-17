
export interface PickupDetail {
  id?: string;
  day: number; // 0-6 representing days of week (Sunday=0, Monday=1, etc.)
  time?: string; // Keeping original field for backward compatibility
  start_time: string;
  end_time: string;
}
