import React from 'react';
import { Check } from 'lucide-react';
import { useBooking } from '../../context/BookingContext';

const STEPS = [
  { id: 1, name: 'Services' },
  { id: 2, name: 'Barber' },
  { id: 3, name: 'Date & Time' },
  { id: 4, name: 'Confirm' },
];

export const StepIndicator: React.FC = () => {
  const { step, setStep, isStep1Valid, isStep2Valid, isStep3Valid } = useBooking();

  const handleStepClick = (targetStep: number) => {
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
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-5">
      <div className="relative flex items-center justify-between">
        {/* Track Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-charcoal-200 dark:bg-charcoal-800 -z-0" />
        
        {/* Active Fill Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-charcoal-900 dark:bg-white transition-all duration-300 -z-0"
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
              className={`relative z-10 flex flex-col items-center group focus:outline-none min-h-touch justify-center ${
                !isAccessible ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
              }`}
              aria-label={`Step ${s.id}: ${s.name}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${
                  isCompleted
                    ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950'
                    : isCurrent
                    ? 'bg-white dark:bg-charcoal-950 text-charcoal-900 dark:text-white border-2 border-charcoal-900 dark:border-white'
                    : 'bg-white dark:bg-charcoal-950 text-charcoal-400 border border-charcoal-200 dark:border-charcoal-800'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2]" /> : s.id}
              </div>
              <span
                className={`text-[11px] mt-1.5 transition-colors ${
                  isCurrent
                    ? 'font-semibold text-charcoal-900 dark:text-white'
                    : 'text-charcoal-400 dark:text-charcoal-500'
                }`}
              >
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
