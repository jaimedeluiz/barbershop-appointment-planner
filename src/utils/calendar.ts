import { Booking, ShopSettings } from '../types';

export const formatIsoForCalendar = (dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
};

export const getGoogleCalendarUrl = (booking: Booking, settings: ShopSettings): string => {
  const startIso = formatIsoForCalendar(booking.date, booking.startTime);
  const endIso = formatIsoForCalendar(booking.date, booking.endTime);
  const title = encodeURIComponent(`${settings.shopName} - ${booking.serviceNames.join(', ')}`);
  const details = encodeURIComponent(
    `Barber: ${booking.barberName}\nReference: ${booking.id}\nDuration: ${booking.totalDurationMinutes} mins\nTotal: $${booking.totalPrice}\n\nNotes: ${booking.notes || 'None'}`
  );
  const location = encodeURIComponent(settings.address);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
};

export const downloadIcsFile = (booking: Booking, settings: ShopSettings): void => {
  const startIso = formatIsoForCalendar(booking.date, booking.startTime);
  const endIso = formatIsoForCalendar(booking.date, booking.endTime);
  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Crown and Blade//Barbershop Booking App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.id}-${Date.now()}@crownandblade.com`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${settings.shopName} Appointment: ${booking.serviceNames.join(', ')}`,
    `DESCRIPTION:Barber: ${booking.barberName}\\nConfirmation ID: ${booking.id}\\nServices: ${booking.serviceNames.join(', ')}\\nTotal Price: $${booking.totalPrice}\\nShop Phone: ${settings.phone}`,
    `LOCATION:${settings.address}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Crown & Blade Appointment Tomorrow',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `crown-and-blade-${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

