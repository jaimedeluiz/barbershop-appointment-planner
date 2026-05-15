import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { StepIndicator } from './components/common/StepIndicator';
import { Step1Services } from './components/booking/Step1Services';
import { Step2Barber } from './components/booking/Step2Barber';
import { Step3DateTime } from './components/booking/Step3DateTime';
import { Step4Confirm } from './components/booking/Step4Confirm';
import { BookingSuccessModal } from './components/booking/BookingSuccessModal';
import { CustomerLookupModal } from './components/portal/CustomerLookupModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { BookingProvider, useBooking } from './context/BookingContext';
import { ThemeProvider } from './context/ThemeContext';
import { MapPin, Phone, Bell, X } from 'lucide-react';
import { initAutomaticReminderScheduler } from './services/reminderScheduler';

const BookingFlowContainer: React.FC<{
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
}> = ({ onOpenLookup, onOpenAdmin }) => {
  const { step, confirmedBooking, resetBooking } = useBooking();

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-charcoal-200 dark:selection:bg-charcoal-800">
      <div>
        <Header onOpenLookup={onOpenLookup} onOpenAdmin={onOpenAdmin} />

        {/* Minimal Understated Hero Section */}
        <section className="text-center pt-8 pb-3 px-4 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900 dark:text-white">
            Crown &amp; Blade
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-400 dark:text-charcoal-400 mt-1.5 max-w-md mx-auto">
            Select a service, pick your preferred time, and confirm in under a minute.
          </p>
        </section>

        {/* Minimal Step Indicator */}
        <StepIndicator />

        {/* Dynamic Step View */}
        <main className="max-w-3xl mx-auto px-4 mt-2">
          {step === 1 && <Step1Services />}
          {step === 2 && <Step2Barber />}
          {step === 3 && <Step3DateTime />}
          {step === 4 && <Step4Confirm />}
        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmedBooking && (
        <BookingSuccessModal
          booking={confirmedBooking}
          onClose={resetBooking}
        />
      )}

      {/* Minimalist Line Footer */}
      <footer className="border-t border-charcoal-100 dark:border-charcoal-850 py-6 px-4 text-xs text-charcoal-400 dark:text-charcoal-500">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>142 Mercer St, Soho, NY</span>
            </span>
            <span className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>+1 (555) 234-8921</span>
            </span>
          </div>

          <div>
            <span>Crown &amp; Blade Co.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  // Initialize the automatic 24h background scheduler on startup
  useEffect(() => {
    const stopScheduler = initAutomaticReminderScheduler();

    const handleReminderFired = (e: any) => {
      if (e.detail?.reminderText) {
        setReminderToast(e.detail.reminderText);
        setTimeout(() => {
          setReminderToast(null);
        }, 7000);
      }
    };

    window.addEventListener('cb_auto_reminder_fired', handleReminderFired);

    return () => {
      stopScheduler();
      window.removeEventListener('cb_auto_reminder_fired', handleReminderFired);
    };
  }, []);

  return (
    <ThemeProvider>
      <BookingProvider>
        {/* Automatic 24h Reminder Toast Alert */}
        {reminderToast && (
          <div className="fixed top-16 right-4 z-50 max-w-sm p-3.5 bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 rounded-xl shadow-lg border border-charcoal-700 dark:border-charcoal-200 text-xs flex items-start space-x-2.5 animate-fade-in">
            <Bell className="w-4 h-4 stroke-[2] text-amber-400 dark:text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Automatic 24h Reminder</p>
              <p className="text-[11px] opacity-90 mt-0.5">{reminderToast}</p>
            </div>
            <button
              onClick={() => setReminderToast(null)}
              className="p-1 opacity-70 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <BookingFlowContainer
          onOpenLookup={() => setIsLookupOpen(true)}
          onOpenAdmin={() => setIsAdminLoginOpen(true)}
        />

        {/* Customer Self-Service Lookup Portal */}
        <CustomerLookupModal
          isOpen={isLookupOpen}
          onClose={() => setIsLookupOpen(false)}
        />

        {/* Staff Admin Login Modal */}
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={() => {
            setIsAdminLoginOpen(false);
            setIsAdminDashboardOpen(true);
          }}
        />

        {/* Staff Operations Hub */}
        <AdminDashboard
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
        />
      </BookingProvider>
    </ThemeProvider>
  );
}
