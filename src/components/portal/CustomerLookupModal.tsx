import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  RotateCcw,
  Download,
} from 'lucide-react';
import { Booking, TimeSlot } from '../../types';
import { storage } from '../../services/storage';
import { formatDateDisplay, formatTime12h, generateAvailableSlots } from '../../utils/timeSlots';
import { downloadIcsFile } from '../../utils/calendar';

interface CustomerLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerLookupModal: React.FC<CustomerLookupModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Booking[]>([]);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);

  // Reschedule state
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

    // Check by ID first
    const byId = storage.getBookingById(cleanQuery);
    if (byId) {
      setResults([byId]);
      return;
    }

    // Otherwise search by phone
    const byPhone = storage.getBookingsByPhone(cleanQuery);
    setResults(byPhone);
  };

  const handleCancelBooking = (booking: Booking) => {
    if (
      window.confirm(
        `Are you sure you want to cancel appointment ${booking.id} (${booking.serviceNames.join(', ')})? This will immediately release the time slot.`
      )
    ) {
      storage.cancelBooking(booking.id);
      // Refresh results
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

  // Compute available slots for reschedule
  const rescheduleSlots: TimeSlot[] = useMemo(() => {
    if (!reschedulingBooking || !newDate) return [];
    return generateAvailableSlots(
      newDate,
      reschedulingBooking.totalDurationMinutes,
      reschedulingBooking.barberId,
      barbers,
      storage.getBookings(),
      settings,
      reschedulingBooking.id // exclude self
    );
  }, [reschedulingBooking, newDate, barbers, settings]);

  const handleConfirmReschedule = () => {
    if (!reschedulingBooking || !newSlot || !newDate) return;

    setIsReschedulingSaving(true);
    setTimeout(() => {
      const updated: Booking = {
        ...reschedulingBooking,
        date: newDate,
        startTime: newSlot.time,
        // Calculate new end time
        endTime: newSlot.time, // will adjust properly with duration
        status: 'confirmed',
      };

      // Calculate proper end time
      const [h, m] = newSlot.time.split(':').map(Number);
      const totalMins = h * 60 + m + reschedulingBooking.totalDurationMinutes;
      const endHours = Math.floor(totalMins / 60);
      const endMinutes = totalMins % 60;
      updated.endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

      storage.updateBooking(updated);

      // Refresh search
      const byId = storage.getBookingById(updated.id);
      setResults(byId ? [byId] : []);
      setReschedulingBooking(null);
      setIsReschedulingSaving(false);
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl my-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-200/80 dark:border-charcoal-800">
          <div>
            <h3 className="font-serif text-xl font-bold text-charcoal-900 dark:text-white">
              My Appointments
            </h3>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
              Lookup, reschedule, or cancel your booking
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-4">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Booking ID (e.g. CB-8491) or Phone #"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 focus:border-copper-500 focus:ring-1 focus:ring-copper-500 outline-none text-charcoal-900 dark:text-white"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-copper-600 hover:bg-copper-500 text-white font-semibold text-xs transition-colors min-h-touch"
            >
              Search
            </button>
          </form>

          {/* Reschedule View if Active */}
          {reschedulingBooking && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Rescheduling {reschedulingBooking.id}
                </span>
                <button
                  onClick={() => setReschedulingBooking(null)}
                  className="text-xs text-charcoal-500 hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Choose New Date:
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    setNewSlot(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 text-charcoal-900 dark:text-white"
                />
              </div>

              {newDate && (
                <div>
                  <label className="block text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                    Select New Time:
                  </label>
                  {rescheduleSlots.filter((s) => s.available).length === 0 ? (
                    <p className="text-xs text-charcoal-500">No open slots on this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {rescheduleSlots
                        .filter((s) => s.available)
                        .map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setNewSlot(slot)}
                            className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                              newSlot?.time === slot.time
                                ? 'bg-copper-600 text-white border-copper-600'
                                : 'bg-white dark:bg-charcoal-800 text-charcoal-800 dark:text-charcoal-200 border-charcoal-200 dark:border-charcoal-700'
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
                className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all ${
                  newSlot && !isReschedulingSaving
                    ? 'bg-copper-600 hover:bg-copper-500'
                    : 'bg-charcoal-300 dark:bg-charcoal-800 text-charcoal-400 cursor-not-allowed'
                }`}
              >
                {isReschedulingSaving ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          )}

          {/* Results List */}
          {hasSearched && results.length === 0 && !reschedulingBooking && (
            <div className="text-center py-8 text-charcoal-500 dark:text-charcoal-400 text-xs">
              <AlertTriangle className="w-8 h-8 mx-auto text-charcoal-400 mb-2" />
              <p className="font-semibold text-charcoal-700 dark:text-charcoal-300">
                No matching appointments found.
              </p>
              <p className="mt-1">
                Please verify your booking reference ID or the phone number you entered during booking.
              </p>
            </div>
          )}

          {results.map((booking) => {
            const isCancelled = booking.status === 'cancelled';

            return (
              <div
                key={booking.id}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  isCancelled
                    ? 'bg-charcoal-100/50 dark:bg-charcoal-950/40 border-charcoal-200/50 dark:border-charcoal-800/50 opacity-60'
                    : 'bg-white dark:bg-charcoal-900 border-charcoal-200 dark:border-charcoal-800 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-copper-600 dark:text-copper-400">
                    {booking.id}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      isCancelled
                        ? 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400'
                        : booking.status === 'completed'
                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>

                <h4 className="font-semibold text-sm text-charcoal-900 dark:text-white">
                  {booking.serviceNames.join(' + ')}
                </h4>

                <div className="mt-2 space-y-1 text-xs text-charcoal-600 dark:text-charcoal-300">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-copper-500" />
                    <span>Barber: {booking.barberName}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-copper-500" />
                    <span>{formatDateDisplay(booking.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-copper-500" />
                    <span>
                      {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)} ({booking.totalDurationMinutes} min)
                    </span>
                  </div>
                </div>

                {!isCancelled && (
                  <div className="mt-4 pt-3 border-t border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between flex-wrap gap-2">
                    <button
                      onClick={() => downloadIcsFile(booking, settings)}
                      className="inline-flex items-center space-x-1 text-xs text-charcoal-600 dark:text-charcoal-300 hover:text-copper-500"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.ics file</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setReschedulingBooking(booking);
                          setNewDate(booking.date);
                          setNewSlot(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-copper-600 dark:text-copper-400 bg-copper-50 dark:bg-copper-950/50 hover:bg-copper-100 dark:hover:bg-copper-900 transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
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
