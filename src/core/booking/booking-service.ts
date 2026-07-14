import type { Stylist, TimeSlot, BookingRequest, BookingResult } from './booking.types';

const MOCK_STYLISTS: Stylist[] = [
  {
    id: 'stylist-1',
    name: 'Emma Chen',
    rating: 4.9,
    reviewCount: 124,
    imageUrl: null,
    specialties: ['Layers', 'Color', 'Balayage']
  },
  {
    id: 'stylist-2',
    name: 'Marcus Johnson',
    rating: 4.8,
    reviewCount: 89,
    imageUrl: null,
    specialties: ['Fades', 'Crops', 'Textured']
  },
  {
    id: 'stylist-3',
    name: 'Sarah Kim',
    rating: 4.9,
    reviewCount: 201,
    imageUrl: null,
    specialties: ['Bobs', 'Precision Cuts']
  }
];

export class BookingService {
  /**
   * Fetch a list of stylists that can perform the specified style.
   */
  static async getStylists(_styleId: string): Promise<Stylist[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));
    // In a real app, we'd filter based on _styleId
    return [...MOCK_STYLISTS];
  }

  /**
   * Fetch available time slots for a specific stylist on a given date.
   */
  static async getAvailableTimeSlots(_stylistId: string, date: Date): Promise<TimeSlot[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const slots: TimeSlot[] = [];
    // Generate some mock slots starting from 9 AM to 5 PM
    const startHour = 9;
    const endHour = 17;
    
    // Create a base date for the slots using the provided date
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        // Randomly make some slots unavailable based on a seeded logic or Math.random
        const isAvailable = Math.random() > 0.3; // 70% availability
        
        const startTime = new Date(baseDate);
        startTime.setHours(hour, min);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(min + 30);
        
        slots.push({
          id: `slot-${hour}-${min}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          available: isAvailable
        });
      }
    }
    
    return slots;
  }

  /**
   * Submit a booking request.
   */
  static async submitBooking(request: BookingRequest): Promise<BookingResult> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!request.userDetails.name || !request.userDetails.phone) {
      return {
        success: false,
        error: 'Name and phone are required'
      };
    }
    
    // Generate a random confirmation number
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let confirmationNumber = '';
    for (let i = 0; i < 6; i++) {
      confirmationNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return {
      success: true,
      confirmationNumber
    };
  }
}
