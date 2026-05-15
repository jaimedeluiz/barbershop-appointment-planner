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
      const offset = direction === 'left' ? -200 : 200;
      dateScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full pb-28">
      {/* Date Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-medium text-charcoal-900 dark:text-white flex items-center">
          <Calendar className="w-3.5 h-3.5 stroke-[1.5] mr-1.5" />
          {formatDateDisplay(selectedDate)}
        </span>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => scrollDates('left')}
            className="p-1 rounded text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white transition-colors"
            aria-label="Scroll dates left"
          >
            <ChevronLeft className="w-4 h-4 stroke-[1.5]" />
          </button>
          <button
            onClick={() => scrollDates('right')}
            className="p-1 rounded text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white transition-colors"
            aria-label="Scroll dates right"
          >
            <ChevronRight className="w-4 h-4 stroke-[1.5]" />
          </button>
        </div>
      </div>

      {/* Minimal Date Slider */}
      <div
        ref={dateScrollRef}
        className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth"
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
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2.5 rounded-xl transition-all border min-h-touch ${
                !day.isOpen
                  ? 'opacity-30 border-dashed border-charcoal-200 dark:border-charcoal-800 cursor-not-allowed'
                  : isSelected
                  ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950 border-charcoal-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-charcoal-950 text-charcoal-700 dark:text-charcoal-300 border-charcoal-200/80 dark:border-charcoal-800/80 hover:border-charcoal-400'
              }`}
            >
              <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70 dark:text-charcoal-950/70' : 'text-charcoal-400'}`}>
                {day.dayName}
              </span>
              <span className="text-base font-semibold my-0.5">{day.dayNum}</span>
              <span className={`text-[10px] ${isSelected ? 'text-white/80 dark:text-charcoal-950/80' : 'text-charcoal-400'}`}>
                {day.isOpen ? day.monthName : 'Closed'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Info Notice */}
      <div className="mt-4 mb-4 flex items-center text-xs text-charcoal-400">
        <Clock className="w-3.5 h-3.5 stroke-[1.5] mr-1.5 flex-shrink-0" />
        <span>
          {availableCount > 0
            ? `${availableCount} open slot${availableCount > 1 ? 's' : ''} for your ${totalDurationMinutes} min appointment`
            : 'No availability on this date'}
        </span>
      </div>

      {/* Time Slots Grid */}
      {availableCount === 0 ? (
        <div className="p-8 text-center rounded-xl bg-charcoal-50 dark:bg-charcoal-900/40 border border-charcoal-200/60 dark:border-charcoal-800">
          <AlertCircle className="w-6 h-6 stroke-[1.5] mx-auto text-charcoal-400 mb-2" />
          <h3 className="font-medium text-charcoal-900 dark:text-white text-xs">
            No Open Times
          </h3>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Please pick another day or select &quot;Any Available Barber&quot;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot?.time === slot.time;

            if (!slot.available) {
              return (
                <div
                  key={slot.time}
                  className="p-2.5 rounded-lg border border-charcoal-100 dark:border-charcoal-850/60 text-charcoal-300 dark:text-charcoal-700 text-center cursor-not-allowed select-none min-h-touch flex items-center justify-center text-xs line-through"
                >
                  {formatTime12h(slot.time)}
                </div>
              );
            }

            return (
              <button
                key={slot.time}
                onClick={() => setSelectedSlot(slot)}
                className={`p-2.5 rounded-lg text-center text-xs transition-colors border min-h-touch flex items-center justify-center font-medium ${
                  isSelected
                    ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950 border-charcoal-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-charcoal-950 text-charcoal-800 dark:text-charcoal-200 border-charcoal-200 dark:border-charcoal-800 hover:border-charcoal-400'
                }`}
              >
                {formatTime12h(slot.time)}
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/95 dark:bg-charcoal-950/95 border-t border-charcoal-100 dark:border-charcoal-800 p-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl text-xs font-medium text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white transition-colors min-h-touch"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
            <span>Back</span>
          </button>

          <button
            onClick={nextStep}
            disabled={!isStep3Valid}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-xs transition-all min-h-touch ${
              isStep3Valid
                ? 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 active:scale-[0.98]'
                : 'bg-charcoal-100 dark:bg-charcoal-850 text-charcoal-400 cursor-not-allowed'
            }`}
          >
            <span>Review &amp; Confirm</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
