
import { PickupDetail } from "@/types/pickup";

/**
 * Gets the available pickup days across all categories
 * Takes the intersection of pickup days from all categories
 */
export const getCommonPickupDays = (categories: any[]): number[] => {
  // If no categories have pickup days defined, return empty array
  if (!categories || categories.length === 0) {
    return [];
  }

  // Filter out categories without pickup days
  const categoriesWithPickupDays = categories.filter(
    (cat) => cat.pickup_days && cat.pickup_days.length > 0
  );

  // If no categories have pickup days, return empty array
  if (categoriesWithPickupDays.length === 0) {
    return [];
  }

  // Start with the first category's pickup days
  let commonDays = [...categoriesWithPickupDays[0].pickup_days];

  // Find intersection with other categories' pickup days
  for (let i = 1; i < categoriesWithPickupDays.length; i++) {
    commonDays = commonDays.filter((day) =>
      categoriesWithPickupDays[i].pickup_days.includes(day)
    );
  }

  return commonDays;
};

/**
 * Gets available pickup details across all categories
 * For locations that appear in multiple categories, we take the superset of times
 */
export const getCommonPickupLocations = (categories: any[]): PickupDetail[] => {
  // If no categories have pickup details defined, return empty array
  if (!categories || categories.length === 0) {
    return [];
  }

  // Filter categories that have custom pickup details
  const categoriesWithPickup = categories.filter(
    (cat) => cat.has_custom_pickup && cat.pickup_details && cat.pickup_details.length > 0
  );

  // If no categories have pickup details, return empty array
  if (categoriesWithPickup.length === 0) {
    return [];
  }

  // Map to collect all unique locations with their associated times
  const locationMap = new Map<string, Set<string>>();

  // Gather all locations and times
  categoriesWithPickup.forEach((category) => {
    category.pickup_details.forEach((detail: PickupDetail) => {
      if (!locationMap.has(detail.location)) {
        locationMap.set(detail.location, new Set<string>());
      }
      locationMap.get(detail.location)?.add(detail.time);
    });
  });

  // Convert map to array of PickupDetail objects
  const result: PickupDetail[] = [];
  locationMap.forEach((times, location) => {
    // Sort times for consistency
    const sortedTimes = Array.from(times).sort();
    sortedTimes.forEach(time => {
      result.push({ location, time });
    });
  });

  return result;
};

/**
 * Checks if a date is a valid pickup day based on common pickup days
 */
export const isValidPickupDate = (date: Date, commonPickupDays: number[]): boolean => {
  // If no common pickup days, no dates are valid
  if (!commonPickupDays || commonPickupDays.length === 0) {
    return false;
  }

  const dayOfWeek = date.getDay();
  return commonPickupDays.includes(dayOfWeek);
};

/**
 * Finds the next valid pickup date starting from the given date
 */
export const getNextValidPickupDate = (startDate: Date, commonPickupDays: number[]): Date => {
  // If no common pickup days, return null
  if (!commonPickupDays || commonPickupDays.length === 0) {
    // Default to today if no valid days
    return startDate;
  }

  // Sort days for finding next day (0=Sunday, 1=Monday, etc.)
  const sortedDays = [...commonPickupDays].sort((a, b) => a - b);
  
  const today = new Date(startDate);
  const dayOfWeek = today.getDay();
  
  // Check if today is a valid pickup day
  if (sortedDays.includes(dayOfWeek)) {
    return today;
  }
  
  // Find the next valid day
  const nextDays = sortedDays.filter(day => day > dayOfWeek);
  
  if (nextDays.length > 0) {
    // There's a valid day later this week
    const daysToAdd = nextDays[0] - dayOfWeek;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  } else {
    // Need to go to next week
    const daysToAdd = (7 - dayOfWeek) + sortedDays[0];
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  }
};
