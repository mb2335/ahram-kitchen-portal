
export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DeliveryTimeSlotSelection {
  categoryId: string;
  date: Date;
  timeSlot: string;
}

export const formatTime = (time: string): string => {
  // Extract hours and minutes
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;

  const hours = parseInt(match[1]);
  const minutes = match[2];
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  
  return `${hours12}:${minutes} ${period}`;
};

// Add the missing constants and functions
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate fixed time slots from 9 AM to 6 PM with 30-minute intervals
export const generateFixedTimeSlots = (): string[] => {
  const slots: string[] = [];
  const startHour = 9;  // 9 AM
  const endHour = 18;   // 6 PM
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  return slots;
};
