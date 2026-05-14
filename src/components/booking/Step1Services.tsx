import React, { useState, useEffect } from 'react';
import { Clock, Check, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { Service, ServiceCategory } from '../../types';
import { storage } from '../../services/storage';
import { useBooking } from '../../context/BookingContext';

const CATEGORIES: { id: ServiceCategory; label: string }[] = [
  { id: 'all', label: 'All Services' },
  { id: 'bundles', label: 'Bundles & Savings' },
  { id: 'cuts', label: 'Haircuts' },
  { id: 'shaves', label: 'Beard & Shave' },
  { id: 'color', label: 'Color & Tone' },
  { id: 'kids', label: 'Kids' },
];

export const Step1Services: React.FC = () => {
  const { selectedServices, toggleService, nextStep, isStep1Valid, totalDurationMinutes, totalPrice, totalDiscount } = useBooking();
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');

  useEffect(() => {
    setServices(storage.getServices().filter((s) => s.active));

    const handleStorage = () => {
      setServices(storage.getServices().filter((s) => s.active));
    };
    window.addEventListener('cb_storage_update', handleStorage);
    return () => window.removeEventListener('cb_storage_update', handleStorage);
  }, []);

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="w-full pb-28">
      {/* Header text */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 dark:text-white tracking-tight">
          Select Your Services
        </h2>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">
          Pick individual services or choose a bundle to save. Combine as many as you need.
        </p>
      </div>

      {/* Category Pills (Horizontal Scroll on Mobile) */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-3 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all min-h-touch ${
                isActive
                  ? 'bg-copper-600 text-white shadow-sm'
                  : 'bg-white dark:bg-charcoal-900 text-charcoal-600 dark:text-charcoal-300 border border-charcoal-200 dark:border-charcoal-800 hover:border-copper-400'
              }`}
            >
              {cat.id === 'bundles' && <Sparkles className="w-3.5 h-3.5 inline mr-1 text-copper-200" />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isSelected = selectedServices.some((s) => s.id === service.id);

          return (
            <div
              key={service.id}
              onClick={() => toggleService(service)}
              className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-copper-50/60 dark:bg-copper-950/20 border-copper-500 ring-1 ring-copper-500 shadow-md shadow-copper-500/10'
                  : 'bg-white dark:bg-charcoal-900 border-charcoal-200/80 dark:border-charcoal-800/80 hover:border-copper-300 dark:hover:border-charcoal-700 shadow-sm'
              }`}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleService(service);
                }
              }}
            >
              <div>
                {/* Badges row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {service.isBundle && (
                      <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-copper-100 dark:bg-copper-900/60 text-copper-700 dark:text-copper-300">
                        <Tag className="w-3 h-3 mr-1" />
                        Bundle Offer
                      </span>
                    )}
                    {service.popular && !service.isBundle && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                        Popular
                      </span>
                    )}
                    {service.discountAmount ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Save ${service.discountAmount}
                      </span>
                    ) : null}
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-copper-500 text-white'
                        : 'border border-charcoal-300 dark:border-charcoal-700 group-hover:border-copper-400'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[2.5]" />}
                  </div>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-base text-charcoal-900 dark:text-white group-hover:text-copper-600 dark:group-hover:text-copper-400 transition-colors">
                  {service.name}
                </h3>

                {/* Description */}
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Price & Duration footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-charcoal-100 dark:border-charcoal-800/80">
                <div className="flex items-center text-xs text-charcoal-500 dark:text-charcoal-400">
                  <Clock className="w-3.5 h-3.5 mr-1 text-copper-500" />
                  <span>{service.durationMinutes} min</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-charcoal-900 dark:text-white">
                    ${service.price}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/95 dark:bg-charcoal-900/95 border-t border-charcoal-200 dark:border-charcoal-800 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
              {selectedServices.length === 0
                ? 'No services selected'
                : `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} • ${totalDurationMinutes} min`}
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-bold text-charcoal-900 dark:text-white">
                ${totalPrice}
              </span>
              {totalDiscount > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  (Includes ${totalDiscount} discount)
                </span>
              )}
            </div>
          </div>

          <button
            onClick={nextStep}
            disabled={!isStep1Valid}
            className={`flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all min-h-touch ${
              isStep1Valid
                ? 'bg-copper-600 hover:bg-copper-500 text-white shadow-md shadow-copper-500/25 active:scale-[0.98]'
                : 'bg-charcoal-200 dark:bg-charcoal-800 text-charcoal-400 cursor-not-allowed'
            }`}
          >
            <span>Choose Barber</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
