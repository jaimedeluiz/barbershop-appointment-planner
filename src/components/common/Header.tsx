import React from 'react';
import { Scissors, Sun, Moon, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  onOpenLookup: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLookup, onOpenAdmin }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-charcoal-900/85 border-b border-charcoal-200/60 dark:border-charcoal-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-copper-500 to-copper-700 flex items-center justify-center text-white shadow-md shadow-copper-500/20">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <h1 className="font-serif tracking-wider font-bold text-lg text-charcoal-900 dark:text-white leading-tight">
              CROWN & BLADE
            </h1>
            <p className="text-[10px] tracking-widest uppercase font-medium text-copper-600 dark:text-copper-400">
              Artisanal Barber Co.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Customer Booking Lookup */}
          <button
            onClick={onOpenLookup}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-charcoal-700 dark:text-charcoal-200 hover:text-copper-600 dark:hover:text-copper-400 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg transition-colors min-h-touch"
            title="Look up your booking"
            aria-label="Look up your booking"
          >
            <CalendarCheck className="w-4 h-4 text-copper-500" />
            <span className="hidden sm:inline">My Booking</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors min-h-touch min-w-touch"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-charcoal-700" />
            )}
          </button>

          {/* Admin Dashboard */}
          <button
            onClick={onOpenAdmin}
            className="w-10 h-10 sm:w-auto sm:px-3 flex items-center justify-center space-x-1 text-xs font-medium text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white rounded-lg hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors min-h-touch"
            title="Admin Login"
            aria-label="Admin Login"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </button>
        </div>
      </div>
    </header>
  );
};
