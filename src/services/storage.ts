import { Service, Barber, Booking, ShopSettings } from '../types';
import {
  INITIAL_SERVICES,
  INITIAL_BARBERS,
  INITIAL_SHOP_SETTINGS,
  INITIAL_BOOKINGS,
} from '../data/mockData';

const KEYS = {
  SERVICES: 'cb_services_v1',
  BARBERS: 'cb_barbers_v1',
  BOOKINGS: 'cb_bookings_v1',
  SETTINGS: 'cb_settings_v1',
};

// Dispatch event on modification to sync reactive components
const notifyStorageChange = (type: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cb_storage_update', { detail: { type } }));
  }
};

export const storage = {
  // SERVICES
  getServices(): Service[] {
    try {
      const data = localStorage.getItem(KEYS.SERVICES);
      if (!data) {
        localStorage.setItem(KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
        return INITIAL_SERVICES;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SERVICES;
    }
  },

  saveService(service: Service): void {
    const services = this.getServices();
    const index = services.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
    notifyStorageChange('services');
  },

  deleteService(serviceId: string): void {
    const services = this.getServices().filter((s) => s.id !== serviceId);
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
    notifyStorageChange('services');
  },

  // BARBERS
  getBarbers(): Barber[] {
    try {
      const data = localStorage.getItem(KEYS.BARBERS);
      if (!data) {
        localStorage.setItem(KEYS.BARBERS, JSON.stringify(INITIAL_BARBERS));
        return INITIAL_BARBERS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BARBERS;
    }
  },

  saveBarber(barber: Barber): void {
    const barbers = this.getBarbers();
    const index = barbers.findIndex((b) => b.id === barber.id);
    if (index >= 0) {
      barbers[index] = barber;
    } else {
      barbers.push(barber);
    }
    localStorage.setItem(KEYS.BARBERS, JSON.stringify(barbers));
    notifyStorageChange('barbers');
  },

  // BOOKINGS
  getBookings(): Booking[] {
    try {
      const data = localStorage.getItem(KEYS.BOOKINGS);
      if (!data) {
        localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
        return INITIAL_BOOKINGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_BOOKINGS;
    }
  },

  getBookingById(id: string): Booking | undefined {
    const bookings = this.getBookings();
    return bookings.find(
      (b) => b.id.trim().toUpperCase() === id.trim().toUpperCase()
    );
  },

  getBookingsByPhone(phone: string): Booking[] {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return [];
    return this.getBookings().filter((b) => {
      const bClean = b.customerPhone.replace(/\D/g, '');
      return bClean.includes(cleanPhone) || cleanPhone.includes(bClean);
    });
  },

  addBooking(booking: Booking): void {
    const bookings = this.getBookings();
    bookings.unshift(booking);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    notifyStorageChange('bookings');
  },

  updateBooking(updated: Booking): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === updated.id);
    if (index >= 0) {
      bookings[index] = { ...updated, updatedAt: new Date().toISOString() };
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
      notifyStorageChange('bookings');
    }
  },

  cancelBooking(id: string): boolean {
    const bookings = this.getBookings();
    const index = bookings.findIndex((b) => b.id === id);
    if (index >= 0) {
      bookings[index].status = 'cancelled';
      bookings[index].updatedAt = new Date().toISOString();
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
      notifyStorageChange('bookings');
      return true;
    }
    return false;
  },

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter((b) => b.id !== id);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    notifyStorageChange('bookings');
  },

  // SETTINGS
  getSettings(): ShopSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SHOP_SETTINGS));
        return INITIAL_SHOP_SETTINGS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SHOP_SETTINGS;
    }
  },

  saveSettings(settings: ShopSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    notifyStorageChange('settings');
  },

  // RESET
  resetDefaults(): void {
    localStorage.setItem(KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    localStorage.setItem(KEYS.BARBERS, JSON.stringify(INITIAL_BARBERS));
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SHOP_SETTINGS));
    notifyStorageChange('all');
  },
};

