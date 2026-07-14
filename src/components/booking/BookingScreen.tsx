import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookingService } from '@/core/booking';
import type { Stylist, TimeSlot } from '@/core/booking';

type BookingStep = 'stylist' | 'time' | 'details' | 'confirmation';

interface BookingScreenProps {
  styleId: string;
  styleName: string;
  onClose: () => void;
  onHome: () => void;
}

export function BookingScreen({ styleId, styleName, onClose, onHome }: BookingScreenProps) {
  const { t } = useTranslation();
  
  const [step, setStep] = useState<BookingStep>('stylist');
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  
  // Selections
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Details Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);

  // Load stylists on mount
  useEffect(() => {
    let mounted = true;
    BookingService.getStylists(styleId).then((data) => {
      if (mounted) setStylists(data);
    });
    return () => { mounted = false; };
  }, [styleId]);

  // Load time slots when stylist/date changes
  useEffect(() => {
    let mounted = true;
    if (selectedStylist) {
      BookingService.getAvailableTimeSlots(selectedStylist.id, selectedDate).then((data) => {
        if (mounted) {
          setTimeSlots(data);
          setSelectedTimeSlot(null);
        }
      });
    }
    return () => { mounted = false; };
  }, [selectedStylist, selectedDate]);

  const handleSelectStylist = (stylist: Stylist) => {
    setSelectedStylist(stylist);
    setStep('time');
  };

  const handleSelectTimeSlot = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!name || !phone) {
      setError(t('booking.errorFields'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    
    const result = await BookingService.submitBooking({
      styleId,
      stylistId: selectedStylist!.id,
      timeSlotId: selectedTimeSlot!.id,
      userDetails: { name, phone, notes }
    });
    
    setIsSubmitting(false);
    if (result.success && result.confirmationNumber) {
      setConfirmationNumber(result.confirmationNumber);
      setStep('confirmation');
    } else {
      setError(result.error || t('errors.generic'));
    }
  };

  return (
    <div className="booking-screen">
      <div className="booking-header">
        <button className="btn-icon" onClick={step === 'stylist' || step === 'confirmation' ? onClose : () => {
          if (step === 'time') setStep('stylist');
          if (step === 'details') setStep('time');
        }}>
          {step === 'stylist' || step === 'confirmation' ? '✕' : '←'}
        </button>
        <h2>{t('booking.title')}</h2>
        <div className="style-name-badge">{styleName}</div>
      </div>

      <div className="booking-content">
        {/* Step 1: Stylist */}
        {step === 'stylist' && (
          <div className="booking-step fade-in">
            <h3>{t('booking.selectStylist')}</h3>
            <div className="stylist-list">
              {stylists.length === 0 ? (
                <div className="processing-spinner" />
              ) : (
                stylists.map(stylist => (
                  <button 
                    key={stylist.id} 
                    className="stylist-card"
                    onClick={() => handleSelectStylist(stylist)}
                  >
                    <div className="stylist-avatar">
                      {stylist.imageUrl ? <img src={stylist.imageUrl} alt={stylist.name} /> : <div className="avatar-placeholder">👤</div>}
                    </div>
                    <div className="stylist-info">
                      <h4>{stylist.name}</h4>
                      <div className="stylist-rating">
                        ⭐ {stylist.rating} ({stylist.reviewCount} {t('booking.reviews')})
                      </div>
                      <div className="stylist-specialties">
                        {stylist.specialties.join(' • ')}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {step === 'time' && (
          <div className="booking-step fade-in">
            <h3>{t('booking.selectTime')}</h3>
            
            <div className="date-picker-wrap">
              <input 
                type="date" 
                value={selectedDate.toISOString().split('T')[0]}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="date-input"
              />
            </div>

            <div className="time-slots-grid">
              {timeSlots.length === 0 ? (
                <div className="processing-spinner" />
              ) : (
                timeSlots.map(slot => {
                  const d = new Date(slot.startTime);
                  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={slot.id}
                      disabled={!slot.available}
                      className={`time-slot-chip ${!slot.available ? 'unavailable' : ''}`}
                      onClick={() => handleSelectTimeSlot(slot)}
                    >
                      {timeStr}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <div className="booking-step fade-in">
            <h3>{t('booking.enterDetails')}</h3>
            
            <div className="booking-form">
              <div className="form-group">
                <label>{t('booking.name')}</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="form-group">
                <label>{t('booking.phone')}</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="form-group">
                <label>{t('booking.notes')}</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                className="btn btn-primary btn-submit-booking" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('booking.processing') : t('booking.submit')}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirmation' && (
          <div className="booking-step confirmation-step fade-in">
            <div className="success-icon">✨</div>
            <h3>{t('booking.confirmation')}</h3>
            <p>{t('booking.successMessage')}</p>
            <div className="confirmation-number">
              {confirmationNumber}
            </div>
            
            <button className="btn btn-primary btn-home" onClick={onHome}>
              {t('booking.returnHome')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
