import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Calendar,
  User,
  AlertTriangle,
  RotateCcw,
  Download,
  Mail,
  Bell,
} from 'lucide-react';
import { Booking, TimeSlot } from '../../types';
import { storage } from '../../services/storage';
import { formatDateDisplay, formatTime12h, generateAvailableSlots } from '../../utils/timeSlots';
import { downloadIcsFile } from '../../utils/calendar';
import { generateEmailReminder } from '../../utils/reminders';

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Booking[]>([]);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  const [newDate, setNewDate] = useState<string>('');
  const [newSlot, setNewSlot] = useState<TimeSlot | null>(null);
  const [isReschedulingSaving, setIsReschedulingSaving] = useState(false);

  const settings = storage.getSettings();
  const barbers = storage.getBarbers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    const cleanQuery = query.trim();

    const byId = storage.getBookingById(cleanQuery);
    if (byId) {
      setResults([byId]);
      return;
    }

    const byPhone = storage.getBookingsByPhone(cleanQuery);
    setResults(byPhone);
  };

  const handleCancelBooking = (booking: Booking) => {
    if (
      window.confirm(
        `Cancel appointment ${booking.id} (${booking.serviceNames.join(', ')})? This will immediately free the slot.`
      )
    ) {
      storage.cancelBooking(booking.id);
      if (query.trim()) {
        const byId = storage.getBookingById(query.trim());
        if (byId) {
          setResults([byId]);
        } else {
          setResults(storage.getBookingsByPhone(query.trim()));
        }
      }
    }
  };

  const rescheduleSlots: TimeSlot[] = useMemo(() => {
    if (!reschedulingBooking || !newDate) return [];
    return generateAvailableSlots(
      newDate,
      reschedulingBooking.totalDurationMinutes,
      reschedulingBooking.barberId,
      barbers,
      storage.getBookings(),
      settings,
      reschedulingBooking.id
    );
  }, [reschedulingBooking, newDate, barbers, settings]);

  const handleConfirmReschedule = () => {
    if (!reschedulingBooking || !newSlot || !newDate) return;

    setIsReschedulingSaving(true);
    setTimeout(() => {
      const [h, m] = newSlot.time.split(':').map(Number);
      const totalMins = h * 60 + m + reschedulingBooking.totalDurationMinutes;
      const endHours = Math.floor(totalMins / 60);
      const endMinutes = totalMins % 60;
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      const updated: Booking = {
        ...reschedulingBooking,
        date: newDate,
        startTime: newSlot.time,
        endTime,
        status: 'confirmed',
      };

      storage.updateBooking(updated);

      const byId = storage.getBookingById(updated.id);
      setResults(byId ? [byId] : []);
      setReschedulingBooking(null);
      setIsReschedulingSaving(false);
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-xl p-5 sm:p-6 max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-100 dark:border-charcoal-800">
          <div>
            <h3 className="font-semibold text-base text-charcoal-900 dark:text-white">
              My Appointments
            </h3>
            <p className="text-xs text-charcoal-400">
              Lookup, reschedule, or cancel a booking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Booking ID (e.g. CB-8491) or Phone #"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-xs bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 focus:border-charcoal-500 outline-none text-charcoal-900 dark:text-white"
              />
              <Search className="w-3.5 h-3.5 stroke-[1.5] text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 text-xs font-medium transition-colors"
            >
              Search
            </button>
          </form>

          {/* Reschedule View if Active */}
          {reschedulingBooking && (
            <div className="p-3.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-charcoal-900 dark:text-white flex items-center">
                  <RotateCcw className="w-3.5 h-3.5 stroke-[1.5] mr-1" /> Rescheduling {reschedulingBooking.id}
                </span>
                <button
                  onClick={() => setReschedulingBooking(null)}
                  className="text-charcoal-400 hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-charcoal-500 mb-1">Select New Date:</label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewSlot(null);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 text-charcoal-900 dark:text-white"
                />
              </div>

              {newDate && (
                <div>
                  <label className="block text-charcoal-500 mb-1">Select New Time:</label>
                  {rescheduleSlots.filter((s) => s.available).length === 0 ? (
                    <p className="text-charcoal-400">No open slots on this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {rescheduleSlots
                        .filter((s) => s.available)
                        .map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setNewSlot(slot)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                              newSlot?.time === slot.time
                                ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950'
                                : 'bg-white dark:bg-charcoal-850 text-charcoal-800 dark:text-charcoal-200 border-charcoal-200 dark:border-charcoal-750'
                            }`}
                          >
                            {formatTime12h(slot.time)}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <button
                disabled={!newSlot || isReschedulingSaving}
                onClick={handleConfirmReschedule}
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                  newSlot && !isReschedulingSaving
                    ? 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950'
                    : 'bg-charcoal-200 dark:bg-charcoal-800 text-charcoal-400 cursor-not-allowed'
                }`}
              >
                {isReschedulingSaving ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          )}

          {/* Results List */}
          {hasSearched && results.length === 0 && !reschedulingBooking && (
            <div className="text-center py-6 text-charcoal-400 text-xs">
              <AlertTriangle className="w-5 h-5 stroke-[1.5] mx-auto mb-1.5 text-charcoal-400" />
              <p>No matching appointment found.</p>
            </div>
          )}

          {results.map((booking) => {
            const isCancelled = booking.status === 'cancelled';

            return (
              <div
                key={booking.id}
                className={`p-3.5 rounded-xl border text-left text-xs ${
                  isCancelled
                    ? 'bg-charcoal-50/50 dark:bg-charcoal-950/40 border-charcoal-100 dark:border-charcoal-850 opacity-60'
                    : 'bg-white dark:bg-charcoal-950 border-charcoal-200 dark:border-charcoal-800 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-medium text-charcoal-900 dark:text-white">
                    {booking.id}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded ${
                      isCancelled
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <p className="font-medium text-charcoal-900 dark:text-white">
                  {booking.serviceNames.join(' + ')}
                </p>

                <div className="mt-1.5 space-y-0.5 text-charcoal-400 text-[11px]">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 stroke-[1.5]" />
                    <span>Barber: {booking.barberName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 stroke-[1.5]" />
                    <span>{formatDateDisplay(booking.date)} at {formatTime12h(booking.startTime)} ({booking.totalDurationMinutes} min)</span>
                  </div>
                  {booking.customerEmail && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3 stroke-[1.5]" />
                      <a
                        href={generateEmailReminder(booking, settings).mailtoUrl}
                        className="text-copper-600 dark:text-copper-400 hover:underline"
                        title="Click to email customer"
                      >
                        {booking.customerEmail}
                      </a>
                    </div>
                  )}
                </div>

                {!isCancelled && (
                  <div className="mt-3 pt-2.5 border-t border-charcoal-100 dark:border-charcoal-850 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => downloadIcsFile(booking, settings)}
                        className="inline-flex items-center space-x-1 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white"
                        title="Calendar with 24h native alarm alert"
                      >
                        <Download className="w-3 h-3 stroke-[1.5]" />
                        <span>.ics with 24h alert</span>
                      </button>

                      {booking.customerEmail && (
                        <a
                          href={generateEmailReminder(booking, settings).mailtoUrl}
                          className="inline-flex items-center space-x-1 text-charcoal-400 hover:text-copper-600 dark:hover:text-copper-400"
                          title="Open 24h reminder email template"
                        >
                          <Bell className="w-3 h-3 stroke-[1.5]" />
                          <span>Send 24h Reminder</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setReschedulingBooking(booking);
                          setNewDate(booking.date);
                          setNewSlot(null);
                        }}
                        className="px-2.5 py-1 rounded-md text-charcoal-700 dark:text-charcoal-200 border border-charcoal-200 dark:border-charcoal-700 hover:bg-charcoal-50"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="px-2.5 py-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
