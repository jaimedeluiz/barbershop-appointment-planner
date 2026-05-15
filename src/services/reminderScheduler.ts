import { storage } from './storage';
import { formatDateDisplay, formatTime12h } from '../utils/timeSlots';
import { send24hReminderEmail } from './emailService';

/**
 * Checks if a date & time is within the next 24 hours from right now
 */
export const isWithin24Hours = (dateStr: string, timeStr: string): boolean => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const appointmentTime = new Date(year, month - 1, day, hours, minutes).getTime();
    const now = Date.now();

    const diffMs = appointmentTime - now;
    const hoursRemaining = diffMs / (1000 * 60 * 60);

    // If within 24 hours and not more than 2 hours in the past
    return hoursRemaining > -2 && hoursRemaining <= 24;
  } catch {
    return false;
  }
};

/**
 * Automatically checks all active bookings and dispatches 24h reminders
 */
export const runAutomatic24hReminderCheck = (): Array<{ id: string; customerName: string; text: string }> => {
  const bookings = storage.getBookings();
  const settings = storage.getSettings();
  const newlyDispatched: Array<{ id: string; customerName: string; text: string }> = [];

  bookings.forEach((booking) => {
    if (booking.status !== 'confirmed') return;
    if (booking.autoReminderDispatched) return;

    if (isWithin24Hours(booking.date, booking.startTime)) {
      // Mark as automatically dispatched
      booking.autoReminderDispatched = true;
      booking.autoReminderDispatchedAt = new Date().toISOString();
      storage.updateBooking(booking);

      const reminderText = `Reminder: ${booking.customerName}, your appointment for ${booking.serviceNames.join(', ')} is in 24h (${formatDateDisplay(booking.date)} at ${formatTime12h(booking.startTime)}) with ${booking.barberName}.`;

      // 1. Dispatch real email to customer inbox (via EmailJS)
      send24hReminderEmail(booking, settings).catch((err) => {
        console.warn('Auto reminder email status:', err);
      });

      // 2. Native HTML5 Notification if permitted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`${settings.shopName} (24h Automated Reminder)`, {
            body: reminderText,
            icon: '/vite.svg',
          });
        } catch {
          // safe fallback
        }
      }

      newlyDispatched.push({
        id: booking.id,
        customerName: booking.customerName,
        text: reminderText,
      });

      // 2. Dispatch custom in-app event so UI shows toast
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cb_auto_reminder_fired', {
            detail: {
              booking,
              reminderText,
            },
          })
        );
      }
    }
  });

  return newlyDispatched;
};

/**
 * Starts the automatic background reminder engine
 */
export const initAutomaticReminderScheduler = () => {
  if (typeof window === 'undefined') return () => {};

  // Request browser notification permission once quietly
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      Notification.requestPermission().catch(() => {});
    } catch {
      // safe fallback
    }
  }

  // Run initial check immediately
  runAutomatic24hReminderCheck();

  // Run periodic automated checks every 30 seconds
  const intervalId = window.setInterval(() => {
    runAutomatic24hReminderCheck();
  }, 30000);

  // Also run whenever storage updates (e.g., when an appointment is booked or rescheduled)
  const handleStorageUpdate = () => {
    runAutomatic24hReminderCheck();
  };
  window.addEventListener('cb_storage_update', handleStorageUpdate);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener('cb_storage_update', handleStorageUpdate);
  };
};

