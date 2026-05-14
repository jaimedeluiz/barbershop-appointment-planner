import React from 'react';
import { Check } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

const STEPS = [
  { id: 1, name: 'Services', short: 'Service' },
  { id: 2, name: 'Barber', short: 'Barber' },
  { id: 3, name: 'Date & Time', short: 'Time' },
  { id: 4, name: 'Confirm', short: 'Confirm' },
];

export const StepIndicator: React.FC = () => {
  const { step, setStep, isStep1Valid, isStep2Valid, isStep3Valid } = useBooking();

  const handleStepClick = (targetStep: number) => {
    // Only allow navigating backwards or to validated next steps
    if (targetStep < step) {
      setStep(targetStep);
    } else if (targetStep === 2 && isStep1Valid) {
      setStep(2);
    } else if (targetStep === 3 && isStep1Valid && isStep2Valid) {
      setStep(3);
    } else if (targetStep === 4 && isStep1Valid && isStep2Valid && isStep3Valid) {
      setStep(4);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6">
      {/* Progress Bar Track */}
      <div className="relative flex items-center justify-between">
        {/* Continuous background bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-charcoal-200 dark:bg-charcoal-800 -z-0" />
        
        {/* Active progress fill */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-copper-500 transition-all duration-300 -z-0"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((s) => {
          const isCompleted = s.id < step;
          const isCurrent = s.id === step;
          const isAccessible = s.id <= step;

          return (
            <button
              key={s.id}
              onClick={() => handleStepClick(s.id)}
              disabled={!isAccessible}
              className={`relative z-10 flex flex-col items-center group transition-colors focus:outline-none min-h-touch justify-center ${
                !isAccessible ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
              aria-label={`Step ${s.id}: ${s.name}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-copper-500 text-white'
                    : isCurrent
                    ? 'bg-charcoal-900 text-copper-400 border-2 border-copper-500 shadow-sm copper-glow-sm dark:bg-charcoal-950'
                    : 'bg-white dark:bg-charcoal-900 text-charcoal-400 border border-charcoal-200 dark:border-charcoal-700'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.id}
              </div>
              <span
                className={`text-[11px] font-medium mt-1.5 transition-colors hidden sm:block ${
                  isCurrent
                    ? 'text-copper-600 dark:text-copper-400 font-semibold'
                    : isCompleted
                    ? 'text-charcoal-700 dark:text-charcoal-300'
                    : 'text-charcoal-400 dark:text-charcoal-500'
                }`}
              >
                {s.name}
              </span>
              <span
                className={`text-[10px] font-medium mt-1 transition-colors sm:hidden ${
                  isCurrent
                    ? 'text-copper-600 dark:text-copper-400 font-semibold'
                    : 'text-charcoal-400 dark:text-charcoal-500'
                }`}
              >
                {s.short}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
