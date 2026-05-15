import React, { useState, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
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

  const errors = useMemo(() => {
    const errs: { name?: string; phone?: string; email?: string } = {};

    if (!customerInfo.name.trim()) {
      errs.name = 'Please provide your full name.';
    } else if (customerInfo.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    const cleanPhone = customerInfo.phone.replace(/\D/g, '');
    if (!customerInfo.phone.trim()) {
      errs.phone = 'Phone number is required for appointment confirmation.';
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Summary Card */}
        <div className="md:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 text-xs">
            <h3 className="font-semibold text-charcoal-900 dark:text-white mb-3 text-sm">
              Appointment Summary
            </h3>

            {/* Services List */}
            <div className="space-y-2 pb-3 border-b border-charcoal-100 dark:border-charcoal-850">
              {selectedServices.map((service) => (
                <div key={service.id} className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-charcoal-900 dark:text-white">
                      {service.name}
                    </span>
                    <span className="block text-[11px] text-charcoal-400">
                      {service.durationMinutes} min
                    </span>
                  </div>
                  <span className="text-charcoal-700 dark:text-charcoal-300">
                    ${service.price}
                  </span>
                </div>
              ))}
            </div>

            {/* Barber info */}
            <div className="py-2.5 border-b border-charcoal-100 dark:border-charcoal-850 flex items-center justify-between">
              <span className="text-charcoal-400">Artisan</span>
              <span className="font-medium text-charcoal-900 dark:text-white">
                {barber ? barber.name : 'First Available Chair'}
              </span>
            </div>

            {/* Date & Time info */}
            <div className="py-2.5 border-b border-charcoal-100 dark:border-charcoal-850 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-400 flex items-center">
                  <Calendar className="w-3 h-3 stroke-[1.5] mr-1" /> Date
                </span>
                <span className="font-medium text-charcoal-900 dark:text-white">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-charcoal-400 flex items-center">
                  <Clock className="w-3 h-3 stroke-[1.5] mr-1" /> Time
                </span>
                <span className="font-medium text-charcoal-900 dark:text-white">
                  {selectedSlot ? formatTime12h(selectedSlot.time) : '--:--'} –{' '}
                  {calculatedEndTime ? formatTime12h(calculatedEndTime) : '--:--'} ({totalDurationMinutes} min)
                </span>
              </div>
            </div>

            {/* Pricing breakdown */}
            <div className="pt-3 space-y-1">
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Bundle Savings</span>
                  <span>-${totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-charcoal-500">Total Due at Salon</span>
                <span className="text-lg font-bold text-charcoal-900 dark:text-white">
                  ${totalPrice}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Form */}
        <div className="md:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-5 rounded-xl bg-white dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 space-y-3.5"
          >
            <h3 className="font-semibold text-charcoal-900 dark:text-white text-sm mb-2">
              Your Contact Details
            </h3>

            {/* Full Name */}
            <div>
              <label htmlFor="customer-name" className="block text-xs text-charcoal-500 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-name"
                type="text"
                placeholder="e.g. Thomas Vance"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-charcoal-50 dark:bg-charcoal-900 border transition-colors outline-none min-h-touch ${
                  touched.name && errors.name
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-charcoal-200 dark:border-charcoal-800 focus:border-charcoal-600 dark:focus:border-charcoal-500'
                }`}
              />
              {touched.name && errors.name && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 stroke-[1.5]" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="customer-phone" className="block text-xs text-charcoal-500 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="e.g. +1 (555) 234-5678"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-charcoal-50 dark:bg-charcoal-900 border transition-colors outline-none min-h-touch ${
                  touched.phone && errors.phone
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-charcoal-200 dark:border-charcoal-800 focus:border-charcoal-600 dark:focus:border-charcoal-500'
                }`}
              />
              {touched.phone && errors.phone && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 stroke-[1.5]" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Email (Optional) */}
            <div>
              <label htmlFor="customer-email" className="block text-xs text-charcoal-500 mb-1">
                Email Address <span className="text-charcoal-400 font-normal">(Optional)</span>
              </label>
              <input
                id="customer-email"
                type="email"
                placeholder="e.g. thomas@example.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-charcoal-50 dark:bg-charcoal-900 border transition-colors outline-none min-h-touch ${
                  touched.email && errors.email
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-charcoal-200 dark:border-charcoal-800 focus:border-charcoal-600 dark:focus:border-charcoal-500'
                }`}
              />
              {touched.email && errors.email && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 stroke-[1.5]" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="customer-notes" className="block text-xs text-charcoal-500 mb-1">
                Notes &amp; Preferences <span className="text-charcoal-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="customer-notes"
                rows={2}
                placeholder="e.g. skin fade low, quiet session..."
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg text-xs bg-charcoal-50 dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 outline-none resize-none"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/95 dark:bg-charcoal-950/95 border-t border-charcoal-100 dark:border-charcoal-800 p-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-3 rounded-xl text-xs font-medium text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white transition-colors min-h-touch"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2]" />
            <span>Back</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium text-xs transition-all min-h-touch ${
              isSubmitting
                ? 'bg-charcoal-700 text-white cursor-wait opacity-80'
                : 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reserving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                <span>Complete Booking</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
