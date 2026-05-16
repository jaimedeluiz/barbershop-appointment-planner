import React from 'react';
import { Sun, Moon, Calendar, Lock } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLookup, onOpenAdmin }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 dark:bg-charcoal-950/90 border-b border-charcoal-100 dark:border-charcoal-850 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand with Minimalist Line Icon */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => window.location.reload()}
        >
          {/* Minimalist Line Drawing Logo */}
          <div className="w-8 h-8 rounded-lg border border-charcoal-200 dark:border-charcoal-700 flex items-center justify-center text-charcoal-900 dark:text-white">
            <svg
              className="w-4 h-4 stroke-[1.5]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="6" r="3" />
              <path d="M8.12 8.12 12 12" />
              <path d="M20 4 8.12 15.88" />
              <circle cx="6" cy="18" r="3" />
              <path d="M14.8 14.8 20 20" />
            </svg>
          </div>

          <span className="font-display text-xl sm:text-2xl tracking-normal text-charcoal-950 dark:text-white leading-none">
            FRESH <span className="text-copper-600 dark:text-copper-400">BARBER</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1.5">
          {/* Customer Booking Lookup */}
          <button
            onClick={onOpenLookup}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-white rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-850 transition-colors min-h-touch"
            title="Look up your booking"
            aria-label="Look up your booking"
          >
            <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden sm:inline">My Booking</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white hover:bg-charcoal-100 dark:hover:bg-charcoal-850 transition-colors min-h-touch min-w-touch"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 stroke-[1.5]" />
            ) : (
              <Moon className="w-4 h-4 stroke-[1.5]" />
            )}
          </button>

          {/* Admin Dashboard */}
          <button
            onClick={onOpenAdmin}
            className="w-9 h-9 sm:w-auto sm:px-2.5 flex items-center justify-center space-x-1 text-xs font-medium text-charcoal-400 hover:text-charcoal-800 dark:hover:text-white rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-850 transition-colors min-h-touch"
            title="Staff Portal"
            aria-label="Staff Portal"
          >
            <Lock className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden sm:inline text-xs">Staff</span>
          </button>
        </div>
      </div>
    </header>
  );
};
