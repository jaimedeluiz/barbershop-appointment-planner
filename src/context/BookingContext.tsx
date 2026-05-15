import React, { createContext, useContext, useState, useMemo } from 'react';
import { Service, Booking, TimeSlot } from '../types';
import { storage } from '../services/storage';
import { minutesToTime, timeToMinutes } from '../utils/timeSlots';
import { sendBookingConfirmationEmail } from '../services/emailService';

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface BookingContextType {
  // Booking state
  step: number;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  
  // Selections
  selectedServices: Service[];
  toggleService: (service: Service) => void;
  clearServices: () => void;
  
  selectedBarberId: string; // 'any' or barber.id
  setSelectedBarberId: (id: string) => void;
  
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  
  selectedSlot: TimeSlot | null;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  
  customerInfo: CustomerInfo;
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
  
  // Computed values
  totalDurationMinutes: number;
  totalPrice: number;
  totalDiscount: number;
  calculatedEndTime: string;
  
  // Validation
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  isStep3Valid: boolean;
  isStep4Valid: boolean;
  
  // Finalize
  isSubmitting: boolean;
  createBooking: () => Promise<Booking | null>;
  confirmedBooking: Booking | null;
  setConfirmedBooking: (b: Booking | null) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('any');
  
  // Default to today
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Toggle service selection with intelligent bundle awareness
  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }

      // If selecting a bundle, remove individual services that the bundle already contains
      if (service.isBundle && service.bundledServiceIds) {
        const filtered = prev.filter((s) => !service.bundledServiceIds!.includes(s.id));
        return [...filtered, service];
      }

      // If selecting an individual service, check if we currently have a bundle that includes it
      const filtered = prev.filter(
        (s) => !(s.isBundle && s.bundledServiceIds && s.bundledServiceIds.includes(service.id))
      );

      return [...filtered, service];
    });

    // Reset selected slot whenever duration might change
    setSelectedSlot(null);
  };

  const clearServices = () => {
    setSelectedServices([]);
    setSelectedSlot(null);
  };

  // Compute total duration, total price, discounts
  const { totalDurationMinutes, totalPrice, totalDiscount } = useMemo(() => {
    if (selectedServices.length === 0) {
      return { totalDurationMinutes: 0, totalPrice: 0, totalDiscount: 0 };
    }

    let duration = 0;
    let price = 0;
    let discount = 0;

    selectedServices.forEach((s) => {
      duration += s.durationMinutes;
      price += s.price;
      if (s.discountAmount) {
        discount += s.discountAmount;
      }
    });

    return {
      totalDurationMinutes: duration,
      totalPrice: price,
      totalDiscount: discount,
    };
  }, [selectedServices]);

  // Compute end time based on selected slot start time and total duration
  const calculatedEndTime = useMemo(() => {
    if (!selectedSlot) return '';
    const startMins = timeToMinutes(selectedSlot.time);
    const endMins = startMins + totalDurationMinutes;
    return minutesToTime(endMins);
  }, [selectedSlot, totalDurationMinutes]);

  // Step validation
  const isStep1Valid = selectedServices.length > 0;
  const isStep2Valid = Boolean(selectedBarberId);
  const isStep3Valid = Boolean(selectedSlot && selectedSlot.available);
  const isStep4Valid = customerInfo.name.trim().length >= 2 && customerInfo.phone.replace(/\D/g, '').length >= 7;

  const nextStep = () => {
    if (step === 1 && !isStep1Valid) return;
    if (step === 2 && !isStep2Valid) return;
    if (step === 3 && !isStep3Valid) return;
    if (step < 4) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Create booking with double-booking prevention check right before saving
  const createBooking = async (): Promise<Booking | null> => {
    if (!isStep1Valid || !isStep3Valid || !isStep4Valid || !selectedSlot) {
      return null;
    }

    setIsSubmitting(true);
    try {
      // Simulate slight realistic network debounce (250ms)
      await new Promise((res) => setTimeout(res, 250));

      const barbers = storage.getBarbers();
      const existingBookings = storage.getBookings();

      // Resolve final barber
      let finalBarberId = selectedBarberId;
      if (selectedBarberId === 'any') {
        finalBarberId = selectedSlot.assignedBarberId || barbers[0]?.id || 'barber-marcus';
      }

      const assignedBarber = barbers.find((b) => b.id === finalBarberId) || barbers[0];

      // Double-check race condition conflict
      const startMins = timeToMinutes(selectedSlot.time);
      const endMins = startMins + totalDurationMinutes;

      const conflict = existingBookings.some((b) => {
        if (b.status === 'cancelled') return false;
        if (b.date !== selectedDate) return false;
        if (b.barberId !== finalBarberId) return false;

        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return Math.max(startMins, bStart) < Math.min(endMins, bEnd);
      });

      if (conflict) {
        alert('We apologize, but this time slot was just booked by another customer. Please select another slot.');
        setSelectedSlot(null);
        setStep(3);
        setIsSubmitting(false);
        return null;
      }

      // Generate stylish reference code e.g. "CB-7429"
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const referenceId = `CB-${randomCode}`;

      const newBooking: Booking = {
        id: referenceId,
        serviceIds: selectedServices.map((s) => s.id),
        serviceNames: selectedServices.map((s) => s.name),
        services: [...selectedServices],
        barberId: assignedBarber.id,
        barberName: assignedBarber.name,
        barberAvatar: assignedBarber.avatar,
        date: selectedDate,
        startTime: selectedSlot.time,
        endTime: calculatedEndTime,
        totalDurationMinutes,
        totalPrice,
        customerName: customerInfo.name.trim(),
        customerPhone: customerInfo.phone.trim(),
        customerEmail: customerInfo.email.trim() || undefined,
        notes: customerInfo.notes.trim() || undefined,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      storage.addBooking(newBooking);
      sendBookingConfirmationEmail(newBooking, storage.getSettings()).catch(() => {});
      setConfirmedBooking(newBooking);
      return newBooking;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedServices([]);
    setSelectedBarberId('any');
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setCustomerInfo({
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
  };

  return (
    <BookingContext.Provider
      value={{
        step,
        setStep,
        nextStep,
        prevStep,
        selectedServices,
        toggleService,
        clearServices,
        selectedBarberId,
        setSelectedBarberId,
        selectedDate,
        setSelectedDate,
        selectedSlot,
        setSelectedSlot,
        customerInfo,
        setCustomerInfo,
        totalDurationMinutes,
        totalPrice,
        totalDiscount,
        calculatedEndTime,
        isStep1Valid,
        isStep2Valid,
        isStep3Valid,
        isStep4Valid,
        isSubmitting,
        createBooking,
        confirmedBooking,
        setConfirmedBooking,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
