/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';
import { Booking, ShopSettings } from '../types';
import { formatDateDisplay, formatTime12h } from '../utils/timeSlots';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  enabled: boolean;
}

const EMAIL_CONFIG_KEY = 'cb_email_config_v1';

export const getEmailConfig = (): EmailConfig => {
  try {
    const saved = localStorage.getItem(EMAIL_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }

  // Fallback to Vite env variables if set
  return {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
    enabled: Boolean(import.meta.env.VITE_EMAILJS_SERVICE_ID && import.meta.env.VITE_EMAILJS_PUBLIC_KEY),
  };
};

export const saveEmailConfig = (config: EmailConfig): void => {
  localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
};

export const isEmailConfigured = (): boolean => {
  const config = getEmailConfig();
  return Boolean(config.serviceId && config.templateId && config.publicKey && config.enabled);
};

/**
 * Sends a real 24-Hour Reminder Email to the customer
 */
export const send24hReminderEmail = async (
  booking: Booking,
  shopSettings: ShopSettings
): Promise<{ success: boolean; error?: string }> => {
  if (!booking.customerEmail) {
    return { success: false, error: 'Customer has no email address' };
  }

  const config = getEmailConfig();
  if (!config.enabled || !config.serviceId || !config.templateId || !config.publicKey) {
    console.info(
      `[Email Service] Automated 24h reminder generated for ${booking.customerEmail}. (Configure EmailJS in Staff Settings to send live emails directly to inboxes).`
    );
    return {
      success: false,
      error: 'EmailJS not configured yet. Set your free EmailJS keys in Staff -> Shop Schedule -> Email Integration.',
    };
  }

  const templateParams = {
    to_email: booking.customerEmail,
    to_name: booking.customerName,
    subject: `Reminder: Your appointment tomorrow at ${shopSettings.shopName} (${booking.id})`,
    booking_id: booking.id,
    service_name: booking.serviceNames.join(' + '),
    barber_name: booking.barberName,
    appointment_date: formatDateDisplay(booking.date),
    appointment_time: `${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`,
    total_price: `$${booking.totalPrice}`,
    shop_name: shopSettings.shopName,
    shop_address: shopSettings.address,
    shop_phone: shopSettings.phone,
    message: `This is your automated reminder that your appointment is scheduled for tomorrow at ${formatTime12h(booking.startTime)}.`,
  };

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );
    return { success: response.status === 200 };
  } catch (err: any) {
    console.error('[Email Service] Error dispatching real email:', err);
    return { success: false, error: err?.text || err?.message || 'Failed to dispatch email' };
  }
};

/**
 * Sends a real booking confirmation email when appointment is first booked
 */
export const sendBookingConfirmationEmail = async (
  booking: Booking,
  shopSettings: ShopSettings
): Promise<{ success: boolean; error?: string }> => {
  if (!booking.customerEmail) {
    return { success: false, error: 'No customer email' };
  }

  const config = getEmailConfig();
  if (!config.enabled || !config.serviceId || !config.templateId || !config.publicKey) {
    return { success: false, error: 'EmailJS not configured' };
  }

  const templateParams = {
    to_email: booking.customerEmail,
    to_name: booking.customerName,
    subject: `Confirmed: Your appointment at ${shopSettings.shopName} (${booking.id})`,
    booking_id: booking.id,
    service_name: booking.serviceNames.join(' + '),
    barber_name: booking.barberName,
    appointment_date: formatDateDisplay(booking.date),
    appointment_time: `${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`,
    total_price: `$${booking.totalPrice}`,
    shop_name: shopSettings.shopName,
    shop_address: shopSettings.address,
    shop_phone: shopSettings.phone,
    message: `Thank you for booking with us! Your reservation is confirmed.`,
  };

  try {
    const response = await emailjs.send(
      config.serviceId,
      config.templateId,
      templateParams,
      config.publicKey
    );
    return { success: response.status === 200 };
  } catch (err: any) {
    return { success: false, error: err?.text || err?.message };
  }
};
