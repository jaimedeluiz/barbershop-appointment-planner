import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  Calendar,
  Clock,
  User,
  Scissors,
  Download,
  ExternalLink,
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
  const settings = storage.getSettings();

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
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
      <div className="relative w-full max-w-md my-8 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-xl p-6 text-center overflow-hidden">
        {/* Minimal Check Icon */}
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
          <Check className="w-6 h-6 stroke-[2]" />
        </div>

        <h2 className="text-xl font-semibold text-charcoal-900 dark:text-white">
          Appointment Confirmed
        </h2>
        <p className="text-xs text-charcoal-400 mt-1">
          Your chair is reserved at {settings.shopName}.
        </p>

        {/* Reference Code */}
        <div className="my-4 p-3 rounded-xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 flex items-center justify-between text-xs">
          <span className="text-charcoal-400">Reference:</span>
          <span className="font-mono font-semibold text-charcoal-900 dark:text-white tracking-wider">
            {booking.id}
          </span>
        </div>

        {/* Details Card */}
        <div className="text-left space-y-2 p-3.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 text-xs mb-4">
          <div className="flex items-center justify-between">
            <span className="text-charcoal-400 flex items-center">
              <Scissors className="w-3.5 h-3.5 mr-1.5 stroke-[1.5]" /> Service
            </span>
            <span className="font-medium text-charcoal-900 dark:text-white text-right max-w-[180px] truncate">
              {booking.serviceNames.join(', ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-charcoal-400 flex items-center">
              <User className="w-3.5 h-3.5 mr-1.5 stroke-[1.5]" /> Barber
            </span>
            <span className="font-medium text-charcoal-900 dark:text-white">
              {booking.barberName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-charcoal-400 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 stroke-[1.5]" /> Date
            </span>
            <span className="font-medium text-charcoal-900 dark:text-white">
              {formatDateDisplay(booking.date)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-charcoal-400 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 stroke-[1.5]" /> Time
            </span>
            <span className="font-medium text-charcoal-900 dark:text-white">
              {formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)} ({booking.totalDurationMinutes} min)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-charcoal-200/60 dark:border-charcoal-800">
            <span className="text-charcoal-400">Total Price</span>
            <span className="text-sm font-bold text-charcoal-900 dark:text-white">
              ${booking.totalPrice}
            </span>
          </div>
        </div>

        {/* Add To Calendar */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleGoogleCalendar}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border border-charcoal-200 dark:border-charcoal-700 text-charcoal-800 dark:text-charcoal-200 hover:border-charcoal-400 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Google Calendar</span>
          </button>

          <button
            onClick={handleDownloadIcs}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border border-charcoal-200 dark:border-charcoal-700 text-charcoal-800 dark:text-charcoal-200 hover:border-charcoal-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>.ics File</span>
          </button>
        </div>

        {/* Done / Book Another */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 font-medium text-xs transition-colors flex items-center justify-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
          <span>Done</span>
        </button>
      </div>
    </div>
  );
};
