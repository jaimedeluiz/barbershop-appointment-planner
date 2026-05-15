import React, { useState, useEffect } from 'react';
import { Clock, Check, ArrowRight } from 'lucide-react';
import { Service, ServiceCategory } from '../../types';
import { storage } from '../../services/storage';
import { useBooking } from '../../context/BookingContext';

const CATEGORIES: { id: ServiceCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cuts', label: 'Haircuts' },
  { id: 'shaves', label: 'Beard & Shave' },
  { id: 'bundles', label: 'Bundles' },
  { id: 'color', label: 'Color' },
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
      {/* Category Tabs (Minimal horizontal line) */}
      <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1 mb-6 border-b border-charcoal-100 dark:border-charcoal-850">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors min-h-touch ${
                isActive
                  ? 'border-charcoal-900 dark:border-white text-charcoal-900 dark:text-white font-semibold'
                  : 'border-transparent text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Services List */}
      <div className="space-y-2.5">
        {filteredServices.map((service) => {
          const isSelected = selectedServices.some((s) => s.id === service.id);

          return (
            <div
              key={service.id}
              onClick={() => toggleService(service)}
              className={`p-4 rounded-xl cursor-pointer transition-all border text-left flex items-start justify-between gap-4 ${
                isSelected
                  ? 'bg-charcoal-50 dark:bg-charcoal-900 border-charcoal-900 dark:border-white shadow-sm'
                  : 'bg-white dark:bg-charcoal-950 border-charcoal-200/70 dark:border-charcoal-800/80 hover:border-charcoal-400 dark:hover:border-charcoal-700'
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
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm text-charcoal-900 dark:text-white">
                    {service.name}
                  </h3>
                  {service.isBundle && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300">
                      Bundle
                    </span>
                  )}
                  {service.discountAmount ? (
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Save ${service.discountAmount}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-charcoal-400 dark:text-charcoal-400 mt-1 leading-relaxed">
                  {service.description}
                </p>

                <div className="flex items-center space-x-3 text-xs text-charcoal-400 mt-2">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 stroke-[1.5] mr-1" />
                    {service.durationMinutes} min
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-charcoal-900 dark:text-white">
                    ${service.price}
                  </span>
                </div>
              </div>

              {/* Minimal Line Checkbox */}
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

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-white/95 dark:bg-charcoal-950/95 border-t border-charcoal-100 dark:border-charcoal-800 p-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-charcoal-400">
              {selectedServices.length === 0
                ? 'No services selected'
                : `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} • ${totalDurationMinutes} min`}
            </p>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-charcoal-900 dark:text-white">
                ${totalPrice}
              </span>
              {totalDiscount > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  (${totalDiscount} saved)
                </span>
              )}
            </div>
          </div>

          <button
            onClick={nextStep}
            disabled={!isStep1Valid}
            className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium text-xs transition-all min-h-touch ${
              isStep1Valid
                ? 'bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 active:scale-[0.98]'
                : 'bg-charcoal-100 dark:bg-charcoal-850 text-charcoal-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
