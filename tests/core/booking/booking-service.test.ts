import { describe, it, expect } from 'vitest';
import { BookingService } from '../../../src/core/booking/booking-service';

describe('BookingService', () => {
  it('should return mock stylists for a given styleId', async () => {
    const stylists = await BookingService.getStylists('style-1');
    expect(stylists).toBeDefined();
    expect(stylists.length).toBeGreaterThan(0);
    expect(stylists[0].name).toBeDefined();
  });

  it('should return available time slots for a given stylist and date', async () => {
    const date = new Date('2026-07-15T00:00:00Z');
    const slots = await BookingService.getAvailableTimeSlots('stylist-1', date);
    
    expect(slots).toBeDefined();
    expect(slots.length).toBe(16); // 9 AM to 5 PM, 30 min slots = 8 hours * 2 = 16 slots
    
    const firstSlot = slots[0];
    expect(firstSlot.id).toBe('slot-9-0');
    expect(new Date(firstSlot.startTime).getHours()).toBe(9);
    expect(typeof firstSlot.available).toBe('boolean');
  });

  it('should successfully submit a valid booking request', async () => {
    const request = {
      styleId: 'style-1',
      stylistId: 'stylist-1',
      timeSlotId: 'slot-9-0',
      userDetails: {
        name: 'Jane Doe',
        phone: '555-0192',
        notes: 'Looking forward to it!'
      }
    };
    
    const result = await BookingService.submitBooking(request);
    
    expect(result.success).toBe(true);
    expect(result.confirmationNumber).toBeDefined();
    expect(result.confirmationNumber?.length).toBe(6);
  });

  it('should reject a booking request missing name or phone', async () => {
    const request = {
      styleId: 'style-1',
      stylistId: 'stylist-1',
      timeSlotId: 'slot-9-0',
      userDetails: {
        name: '', // Missing name
        phone: '555-0192'
      }
    };
    
    const result = await BookingService.submitBooking(request);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Name and phone are required');
    expect(result.confirmationNumber).toBeUndefined();
  });
});
