import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Scissors,
  Download,
  ExternalLink,
  MessageSquare,
  Mail,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import { Booking } from '../../types';
import { storage } from '../../services/storage';
import { formatDateDisplay, formatTime12h } from '../../utils/timeSlots';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../utils/calendar';

interface BookingSuccessModalProps {
  booking: Booking;
  onClose: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({ booking, onClose }) => {
  const [showSimulatedReminders, setShowSimulatedReminders] = useState(false);
  const settings = storage.getSettings();

  useEffect(() => {
    // Fire celebratory confetti on appearance
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d98852', '#bc8f22', '#ffffff', '#232328'],
      });
    } catch {
      // safe fallback if canvas not available
    }
  }, []);

  const handleDownloadIcs = () => {
    downloadIcsFile(booking, settings);
  };

  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(booking, settings);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg my-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-copper-500/15 blur-3xl rounded-full pointer-events-none" />

        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-copper-50 dark:bg-copper-950/50 border border-copper-500/30 flex items-center justify-center text-copper-600 dark:text-copper-400 mb-4 copper-glow">
          <CheckCircle className="w-9 h-9 stroke-[2.2]" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-copper-100 dark:bg-copper-900/60 text-copper-700 dark:text-copper-300 mb-2">
          Appointment Confirmed
        </span>

        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 dark:text-white tracking-tight">
          You&apos;re All Set!
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-1 max-w-sm mx-auto">
          We&apos;ve reserved your master barber chair at {settings.shopName}.
        </p>

        {/* Reference Code Card */}
        <div className="my-5 p-3.5 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950/70 border border-charcoal-200/70 dark:border-charcoal-800 flex items-center justify-between">
          <div className="text-left">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-charcoal-400">
              Booking Reference
            </span>
            <span className="text-lg font-mono font-bold tracking-wider text-copper-600 dark:text-copper-400">
              {booking.id}
            </span>
          </div>
          <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 bg-charcoal-200/50 dark:bg-charcoal-800 px-2.5 py-1 rounded-lg">
            Save for check-in
          </span>
        </div>

        {/* Details Card */}
        <div className="text-left space-y-2.5 p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950/40 border border-charcoal-200/60 dark:border-charcoal-800/60 text-xs mb-5">
          <div className="flex items-center justify-between">
            <span className="text-charcoal-500 dark:text-charcoal-400 flex items-center">
              <Scissors className="w-3.5 h-3.5 mr-1.5 text-copper-500" /> Services
            </span>
            <span className="font-semibold text-charcoal-900 dark:text-white text-right max-w-[200px] truncate">
              {booking.serviceNames.join(', ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-charcoal-500 dark:text-charcoal-400 flex items-center">
              <User className="w-3.5 h-3.5 mr-1.5 text-copper-500" /> Artisan
            </span>
            <span className="font-semibold text-charcoal-900 dark:text-white">
              {booking.barberName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-charcoal-500 dark:text-charcoal-400 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-copper-500" /> Date
            </span>
            <span className="font-semibold text-charcoal-900 dark:text-white">
              {formatDateDisplay(booking.date)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-charcoal-500 dark:text-charcoal-400 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-copper-500" /> Time Window
            </span>
            <span className="font-semibold text-charcoal-900 dark:text-white">
              {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)} ({booking.totalDurationMinutes} min)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-charcoal-200/50 dark:border-charcoal-800">
            <span className="font-medium text-charcoal-700 dark:text-charcoal-300">
              Total to Pay at Salon
            </span>
            <span className="text-base font-bold text-copper-600 dark:text-copper-400">
              ${booking.totalPrice}
            </span>
          </div>
        </div>

        {/* Add To Calendar Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={handleGoogleCalendar}
            className="flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-charcoal-800 dark:text-charcoal-100 hover:border-copper-500 transition-colors min-h-touch"
          >
            <ExternalLink className="w-3.5 h-3.5 text-copper-500" />
            <span>Google Calendar</span>
          </button>

          <button
            onClick={handleDownloadIcs}
            className="flex items-center justify-center space-x-1.5 py-3 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-charcoal-800 dark:text-charcoal-100 hover:border-copper-500 transition-colors min-h-touch"
          >
            <Download className="w-3.5 h-3.5 text-copper-500" />
            <span>Apple / Outlook (.ics)</span>
          </button>
        </div>

        {/* Simulated Reminders Accordion (Requirements Showcase) */}
        <div className="mb-5 text-left border border-charcoal-200/70 dark:border-charcoal-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowSimulatedReminders(!showSimulatedReminders)}
            className="w-full p-3 bg-charcoal-50 dark:bg-charcoal-950/60 flex items-center justify-between text-xs font-medium text-charcoal-700 dark:text-charcoal-300"
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-copper-500" />
              <span>Simulated SMS & 24hr Reminder Dispatch</span>
            </div>
            {showSimulatedReminders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showSimulatedReminders && (
            <div className="p-3.5 bg-white dark:bg-charcoal-900 space-y-3 text-[11px] text-charcoal-600 dark:text-charcoal-400 border-t border-charcoal-200/70 dark:border-charcoal-800">
              <div className="p-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200/60 dark:border-charcoal-800/60">
                <div className="flex items-center justify-between font-semibold text-charcoal-800 dark:text-charcoal-200 mb-1">
                  <span className="flex items-center">
                    <MessageSquare className="w-3 h-3 mr-1 text-copper-500" /> SMS to {booking.customerPhone}
                  </span>
                  <span className="text-emerald-500 text-[10px]">Delivered</span>
                </div>
                <p className="font-mono text-[10px] text-charcoal-500 dark:text-charcoal-400">
                  &ldquo;Crown &amp; Blade: Confirmed! {booking.customerName}, your appointment with {booking.barberName} is set for {formatDateDisplay(booking.date)} at {formatTime12h(booking.startTime)}. Ref: {booking.id}. See you in the chair!&rdquo;
                </p>
              </div>

              {booking.customerEmail && (
                <div className="p-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200/60 dark:border-charcoal-800/60">
                  <div className="flex items-center justify-between font-semibold text-charcoal-800 dark:text-charcoal-200 mb-1">
                    <span className="flex items-center">
                      <Mail className="w-3 h-3 mr-1 text-copper-500" /> Email to {booking.customerEmail}
                    </span>
                    <span className="text-emerald-500 text-[10px]">Queued</span>
                  </div>
                  <p className="font-mono text-[10px] text-charcoal-500 dark:text-charcoal-400">
                    &ldquo;Digital receipt &amp; calendar invitation delivered. Scheduled automated reminder: 24 hours prior to appointment.&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary dismiss button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-copper-600 hover:bg-copper-500 text-white font-semibold text-sm shadow-md shadow-copper-500/25 active:scale-[0.98] transition-all min-h-touch flex items-center justify-center space-x-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Book Another Service</span>
        </button>
      </div>
    </div>
  );
};
