import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Check, ArrowRight, ArrowLeft } from 'lucide-react';
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
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 dark:text-white tracking-tight">
          Select Your Barber
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Pick your preferred artisan or select &quot;Any Available&quot; for the maximum time slot flexibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* OPTION 1: ANY AVAILABLE BARBER (Default) */}
        <div
          onClick={() => setSelectedBarberId('any')}
          className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left flex items-start justify-between ${
            selectedBarberId === 'any'
              ? 'bg-copper-50/60 dark:bg-copper-950/20 border-copper-500 ring-1 ring-copper-500 shadow-md shadow-copper-500/10'
              : 'bg-white dark:bg-charcoal-900 border-charcoal-200/80 dark:border-charcoal-800/80 hover:border-copper-300 dark:hover:border-charcoal-700 shadow-sm'
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
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-charcoal-800 to-charcoal-950 dark:from-charcoal-700 dark:to-charcoal-900 flex items-center justify-center text-copper-400 shadow-inner flex-shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-copper-600 dark:text-copper-400">
                  Recommended
                </span>
              </div>
              <h3 className="font-semibold text-base text-charcoal-900 dark:text-white mt-0.5">
                Any Available Barber
              </h3>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1 leading-relaxed">
                Great if you need a specific time. We&apos;ll automatically assign the first available master barber.
              </p>
            </div>
          </div>

          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ml-2 ${
              selectedBarberId === 'any'
                ? 'bg-copper-500 text-white'
                : 'border border-charcoal-300 dark:border-charcoal-700'
            }`}
          >
            {selectedBarberId === 'any' && <Check className="w-4 h-4 stroke-[2.5]" />}
          </div>
        </div>

        {/* SPECIFIC BARBERS */}
        {barbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;

          return (
            <div
              key={barber.id}
              onClick={() => setSelectedBarberId(barber.id)}
              className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left flex items-start justify-between ${
                isSelected
                  ? 'bg-copper-50/60 dark:bg-copper-950/20 border-copper-500 ring-1 ring-copper-500 shadow-md shadow-copper-500/10'
                  : 'bg-white dark:bg-charcoal-900 border-charcoal-200/80 dark:border-charcoal-800/80 hover:border-copper-300 dark:hover:border-charcoal-700 shadow-sm'
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
              <div className="flex items-start space-x-4">
                <img
                  src={barber.avatar}
                  alt={barber.name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-sm flex-shrink-0 border border-charcoal-200 dark:border-charcoal-700"
                  loading="lazy"
                />
                <div>
                  <div className="flex items-center space-x-1.5 text-xs">
                    <span className="font-semibold text-charcoal-800 dark:text-charcoal-200">
                      {barber.role}
                    </span>
                    <span className="text-charcoal-400">•</span>
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                      <span className="font-medium text-[11px]">{barber.rating}</span>
                      <span className="text-[10px] text-charcoal-400 ml-0.5">({barber.reviewCount})</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-base text-charcoal-900 dark:text-white mt-0.5">
                    {barber.name}
                  </h3>

                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1 line-clamp-2 leading-relaxed">
                    {barber.bio}
                  </p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {barber.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ml-2 ${
                  isSelected
                    ? 'bg-copper-500 text-white'
                    : 'border border-charcoal-300 dark:border-charcoal-700'
                }`}
              >
                {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
              </div>
            </div>
          );
        })}
      </div>

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
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-copper-600 hover:bg-copper-500 text-white shadow-md shadow-copper-500/25 active:scale-[0.98] transition-all min-h-touch"
          >
            <span>Choose Date & Time</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
