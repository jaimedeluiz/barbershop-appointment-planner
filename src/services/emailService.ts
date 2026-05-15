/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';
import { Booking, ShopSettings, SentEmailLog } from '../types';
import { formatDateDisplay, formatTime12h } from '../utils/timeSlots';
import { storage } from './storage';

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
 * Sends/Logs an automated 24-hour reminder email
 */
export const send24hReminderEmail = async (
  booking: Booking,
  shopSettings: ShopSettings
): Promise<{ success: boolean; error?: string }> => {
  if (!booking.customerEmail) {
    return { success: false, error: 'Customer has no email address' };
  }

  const subject = `Reminder: Your appointment tomorrow at ${shopSettings.shopName} (${booking.id})`;
  const body = `Hi ${booking.customerName},\n\nThis is your automated reminder that your appointment for ${booking.serviceNames.join(' + ')} with ${booking.barberName} is scheduled for tomorrow (${formatDateDisplay(booking.date)} at ${formatTime12h(booking.startTime)}).\n\nTotal: $${booking.totalPrice}\nLocation: ${shopSettings.address}\n\nSee you in the chair!`;

  // Always log to in-app outbox so the student can inspect all sent emails without needing real keys
  const emailLog: SentEmailLog = {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId: booking.id,
    toEmail: booking.customerEmail,
    toName: booking.customerName,
    type: '24h_reminder',
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'delivered',
  };
  storage.addSentEmailLog(emailLog);

  // If live EmailJS keys are provided, also dispatch over the internet
  const config = getEmailConfig();
  if (config.enabled && config.serviceId && config.templateId && config.publicKey) {
    const templateParams = {
      to_email: booking.customerEmail,
      to_name: booking.customerName,
      subject,
      booking_id: booking.id,
      service_name: booking.serviceNames.join(' + '),
      barber_name: booking.barberName,
      appointment_date: formatDateDisplay(booking.date),
      appointment_time: `${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`,
      total_price: `$${booking.totalPrice}`,
      shop_name: shopSettings.shopName,
      shop_address: shopSettings.address,
      shop_phone: shopSettings.phone,
      message: body,
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
      console.warn('[Email Service] Live dispatch failed, saved to in-app outbox:', err);
    }
  }

  return { success: true };
};

/**
 * Sends/Logs a booking confirmation email
 */
export const sendBookingConfirmationEmail = async (
  booking: Booking,
  shopSettings: ShopSettings
): Promise<{ success: boolean; error?: string }> => {
  if (!booking.customerEmail) {
    return { success: false, error: 'No customer email' };
  }

  const subject = `Confirmed: Your appointment at ${shopSettings.shopName} (${booking.id})`;
  const body = `Hi ${booking.customerName},\n\nYour appointment for ${booking.serviceNames.join(' + ')} with ${booking.barberName} is confirmed for ${formatDateDisplay(booking.date)} at ${formatTime12h(booking.startTime)}.\n\nTotal Due: $${booking.totalPrice}\nLocation: ${shopSettings.address}`;

  // Log to in-app outbox
  const emailLog: SentEmailLog = {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId: booking.id,
    toEmail: booking.customerEmail,
    toName: booking.customerName,
    type: 'booking_confirmation',
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'delivered',
  };
  storage.addSentEmailLog(emailLog);

  // If live EmailJS keys are provided, also dispatch live
  const config = getEmailConfig();
  if (config.enabled && config.serviceId && config.templateId && config.publicKey) {
    const templateParams = {
      to_email: booking.customerEmail,
      to_name: booking.customerName,
      subject,
      booking_id: booking.id,
      service_name: booking.serviceNames.join(' + '),
      barber_name: booking.barberName,
      appointment_date: formatDateDisplay(booking.date),
      appointment_time: `${formatTime12h(booking.startTime)} - ${formatTime12h(booking.endTime)}`,
      total_price: `$${booking.totalPrice}`,
      shop_name: shopSettings.shopName,
      shop_address: shopSettings.address,
      shop_phone: shopSettings.phone,
      message: body,
    };

    try {
      const response = await emailjs.send(
        config.serviceId,
        config.templateId,
        templateParams,
        config.publicKey
      );
      return { success: response.status === 200 };
    } catch {
      // safe fallback
    }
  }

  return { success: true };
};
