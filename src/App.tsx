import React, { useState } from 'react';
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
import { MapPin, Phone } from 'lucide-react';

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

  return (
    <ThemeProvider>
      <BookingProvider>
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
