export type ServiceCategory = 'all' | 'cuts' | 'shaves' | 'color' | 'bundles' | 'kids';

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: 'cuts' | 'shaves' | 'color' | 'bundles' | 'kids';
  isBundle?: boolean;
  bundledServiceIds?: string[];
  discountAmount?: number;
  popular?: boolean;
  active: boolean;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatar?: string;
  bio: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  available: boolean;
  workingDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  workHours: {
    start: string; // "09:00"
    end: string;   // "19:00"
  };
  breakHours: {
    start: string; // "13:00"
    end: string;   // "14:00"
  };
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string; // e.g., "CB-4821"
  serviceIds: string[];
  serviceNames: string[];
  services: Service[];
  barberId: string; // "any" or barber.id
  barberName: string;
  barberAvatar?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "10:30"
  endTime: string; // "11:15"
  totalDurationMinutes: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
  status: BookingStatus;
  reminderSent?: boolean;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlot {
  time: string; // "10:30"
  available: boolean;
  reason?: 'booked' | 'past' | 'break' | 'shop_closed' | 'duration_exceeded';
  assignedBarberId?: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0-6
  dayName: string;
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "19:00"
}

export interface BlockedTime {
  id: string;
  date: string; // YYYY-MM-DD
  barberId?: string; // empty means entire shop
  startTime: string;
  endTime: string;
  reason: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  bufferMinutes: number; // default 5
  slotIntervalMinutes: number; // default 15
  adminPasscode: string; // default "admin123"
  schedule: Record<number, DaySchedule>;
  blockedDates: string[]; // YYYY-MM-DD
  blockedTimes: BlockedTime[];
}

