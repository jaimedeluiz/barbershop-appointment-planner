import { Barber, Booking, ShopSettings, TimeSlot } from '../types';

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const formatTime12h = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Checks if a slot time on a specific date is in the past
 */
export const isPastSlot = (dateStr: string, timeStr: string): boolean => {
  const now = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  const slotDate = new Date(year, month - 1, day, hour, min);
  return slotDate.getTime() <= now.getTime();
};

/**
 * Checks if intervals [startA, endA) and [startB, endB) overlap
 */
export const intervalsOverlap = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean => {
  return Math.max(startA, startB) < Math.min(endA, endB);
};

/**
 * Checks if a barber is free for a given window
 */
export const isBarberFree = (
  barber: Barber,
  dateStr: string,
  startMins: number,
  endMins: number, // includes buffer
  bookings: Booking[],
  settings: ShopSettings,
  excludeBookingId?: string
): boolean => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  // 1. Is barber active and working on this day of week?
  if (!barber.available || !barber.workingDays.includes(dayOfWeek)) {
    return false;
  }

  // 2. Is window within barber's shift?
  const barberStart = timeToMinutes(barber.workHours.start);
  const barberEnd = timeToMinutes(barber.workHours.end);
  if (startMins < barberStart || endMins > barberEnd) {
    return false;
  }

  // 3. Does it overlap with barber's break hours?
  if (barber.breakHours) {
    const breakStart = timeToMinutes(barber.breakHours.start);
    const breakEnd = timeToMinutes(barber.breakHours.end);
    if (intervalsOverlap(startMins, endMins, breakStart, breakEnd)) {
      return false;
    }
  }

  // 4. Overlap with shop blocked times / vacation?
  const isBlocked = settings.blockedTimes?.some((block) => {
    if (block.date !== dateStr) return false;
    if (block.barberId && block.barberId !== barber.id) return false;
    const bStart = timeToMinutes(block.startTime);
    const bEnd = timeToMinutes(block.endTime);
    return intervalsOverlap(startMins, endMins, bStart, bEnd);
  });
  if (isBlocked) return false;

  // 5. Overlap with existing confirmed bookings?
  const buffer = settings.bufferMinutes || 5;
  const hasConflict = bookings.some((b) => {
    if (b.status === 'cancelled') return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.date !== dateStr) return false;
    if (b.barberId !== barber.id && b.barberId !== 'any') return false;

    const bStart = timeToMinutes(b.startTime);
    // Booking occupies its duration + buffer time
    const bEnd = timeToMinutes(b.endTime) + buffer;

    return intervalsOverlap(startMins, endMins, bStart, bEnd);
  });

  return !hasConflict;
};

/**
 * Generates all candidate time slots for a given day and duration
 */
export const generateAvailableSlots = (
  dateStr: string,
  totalDurationMinutes: number,
  selectedBarberId: string, // 'any' or specific barber.id
  barbers: Barber[],
  bookings: Booking[],
  settings: ShopSettings,
  excludeBookingId?: string
): TimeSlot[] => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  // Check if shop is open on this day
  const daySchedule = settings.schedule[dayOfWeek];
  if (!daySchedule || !daySchedule.isOpen) {
    return [];
  }

  // Check if date is globally blocked (holiday)
  if (settings.blockedDates?.includes(dateStr)) {
    return [];
  }

  const shopOpen = timeToMinutes(daySchedule.openTime);
  const shopClose = timeToMinutes(daySchedule.closeTime);
  const stepMinutes = settings.slotIntervalMinutes || 15;
  const buffer = settings.bufferMinutes || 5;

  const slots: TimeSlot[] = [];

  for (let startMins = shopOpen; startMins + totalDurationMinutes <= shopClose; startMins += stepMinutes) {
    const timeStr = minutesToTime(startMins);
    const endMins = startMins + totalDurationMinutes + buffer;

    // Is it in the past?
    if (isPastSlot(dateStr, timeStr)) {
      slots.push({
        time: timeStr,
        available: false,
        reason: 'past',
      });
      continue;
    }

    if (selectedBarberId !== 'any') {
      // Specific barber check
      const barber = barbers.find((b) => b.id === selectedBarberId);
      if (!barber) {
        slots.push({ time: timeStr, available: false, reason: 'shop_closed' });
        continue;
      }

      const free = isBarberFree(barber, dateStr, startMins, endMins, bookings, settings, excludeBookingId);
      slots.push({
        time: timeStr,
        available: free,
        reason: free ? undefined : 'booked',
        assignedBarberId: barber.id,
      });
    } else {
      // "Any available" - slot is available if at least ONE working barber is free
      const candidateBarber = barbers.find((barber) =>
        isBarberFree(barber, dateStr, startMins, endMins, bookings, settings, excludeBookingId)
      );

      if (candidateBarber) {
        slots.push({
          time: timeStr,
          available: true,
          assignedBarberId: candidateBarber.id,
        });
      } else {
        slots.push({
          time: timeStr,
          available: false,
          reason: 'booked',
        });
      }
    }
  }

  return slots;
};

