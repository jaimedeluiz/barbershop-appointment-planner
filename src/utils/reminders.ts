import { Booking, ShopSettings } from '../types';
import { formatDateDisplay, formatTime12h } from './timeSlots';

/**
 * Checks if an appointment is upcoming within the next 24 hours
 */
export const isWithin24Hours = (dateStr: string, timeStr: string): boolean => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const appointmentTime = new Date(year, month - 1, day, hours, minutes).getTime();
  const now = Date.now();

  const diffMs = appointmentTime - now;
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  // Within the next 24 hours and not in the past
  return hoursRemaining > 0 && hoursRemaining <= 24;
};

/**
 * Generates formatted subject and body for a 24-hour email reminder
 */
export const generateEmailReminder = (booking: Booking, settings: ShopSettings) => {
  const subject = `Reminder: Your appointment tomorrow at ${settings.shopName} (${booking.id})`;
  const body = [
    `Dear ${booking.customerName},`,
    '',
    `This is a friendly reminder of your upcoming grooming appointment at ${settings.shopName}.`,
    '',
    `----------------------------------------`,
    `APPOINTMENT DETAILS:`,
    `Reference ID: ${booking.id}`,
    `Service: ${booking.serviceNames.join(' + ')}`,
    `Artisan / Barber: ${booking.barberName}`,
    `Date: ${formatDateDisplay(booking.date)}`,
    `Time: ${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`,
    `Duration: ${booking.totalDurationMinutes} minutes`,
    `Amount Due at Salon: $${booking.totalPrice}`,
    `----------------------------------------`,
    '',
    `Location: ${settings.address}`,
    `Shop Phone: ${settings.phone}`,
    '',
    `Need to reschedule or make changes? Use your booking ID on our website or call us directly.`,
    '',
    `Warm regards,`,
    `${settings.shopName}`,
  ].join('\n');

  return {
    subject,
    body,
    mailtoUrl: `mailto:${booking.customerEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
};

/**
 * Request HTML5 Web Notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

/**
 * Trigger immediate native browser notification for an appointment
 */
export const triggerBrowserNotification = (booking: Booking, settings: ShopSettings): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(`${settings.shopName} - Appointment Reminder`, {
      body: `Hi ${booking.customerName}, your appointment for ${booking.serviceNames.join(', ')} is scheduled for ${formatDateDisplay(booking.date)} at ${formatTime12h(booking.startTime)}.`,
      icon: '/vite.svg',
    });
    return true;
  } catch {
    return false;
  }
};

