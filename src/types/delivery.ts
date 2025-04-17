
import { Tables } from "@/integrations/supabase/types/tables";

export type DeliverySchedule = {
  id: string;
  vendor_id: string;
  day_of_week: number;
  active: boolean;
  created_at?: string;
  activated_slots?: string[];
};

export type DeliveryTimeBooking = {
  id: string;
  order_id: string;
  category_id: string;
  delivery_date: string;
  time_slot: string;
  created_at?: string;
};

export type TimeSlot = {
  time: string;
  available: boolean;
};

export type DeliveryTimeSlotSelection = {
  categoryId: string;
  date: Date;
  timeSlot: string | null;
};

// For mapping day numbers to names
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

// Helper function to generate time slots
export function generateTimeSlots(
  startTime: string = '09:00',
  endTime: string = '18:00',
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  let current = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);

  while (current < end) {
    slots.push(current.toTimeString().substring(0, 5));
    current = new Date(current.getTime() + intervalMinutes * 60000);
  }

  return slots;
}

// Helper to generate predefined time slots
export function generateFixedTimeSlots(
  startTime: string = '09:00', 
  endTime: string = '18:00', 
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
  let current = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);

  while (current < end) {
    slots.push(current.toTimeString().substring(0, 5));
    current = new Date(current.getTime() + intervalMinutes * 60000);
  }

  return slots;
}

// Helper to format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const hour = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`;
}
