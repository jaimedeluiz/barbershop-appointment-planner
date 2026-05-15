import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Star, Users } from 'lucide-react';
import { Barber } from '../../types';
import { storage } from '../../services/storage';
import { useBooking } from '../../context/BookingContext';

export const Step2Barber: React.FC = () => {
  const { selectedBarberId, setSelectedBarberId, nextStep, prevStep } = useBooking();
  const [barbers, setBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    setBarbers(storage.getBarbers().filter((b) => b.available));

    const handleStorage = () => {
      setBarbers(storage.getBarbers().filter((b) => b.available));
    };
    window.addEventListener('cb_storage_update', handleStorage);
    return () => window.removeEventListener('cb_storage_update', handleStorage);
  }, []);

  return (
    <div className="w-full pb-28">
      <div className="space-y-3">
        {/* OPTION 1: ANY AVAILABLE BARBER */}
        <div
          onClick={() => setSelectedBarberId('any')}
          className={`p-4 rounded-xl cursor-pointer transition-all border text-left flex items-center justify-between ${
            selectedBarberId === 'any'
              ? 'bg-charcoal-50 dark:bg-charcoal-900 border-charcoal-900 dark:border-white shadow-sm'
              : 'bg-white dark:bg-charcoal-950 border-charcoal-200/70 dark:border-charcoal-800/80 hover:border-charcoal-400 dark:hover:border-charcoal-700'
          }`}
          role="radio"
          aria-checked={selectedBarberId === 'any'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setSelectedBarberId('any');
            }
          }}
        >
          <div className="flex items-center space-x-3.5">
            {/* Minimalist Line Drawing Avatar */}
            <div className="w-11 h-11 rounded-lg border border-charcoal-200 dark:border-charcoal-700 flex items-center justify-center text-charcoal-700 dark:text-charcoal-300">
              <Users className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm text-charcoal-900 dark:text-white">
                  Any Available Barber
                </h3>
                <span className="text-[10px] text-charcoal-400 font-normal">
                  (Fastest)
                </span>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">
                Automatically assigns the first open chair
              </p>
            </div>
          </div>

          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors flex-shrink-0 ${
              selectedBarberId === 'any'
                ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950'
                : 'border border-charcoal-300 dark:border-charcoal-700'
            }`}
          >
            {selectedBarberId === 'any' && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </div>
        </div>

        {/* SPECIFIC BARBERS (Clean Monograms Instead of Photos) */}
        {barbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;

          return (
            <div
              key={barber.id}
              onClick={() => setSelectedBarberId(barber.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border text-left flex items-start justify-between ${
                isSelected
                  ? 'bg-charcoal-50 dark:bg-charcoal-900 border-charcoal-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-charcoal-950 border-charcoal-200/70 dark:border-charcoal-800/80 hover:border-charcoal-400 dark:hover:border-charcoal-700'
              }`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setSelectedBarberId(barber.id);
                }
              }}
            >
              <div className="flex items-start space-x-3.5">
                {/* Minimalist Monogram Line Avatar */}
                <div className="w-11 h-11 rounded-lg border border-charcoal-200 dark:border-charcoal-700 flex items-center justify-center text-xs font-semibold text-charcoal-800 dark:text-charcoal-200 tracking-wider">
                  {barber.initials || barber.name.split(' ').map((n) => n[0]).join('')}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-sm text-charcoal-900 dark:text-white">
                      {barber.name}
                    </h3>
                    <div className="flex items-center text-charcoal-400 text-xs">
                      <Star className="w-3 h-3 stroke-[1.5] text-amber-500 fill-amber-400 mr-1" />
                      <span>{barber.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-charcoal-400 mt-0.5">
                    {barber.role}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {barber.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-charcoal-200 dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
                  isSelected
                    ? 'bg-charcoal-900 text-white dark:bg-white dark:text-charcoal-950'
                    : 'border border-charcoal-300 dark:border-charcoal-700'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </div>
          );
        })}
      </div>

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
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium text-xs bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 active:scale-[0.98] transition-all min-h-touch"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
