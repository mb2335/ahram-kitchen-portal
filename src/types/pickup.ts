export interface PickupDetail {
  time: string;
  location: string;
  [key: string]: string; // Add index signature to satisfy Json type
}