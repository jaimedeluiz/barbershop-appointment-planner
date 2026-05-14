import React, { useState, useMemo } from 'react';
import { Calendar, Clock, User, Scissors, AlertCircle, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { storage } from '../../services/storage';
import { useBooking } from '../../context/BookingContext';
import { formatDateDisplay, formatTime12h } from '../../utils/timeSlots';

export const Step4Confirm: React.FC = () => {
  const {
    selectedServices,
    selectedBarberId,
    selectedDate,
    selectedSlot,
    totalDurationMinutes,
    totalPrice,
    totalDiscount,
    calculatedEndTime,
    customerInfo,
    setCustomerInfo,
    createBooking,
    isSubmitting,
    prevStep,
  } = useBooking();

  const [touched, setTouched] = useState<{ name: boolean; phone: boolean; email: boolean }>({
    name: false,
    phone: false,
    email: false,
  });

  const barbers = useMemo(() => storage.getBarbers(), []);
  const barber = barbers.find((b) => b.id === selectedBarberId);

  // Field validation
  const errors = useMemo(() => {
    const errs: { name?: string; phone?: string; email?: string } = {};

    if (!customerInfo.name.trim()) {
      errs.name = 'Please provide your full name.';
    } else if (customerInfo.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    const cleanPhone = customerInfo.phone.replace(/\D/g, '');
    if (!customerInfo.phone.trim()) {
      errs.phone = 'Phone number is required for booking confirmations and reminders.';
    } else if (cleanPhone.length < 8) {
      errs.phone = 'Please provide a valid phone number (at least 8 digits).';
    }

    if (customerInfo.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email.trim())) {
        errs.email = 'Please provide a valid email address.';
      }
    }

    return errs;
  }, [customerInfo]);

  const isValid = !errors.name && !errors.phone && !errors.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, email: true });

    if (!isValid || !selectedSlot) {
      return;
    }

    await createBooking();
  };

  return (
    <div className="w-full pb-28">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 dark:text-white tracking-tight">
          Review & Confirm
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Double-check your appointment details and tell us who we&apos;re welcoming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Summary Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-copper-600 dark:text-copper-400 mb-4 flex items-center space-x-1.5">
              <Scissors className="w-3.5 h-3.5" />
              <span>Appointment Summary</span>
            </h3>

            {/* Services List */}
            <div className="space-y-3 pb-4 border-b border-charcoal-100 dark:border-charcoal-800">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between items-start text-xs">
                  <div>
                    <span className="font-semibold text-charcoal-900 dark:text-white">
                      {service.name}
                    </span>
                    <span className="block text-[11px] text-charcoal-400">
                      {service.durationMinutes} min
                    </span>
                  </div>
                  <span className="font-medium text-charcoal-800 dark:text-charcoal-200">
                    ${service.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Barber info */}
            <div className="py-3 border-b border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
              <span className="text-charcoal-500 dark:text-charcoal-400">Master Barber</span>
              <div className="flex items-center space-x-2">
                {barber?.avatar ? (
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-4 h-4 text-copper-500" />
                )}
                <span className="font-semibold text-charcoal-900 dark:text-white">
                  {barber ? barber.name : 'First Available Artisan'}
                </span>
              </div>
            </div>

            {/* Date & Time info */}
            <div className="py-3 border-b border-charcoal-100 dark:border-charcoal-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-500 dark:text-charcoal-400 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-copper-500" /> Date
                </span>
                <span className="font-semibold text-charcoal-900 dark:text-white">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-charcoal-500 dark:text-charcoal-400 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-copper-500" /> Time Window
                </span>
                <span className="font-semibold text-charcoal-900 dark:text-white">
                  {selectedSlot ? formatTime12h(selectedSlot.time) : '--:--'} –{' '}
                  {calculatedEndTime ? formatTime12h(calculatedEndTime) : '--:--'} ({totalDurationMinutes} min)
                </span>
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="pt-3 space-y-1.5 text-xs">
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Bundle Savings</span>
                  <span>-${totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-medium text-charcoal-700 dark:text-charcoal-300">
                  Total Due at Shop
                </span>
                <span className="text-xl font-bold text-copper-600 dark:text-copper-400">
                  ${totalPrice}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-400 text-right">
                No upfront payment required. Pay after your cut.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer Details Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200/80 dark:border-charcoal-800 shadow-sm space-y-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-copper-600 dark:text-copper-400 mb-2 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Customer Information</span>
            </h3>

            {/* Full Name */}
            <div>
              <label htmlFor="customer-name" className="block text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-name"
                type="text"
                placeholder="e.g. Thomas Shelby"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                className={`w-full px-4 py-3 rounded-xl text-sm bg-charcoal-50 dark:bg-charcoal-950 border transition-colors outline-none min-h-touch ${
                  touched.name && errors.name
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-charcoal-200 dark:border-charcoal-800 focus:border-copper-500 focus:ring-1 focus:ring-copper-500'
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="customer-phone" className="block text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="e.g. +1 (555) 019-2831"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                className={`w-full px-4 py-3 rounded-xl text-sm bg-charcoal-50 dark:bg-charcoal-950 border transition-colors outline-none min-h-touch ${
                  touched.phone && errors.phone
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-charcoal-200 dark:border-charcoal-800 focus:border-copper-500 focus:ring-1 focus:ring-copper-500'
                }`}
              />
              {touched.phone && errors.phone ? (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.phone}
                </p>
              ) : (
                <p className="text-[11px] text-charcoal-400 mt-1">
                  Used for instant SMS confirmation and easy appointment lookup.
                </p>
              )}
            </div>

            {/* Email (Optional) */}
            <div>
              <label htmlFor="customer-email" className="block text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Email Address <span className="text-charcoal-400 font-normal">(Optional)</span>
              </label>
              <input
                id="customer-email"
                type="email"
                placeholder="e.g. thomas@example.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                className={`w-full px-4 py-3 rounded-xl text-sm bg-charcoal-50 dark:bg-charcoal-950 border transition-colors outline-none min-h-touch ${
                  touched.email && errors.email
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-charcoal-200 dark:border-charcoal-800 focus:border-copper-500 focus:ring-1 focus:ring-copper-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Notes / Special Requests (Optional) */}
            <div>
              <label htmlFor="customer-notes" className="block text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mb-1">
                Notes & Preferences <span className="text-charcoal-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="customer-notes"
                rows={2}
                placeholder="e.g. Skin fade low, sensitive neck skin, prefer quiet session..."
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 focus:border-copper-500 focus:ring-1 focus:ring-copper-500 transition-colors outline-none resize-none"
              />
            </div>

            {/* Guarantee note */}
            <div className="pt-2 flex items-start space-x-2 text-[11px] text-charcoal-500 dark:text-charcoal-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                Free cancellation up to 2 hours before your appointment. Instant calendar sync and reference code provided immediately.
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/95 dark:bg-charcoal-900/95 border-t border-charcoal-200 dark:border-charcoal-800 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl font-medium text-sm text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors min-h-touch"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center justify-center space-x-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all min-h-touch ${
              isSubmitting
                ? 'bg-copper-700 text-white cursor-wait opacity-80'
                : 'bg-copper-600 hover:bg-copper-500 text-white shadow-md shadow-copper-500/25 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Securing Slot...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Appointment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
