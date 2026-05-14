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
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        <Header onOpenLookup={onOpenLookup} onOpenAdmin={onOpenAdmin} />

        {/* Hero Section */}
        <section className="text-center pt-8 pb-4 px-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-copper-100/80 dark:bg-copper-950/50 border border-copper-200 dark:border-copper-900/60 text-copper-800 dark:text-copper-300 text-[11px] font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-copper-500 animate-pulse" />
            <span>Master Barber Studio • Soho, NYC</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-charcoal-900 dark:text-white">
            Precision Grooming. <br className="hidden sm:inline" />
            <span className="text-copper-600 dark:text-copper-400 font-normal italic">
              Crafted For You.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-400 mt-2 max-w-lg mx-auto">
            Traditional hot towel rituals, bespoke scissor crafts, and modern precision styling. Book your session in seconds.
          </p>
        </section>

        {/* 4-Step Progress Indicator */}
        <StepIndicator />

        {/* Dynamic Step View */}
        <main className="max-w-4xl mx-auto px-4 mt-2">
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

      {/* Modern Minimal Footer */}
      <footer className="border-t border-charcoal-200 dark:border-charcoal-800 bg-white/50 dark:bg-charcoal-900/40 backdrop-blur-sm mt-12 py-8 px-4 text-xs text-charcoal-500 dark:text-charcoal-400">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-copper-500" />
              <span>142 Mercer St, Soho, NY</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-copper-500" />
              <span>+1 (555) 234-8921</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span>Portfolio Project by 3rd Year Software Engineering Student</span>
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
