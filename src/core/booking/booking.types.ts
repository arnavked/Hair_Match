export interface Stylist {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
  specialties: string[];
}

export interface TimeSlot {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  available: boolean;
}

export interface BookingUserDetails {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface BookingRequest {
  styleId: string;
  stylistId: string;
  timeSlotId: string;
  userDetails: BookingUserDetails;
}

export interface BookingResult {
  success: boolean;
  confirmationNumber?: string;
  error?: string;
}
