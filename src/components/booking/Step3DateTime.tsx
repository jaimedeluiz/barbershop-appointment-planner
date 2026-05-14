import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Calendar, Clock, AlertCircle, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Barber, Booking, ShopSettings, TimeSlot } from '../../types';
import { storage } from '../../services/storage';
import { useBooking } from '../../context/BookingContext';
import { generateAvailableSlots, formatTime12h, formatDateDisplay } from '../../utils/timeSlots';

export const Step3DateTime: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    selectedBarberId,
    totalDurationMinutes,
    nextStep,
    prevStep,
    isStep3Valid,
  } = useBooking();

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(storage.getSettings());
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // Load storage
  useEffect(() => {
    const refreshData = () => {
      setBarbers(storage.getBarbers());
      setBookings(storage.getBookings());
      setSettings(storage.getSettings());
    };
    refreshData();

    window.addEventListener('cb_storage_update', refreshData);
    return () => window.removeEventListener('cb_storage_update', refreshData);
  }, []);

  // Generate 30 consecutive calendar days starting today
  const daysList = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayOfWeek: number;
      dayName: string;
      dayNum: number;
      monthName: string;
      isOpen: boolean;
    }> = [];

    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const daySchedule = settings.schedule[dayOfWeek];
      const isOpen = Boolean(
        daySchedule?.isOpen && !settings.blockedDates?.includes(dateStr)
      );

      days.push({
        dateStr,
        dayOfWeek,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('en-US', { month: 'short' }),
        isOpen,
      });
    }
    return days;
  }, [settings]);

  // Compute available slots dynamically based on service duration & schedule
  const slots: TimeSlot[] = useMemo(() => {
    if (!selectedDate || totalDurationMinutes <= 0) return [];

    return generateAvailableSlots(
      selectedDate,
      totalDurationMinutes,
      selectedBarberId,
      barbers,
      bookings,
      settings
    );
  }, [selectedDate, totalDurationMinutes, selectedBarberId, barbers, bookings, settings]);

  const availableCount = slots.filter((s) => s.available).length;

  const scrollDates = (direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      dateScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full pb-28">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 dark:text-white tracking-tight">
          Select Date & Time
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Showing real-time openings tailored to your {totalDurationMinutes} min appointment duration.
        </p>
      </div>

      {/* Date Picker Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-copper-500" />
          <span className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300">
            {formatDateDisplay(selectedDate)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => scrollDates('left')}
            className="p-1 rounded-lg text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            aria-label="Scroll dates left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollDates('right')}
            className="p-1 rounded-lg text-charcoal-500 hover:text-charcoal-900 dark:hover:text-white hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            aria-label="Scroll dates right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Date Slider (30 days) */}
      <div
        ref={dateScrollRef}
        className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
      >
        {daysList.map((day) => {
          const isSelected = selectedDate === day.dateStr;

          return (
            <button
              key={day.dateStr}
              onClick={() => {
                if (day.isOpen) {
                  setSelectedDate(day.dateStr);
                  setSelectedSlot(null);
                }
              }}
              disabled={!day.isOpen}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-2xl transition-all duration-200 border min-h-touch ${
                !day.isOpen
                  ? 'opacity-40 bg-charcoal-100 dark:bg-charcoal-900/50 border-dashed border-charcoal-300 dark:border-charcoal-800 cursor-not-allowed'
                  : isSelected
                  ? 'bg-copper-600 text-white border-copper-600 shadow-md shadow-copper-500/20 copper-glow-sm'
                  : 'bg-white dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300 border-charcoal-200/90 dark:border-charcoal-800 hover:border-copper-400'
              }`}
            >
              <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-white/80' : 'text-charcoal-400'}`}>
                {day.dayName}
              </span>
              <span className="text-lg font-bold my-0.5">{day.dayNum}</span>
              <span className={`text-[10px] font-medium ${isSelected ? 'text-white/90' : 'text-copper-600 dark:text-copper-400'}`}>
                {day.isOpen ? day.monthName : 'Closed'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Schedule Info Banner */}
      <div className="mt-6 mb-4 flex items-center justify-between text-xs text-charcoal-500 dark:text-charcoal-400 bg-charcoal-100/70 dark:bg-charcoal-900/50 p-3 rounded-xl border border-charcoal-200/50 dark:border-charcoal-800/50">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-copper-500" />
          <span>
            {availableCount > 0
              ? `${availableCount} slot${availableCount > 1 ? 's' : ''} available (${totalDurationMinutes} min service + ${settings.bufferMinutes}m prep)`
              : 'Shop is closed or fully booked on this date'}
          </span>
        </div>
      </div>

      {/* Time Slots Grid */}
      {availableCount === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800">
          <AlertCircle className="w-8 h-8 mx-auto text-copper-500 mb-2 opacity-80" />
          <h3 className="font-semibold text-charcoal-900 dark:text-white text-base">
            No Available Times
          </h3>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 max-w-sm mx-auto mt-1">
            There are no open slots fitting your appointment duration on this day. Please select another date from the calendar above or try &quot;Any Available Barber&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.time === slot.time;

            if (!slot.available) {
              return (
                <div
                  key={slot.time}
                  className="p-3 rounded-xl border border-charcoal-100 dark:border-charcoal-800/60 bg-charcoal-50/50 dark:bg-charcoal-900/30 text-charcoal-300 dark:text-charcoal-600 text-center cursor-not-allowed select-none min-h-touch flex items-center justify-center"
                >
                  <span className="text-xs line-through">{formatTime12h(slot.time)}</span>
                </div>
              );
            }

            return (
              <button
                key={slot.time}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 rounded-xl text-center font-medium transition-all duration-150 border min-h-touch flex items-center justify-center ${
                  isSelected
                    ? 'bg-copper-600 text-white border-copper-600 shadow-md shadow-copper-500/25 ring-2 ring-copper-500/50 font-bold'
                    : 'bg-white dark:bg-charcoal-900 text-charcoal-800 dark:text-charcoal-200 border-charcoal-200 dark:border-charcoal-800 hover:border-copper-500 hover:text-copper-600 dark:hover:text-copper-400'
                }`}
              >
                <span className="text-xs">{formatTime12h(slot.time)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/95 dark:bg-charcoal-900/95 border-t border-charcoal-200 dark:border-charcoal-800 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl font-medium text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors min-h-touch"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={nextStep}
            disabled={!isStep3Valid}
            className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all min-h-touch ${
              isStep3Valid
                ? 'bg-copper-600 hover:bg-copper-500 text-white shadow-md shadow-copper-500/25 active:scale-[0.98]'
                : 'bg-charcoal-200 dark:bg-charcoal-800 text-charcoal-400 cursor-not-allowed'
            }`}
          >
            <span>Confirm Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
