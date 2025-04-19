
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
