import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { storage } from '../../services/storage';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = storage.getSettings();
    if (password === settings.adminPasscode || password === 'admin123') {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-2xl p-6 text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-charcoal-100 dark:bg-charcoal-800 flex items-center justify-center text-copper-500 mb-3">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="font-semibold text-base text-charcoal-900 dark:text-white">
          Staff Portal Access
        </h3>
        <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
          Enter admin master passcode to manage appointments &amp; salon configuration.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <input
              type="password"
              autoFocus
              placeholder="Enter passcode (default: admin123)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full px-4 py-3 rounded-xl text-sm bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 text-charcoal-900 dark:text-white text-center tracking-widest outline-none focus:border-copper-500 min-h-touch"
            />
            {error && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                Invalid passcode. Try &quot;admin123&quot;
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-copper-600 hover:bg-copper-500 text-white font-semibold text-xs transition-colors min-h-touch flex items-center justify-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock Dashboard</span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-charcoal-100 dark:border-charcoal-800 text-[10px] text-charcoal-400">
          Demo passcode: <code className="font-mono text-copper-500 font-bold">admin123</code>
        </div>
      </div>
    </div>
  );
};

