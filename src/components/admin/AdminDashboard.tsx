import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Users,
  Scissors,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  BarChart3,
  Settings,
  Ban,
  Search,
  Mail,
  Bell,
} from 'lucide-react';
import { Service, Barber, Booking, ShopSettings, ServiceCategory } from '../../types';
import { storage } from '../../services/storage';
import { formatDateDisplay } from '../../utils/timeSlots';
import { isWithin24Hours, generateEmailReminder, triggerBrowserNotification } from '../../utils/reminders';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'calendar' | 'services' | 'barbers' | 'analytics' | 'settings';
type ViewMode = 'all' | 'today' | 'weekly' | 'date';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(storage.getSettings());

  // Calendar View filters
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterBarberId, setFilterBarberId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New Service Modal
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // New Walk-in Booking Modal
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);

  // Block out time modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: new Date().toISOString().split('T')[0],
    barberId: '',
    startTime: '13:00',
    endTime: '14:00',
    reason: 'Lunch Break / Meeting',
  });

  const refreshAll = () => {
    setServices(storage.getServices());
    setBarbers(storage.getBarbers());
    setBookings(storage.getBookings());
    setSettings(storage.getSettings());
  };

  useEffect(() => {
    refreshAll();
    window.addEventListener('cb_storage_update', refreshAll);
    return () => window.removeEventListener('cb_storage_update', refreshAll);
  }, []);

  // Whenever modal opens, refresh immediately from storage
  useEffect(() => {
    if (isOpen) {
      refreshAll();
    }
  }, [isOpen]);

  // Filtered bookings for current calendar view
  const currentViewBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    return bookings
      .filter((b) => {
        // Status filter
        if (filterStatus !== 'all' && b.status !== filterStatus) {
          return false;
        }

        // Barber filter
        if (filterBarberId !== 'all' && b.barberId !== filterBarberId) {
          return false;
        }

        // Search query filter (matches ID, customer name, or phone)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = b.id.toLowerCase().includes(q);
          const matchName = b.customerName.toLowerCase().includes(q);
          const matchPhone = b.customerPhone.includes(q);
          if (!matchId && !matchName && !matchPhone) return false;
        }

        // View mode date filtering
        if (viewMode === 'all') {
          return true; // Show all bookings!
        } else if (viewMode === 'today') {
          return b.date === todayStr;
        } else if (viewMode === 'date') {
          return b.date === selectedDate;
        } else if (viewMode === 'weekly') {
          const base = new Date(selectedDate);
          const weekDates: string[] = [];
          for (let i = 0; i < 7; i++) {
            const d = new Date(base);
            d.setDate(base.getDate() + i);
            weekDates.push(d.toISOString().split('T')[0]);
          }
          return weekDates.includes(b.date);
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by date then startTime
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [bookings, viewMode, selectedDate, filterBarberId, filterStatus, searchQuery]);

  // Analytics Stats
  const stats = useMemo(() => {
    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
    const todayBookings = activeBookings.filter(
      (b) => b.date === new Date().toISOString().split('T')[0]
    );

    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Popular services counter
    const serviceCounts: Record<string, { name: string; count: number; revenue: number }> = {};
    activeBookings.forEach((b) => {
      b.services.forEach((s) => {
        if (!serviceCounts[s.name]) {
          serviceCounts[s.name] = { name: s.name, count: 0, revenue: 0 };
        }
        serviceCounts[s.name].count += 1;
        serviceCounts[s.name].revenue += s.price;
      });
    });

    const popularServices = Object.values(serviceCounts).sort(
      (a, b) => b.count - a.count
    );

    return {
      totalBookings: activeBookings.length,
      todayBookings: todayBookings.length,
      todayRevenue,
      totalRevenue,
      popularServices,
    };
  }, [bookings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-charcoal-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl my-4 sm:my-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-charcoal-200 dark:border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-copper-600 flex items-center justify-center text-white">
              <Scissors className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h2 className="font-semibold text-base sm:text-lg text-charcoal-900 dark:text-white">
                Staff Operations Hub
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                Manage appointments, masters, services, and live shop availability
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (window.confirm('Reset all demo data back to default sample state?')) {
                  storage.resetDefaults();
                  refreshAll();
                }
              }}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-600 dark:text-charcoal-300 bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 transition-colors"
              title="Reset sample data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-white hover:bg-charcoal-100 dark:hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 px-4 sm:px-6 pt-3 border-b border-charcoal-200 dark:border-charcoal-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'calendar', label: `Appointments (${bookings.length})`, icon: Calendar },
            { id: 'services', label: 'Services & Bundles', icon: Scissors },
            { id: 'barbers', label: 'Artisans & Shifts', icon: Users },
            { id: 'analytics', label: 'Statistics & Revenue', icon: BarChart3 },
            { id: 'settings', label: 'Shop Schedule', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors min-h-touch ${
                  isActive
                    ? 'border-charcoal-900 dark:border-white text-charcoal-900 dark:text-white'
                    : 'border-transparent text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CALENDAR & BOOKINGS */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col gap-3 bg-charcoal-50 dark:bg-charcoal-950 p-3.5 rounded-2xl border border-charcoal-200/60 dark:border-charcoal-800">
                {/* Row 1: View mode tabs & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex rounded-xl bg-charcoal-200/70 dark:bg-charcoal-800 p-0.5 text-xs overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        viewMode === 'all'
                          ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white shadow-sm'
                          : 'text-charcoal-500'
                      }`}
                    >
                      All ({bookings.length})
                    </button>
                    <button
                      onClick={() => setViewMode('today')}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        viewMode === 'today'
                          ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white shadow-sm'
                          : 'text-charcoal-500'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setViewMode('weekly')}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        viewMode === 'weekly'
                          ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white shadow-sm'
                          : 'text-charcoal-500'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setViewMode('date')}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        viewMode === 'date'
                          ? 'bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-white shadow-sm'
                          : 'text-charcoal-500'
                      }`}
                    >
                      Specific Date
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative flex-1 sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="Search customer, phone, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 text-charcoal-900 dark:text-white outline-none"
                    />
                    <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2 stroke-[1.5]" />
                  </div>
                </div>

                {/* Row 2: Filters & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-charcoal-200/50 dark:border-charcoal-850">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    {viewMode === 'date' && (
                      <div className="flex items-center bg-white dark:bg-charcoal-900 rounded-xl border border-charcoal-200 dark:border-charcoal-800 px-2.5 py-1.5">
                        <Calendar className="w-3.5 h-3.5 text-charcoal-500 mr-2" />
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="text-xs bg-transparent text-charcoal-900 dark:text-white outline-none"
                        />
                      </div>
                    )}

                    <select
                      value={filterBarberId}
                      onChange={(e) => setFilterBarberId(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 text-charcoal-900 dark:text-white outline-none"
                    >
                      <option value="all">All Barbers</option>
                      {barbers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 text-charcoal-900 dark:text-white outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-charcoal-200/80 dark:bg-charcoal-800 hover:bg-charcoal-300 text-charcoal-800 dark:text-charcoal-200 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5 text-red-500" />
                      <span>Block Time</span>
                    </button>

                    <button
                      onClick={() => setShowManualBookingModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-charcoal-900 dark:bg-white text-white dark:text-charcoal-950 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Walk-In</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              {currentViewBookings.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950/40 border border-charcoal-200 dark:border-charcoal-800">
                  <Calendar className="w-8 h-8 mx-auto text-charcoal-400 mb-2 opacity-50 stroke-[1.5]" />
                  <p className="font-semibold text-charcoal-700 dark:text-charcoal-300 text-sm">
                    No Appointments Found
                  </p>
                  <p className="text-xs text-charcoal-400 mt-1">
                    {bookings.length > 0
                      ? 'No appointments match the selected filter. Try switching to "All" view mode above.'
                      : 'No appointments in the system yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentViewBookings.map((b) => {
                    const isCancelled = b.status === 'cancelled';
                    const isCompleted = b.status === 'completed';
                    const todayStr = new Date().toISOString().split('T')[0];
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];

                    const dateBadge =
                      b.date === todayStr
                        ? 'Today'
                        : b.date === tomorrowStr
                        ? 'Tomorrow'
                        : formatDateDisplay(b.date);

                    const isUpcoming24h = isWithin24Hours(b.date, b.startTime);

                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isCancelled
                            ? 'bg-charcoal-50/50 dark:bg-charcoal-950/40 border-charcoal-200/50 dark:border-charcoal-800 opacity-60'
                            : 'bg-white dark:bg-charcoal-900 border-charcoal-200 dark:border-charcoal-800 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 rounded-lg border border-charcoal-200 dark:border-charcoal-700 bg-charcoal-50 dark:bg-charcoal-950 flex flex-col items-center justify-center text-xs flex-shrink-0">
                            <span className="font-semibold text-charcoal-900 dark:text-white leading-none">
                              {b.startTime}
                            </span>
                            <span className="text-[10px] text-charcoal-400 mt-0.5">
                              {b.totalDurationMinutes}m
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-mono text-xs font-semibold text-charcoal-900 dark:text-white">
                                {b.id}
                              </span>
                              <span className="text-xs font-semibold text-charcoal-900 dark:text-white">
                                {b.customerName}
                              </span>
                              <span className="text-[11px] text-charcoal-400">
                                {b.customerPhone}
                              </span>

                              {/* Clickable Customer Email Link */}
                              {b.customerEmail ? (
                                <a
                                  href={generateEmailReminder(b, settings).mailtoUrl}
                                  className="inline-flex items-center space-x-1 text-[11px] text-copper-600 dark:text-copper-400 hover:underline px-1.5 py-0.5 rounded bg-copper-50 dark:bg-copper-950/40 transition-colors"
                                  title={`Click to compose email to ${b.customerEmail}`}
                                >
                                  <Mail className="w-3 h-3 stroke-[1.5]" />
                                  <span>{b.customerEmail}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-charcoal-400 italic">No email</span>
                              )}

                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                                {dateBadge}
                              </span>

                              {isUpcoming24h && !isCancelled && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 animate-pulse">
                                  Within 24h
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-medium text-charcoal-700 dark:text-charcoal-300 mt-0.5">
                              {b.serviceNames.join(' • ')}
                            </p>

                            <div className="flex items-center space-x-2.5 text-[11px] text-charcoal-400 mt-1">
                              <span>Barber: {b.barberName}</span>
                              <span>•</span>
                              <span>
                                {formatDateDisplay(b.date)} ({b.startTime} – {b.endTime})
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-charcoal-900 dark:text-white">
                                ${b.totalPrice}
                              </span>
                            </div>

                            {b.notes && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400 italic mt-0.5">
                                &ldquo;{b.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 self-end md:self-center flex-wrap gap-y-1">
                          {/* 24h Reminder Action Button */}
                          {!isCancelled && (
                            <button
                              onClick={() => {
                                const reminder = generateEmailReminder(b, settings);
                                storage.updateBooking({
                                  ...b,
                                  reminderSent: true,
                                  reminderSentAt: new Date().toISOString(),
                                });
                                triggerBrowserNotification(b, settings);
                                refreshAll();
                                // Direct to default email client with prefilled reminder template
                                window.location.href = reminder.mailtoUrl;
                              }}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                b.reminderSent
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : isUpcoming24h
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-semibold'
                                  : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-200'
                              }`}
                              title="Send 24h reminder email to customer"
                            >
                              <Bell className="w-3 h-3 stroke-[1.5]" />
                              <span>{b.reminderSent ? 'Reminder Sent' : '24h Reminder'}</span>
                            </button>
                          )}

                          <span
                            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                              isCancelled
                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                : isCompleted
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}
                          >
                            {b.status}
                          </span>

                          {!isCancelled && (
                            <>
                              {!isCompleted && (
                                <button
                                  onClick={() => {
                                    storage.updateBooking({ ...b, status: 'completed' });
                                    refreshAll();
                                  }}
                                  className="px-2 py-1 rounded-md text-xs font-medium bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-charcoal-200 transition-colors"
                                  title="Mark as completed"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Cancel booking ${b.id}?`)) {
                                    storage.cancelBooking(b.id);
                                    refreshAll();
                                  }
                                }}
                                className="px-2 py-1 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Cancel appointment"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently remove booking ${b.id}?`)) {
                                storage.deleteBooking(b.id);
                                refreshAll();
                              }
                            }}
                            className="p-1 text-charcoal-400 hover:text-red-600 transition-colors"
                            title="Delete booking"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SERVICES & BUNDLES */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-charcoal-900 dark:text-white">
                    Service Catalog ({services.length})
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Add, edit prices, change durations, or configure savings bundles.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceModal(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-copper-600 hover:bg-copper-500 text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Service / Bundle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400">
                          {service.category} {service.isBundle && '• Bundle'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceModal(true);
                            }}
                            className="p-1.5 text-charcoal-400 hover:text-charcoal-800 dark:hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete service "${service.name}"?`)) {
                                storage.deleteService(service.id);
                                refreshAll();
                              }
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-sm text-charcoal-900 dark:text-white">
                        {service.name}
                      </h4>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5 line-clamp-2">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-charcoal-100 dark:border-charcoal-800 text-xs">
                      <span className="text-charcoal-500">{service.durationMinutes} minutes</span>
                      <span className="font-bold text-copper-600 dark:text-copper-400 text-base">
                        ${service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ARTISANS & SHIFTS */}
          {activeTab === 'barbers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base text-charcoal-900 dark:text-white">
                    Master Barbers & Working Shifts
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Configure individual working hours, break periods, and days off.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {barbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg border border-charcoal-200 dark:border-charcoal-700 flex items-center justify-center text-xs font-semibold text-charcoal-800 dark:text-charcoal-200">
                        {barber.initials || barber.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-charcoal-900 dark:text-white">
                          {barber.name}
                        </h4>
                        <p className="text-xs text-charcoal-400">{barber.role}</p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 pt-2 border-t border-charcoal-100 dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-300">
                      <div className="flex justify-between">
                        <span className="text-charcoal-400">Shift:</span>
                        <span className="font-medium">
                          {barber.workHours.start} – {barber.workHours.end}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-400">Break:</span>
                        <span className="font-medium">
                          {barber.breakHours.start} – {barber.breakHours.end}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-400">Rating:</span>
                        <span className="font-medium text-amber-500">
                          {barber.rating} ★ ({barber.reviewCount})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-400">Status:</span>
                        <span className="text-emerald-500 font-semibold">Active Chair</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STATISTICS & REVENUE */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Stat KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-400">
                    Today&apos;s Bookings
                  </span>
                  <p className="text-2xl font-bold text-charcoal-900 dark:text-white mt-1">
                    {stats.todayBookings}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-400">
                    Today&apos;s Revenue
                  </span>
                  <p className="text-2xl font-bold text-copper-600 dark:text-copper-400 mt-1">
                    ${stats.todayRevenue}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-400">
                    Total Bookings
                  </span>
                  <p className="text-2xl font-bold text-charcoal-900 dark:text-white mt-1">
                    {stats.totalBookings}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-400">
                    All-Time Revenue
                  </span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    ${stats.totalRevenue}
                  </p>
                </div>
              </div>

              {/* Popular Services Breakdown */}
              <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800">
                <h4 className="font-semibold text-sm text-charcoal-900 dark:text-white mb-3">
                  Most Requested Services
                </h4>
                <div className="space-y-3">
                  {stats.popularServices.map((item, idx) => {
                    const percentage = Math.round(
                      (item.count / (stats.totalBookings || 1)) * 100
                    );

                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-charcoal-800 dark:text-charcoal-200">
                            {idx + 1}. {item.name}
                          </span>
                          <span className="text-charcoal-400">
                            {item.count} bookings (${item.revenue})
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-charcoal-100 dark:bg-charcoal-800 overflow-hidden">
                          <div
                            className="h-full bg-copper-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHOP SCHEDULE & GENERAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-base text-charcoal-900 dark:text-white">
                Shop Operating Schedule & Buffer Times
              </h3>

              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                  const schedule = settings.schedule[dayIndex];
                  return (
                    <div
                      key={dayIndex}
                      className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-charcoal-800 dark:text-charcoal-200 w-28">
                        {schedule?.dayName}
                      </span>
                      <span className={schedule?.isOpen ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                        {schedule?.isOpen ? `${schedule.openTime} – ${schedule.closeTime}` : 'Closed'}
                      </span>
                      <button
                        onClick={() => {
                          const updated = { ...settings };
                          updated.schedule[dayIndex].isOpen = !updated.schedule[dayIndex].isOpen;
                          storage.saveSettings(updated);
                          setSettings(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-100"
                      >
                        Toggle
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-charcoal-50 dark:bg-charcoal-950 border border-charcoal-200 dark:border-charcoal-800 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-charcoal-700 dark:text-charcoal-300">
                    Sanitation & Prep Buffer Between Appointments:
                  </span>
                  <span className="font-bold text-copper-600">{settings.bufferMinutes} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-charcoal-700 dark:text-charcoal-300">
                    Slot Granularity Step:
                  </span>
                  <span className="font-bold text-copper-600">{settings.slotIntervalMinutes} minutes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SERVICE EDIT / CREATE MODAL */}
      {showServiceModal && (
        <ServiceFormModal
          service={editingService}
          onClose={() => setShowServiceModal(false)}
          onSave={(svc) => {
            storage.saveService(svc);
            refreshAll();
            setShowServiceModal(false);
          }}
        />
      )}

      {/* BLOCK TIME MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl max-w-sm w-full space-y-3 border border-charcoal-200 dark:border-charcoal-800">
            <h4 className="font-semibold text-base text-charcoal-900 dark:text-white">
              Block Out Shop / Barber Time
            </h4>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-charcoal-500 mb-1">Date:</label>
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                  className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-charcoal-500 mb-1">Start:</label>
                  <input
                    type="time"
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-500 mb-1">End:</label>
                  <input
                    type="time"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-charcoal-500 mb-1">Artisan:</label>
                <select
                  value={blockForm.barberId}
                  onChange={(e) => setBlockForm({ ...blockForm, barberId: e.target.value })}
                  className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
                >
                  <option value="">Entire Shop</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-charcoal-500 mb-1">Reason:</label>
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const updated = { ...settings };
                  if (!updated.blockedTimes) updated.blockedTimes = [];
                  updated.blockedTimes.push({
                    id: `block-${Date.now()}`,
                    ...blockForm,
                  });
                  storage.saveSettings(updated);
                  refreshAll();
                  setShowBlockModal(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white"
              >
                Block Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALK-IN APPOINTMENT MODAL */}
      {showManualBookingModal && (
        <ManualWalkInModal
          services={services}
          barbers={barbers}
          onClose={() => setShowManualBookingModal(false)}
          onCreated={() => {
            refreshAll();
            setShowManualBookingModal(false);
          }}
        />
      )}
    </div>
  );
};

// Sub-component for adding / editing a service
const ServiceFormModal: React.FC<{
  service: Service | null;
  onClose: () => void;
  onSave: (s: Service) => void;
}> = ({ service, onClose, onSave }) => {
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [price, setPrice] = useState(service?.price?.toString() || '35');
  const [durationMinutes, setDurationMinutes] = useState(
    service?.durationMinutes?.toString() || '30'
  );
  const [category, setCategory] = useState<ServiceCategory>(service?.category || 'cuts');
  const [isBundle, setIsBundle] = useState(service?.isBundle || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newService: Service = {
      id: service?.id || `srv-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price) || 30,
      durationMinutes: parseInt(durationMinutes, 10) || 30,
      category: category as any,
      isBundle,
      active: true,
    };
    onSave(newService);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl max-w-sm w-full space-y-3 border border-charcoal-200 dark:border-charcoal-800"
      >
        <h4 className="font-semibold text-base text-charcoal-900 dark:text-white">
          {service ? 'Edit Service' : 'Add New Service'}
        </h4>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-charcoal-500 mb-1">Service Title:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
            />
          </div>

          <div>
            <label className="block text-charcoal-500 mb-1">Description:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-charcoal-500 mb-1">Price ($):</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
              />
            </div>
            <div>
              <label className="block text-charcoal-500 mb-1">Duration (min):</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-500 mb-1">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
            >
              <option value="cuts">Haircuts</option>
              <option value="shaves">Beard & Shave</option>
              <option value="color">Color & Tone</option>
              <option value="bundles">Bundles</option>
              <option value="kids">Kids</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isBundle"
              checked={isBundle}
              onChange={(e) => setIsBundle(e.target.checked)}
              className="rounded text-copper-600 focus:ring-copper-500"
            />
            <label htmlFor="isBundle" className="text-charcoal-700 dark:text-charcoal-300">
              Is a Special Bundle / Package
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-copper-600 text-white"
          >
            Save Service
          </button>
        </div>
      </form>
    </div>
  );
};

// Sub-component for adding walk-in appointments manually
const ManualWalkInModal: React.FC<{
  services: Service[];
  barbers: Barber[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ services, barbers, onClose, onCreated }) => {
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [phone, setPhone] = useState('+1 (555) 000-0000');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [selectedBarberId, setSelectedBarberId] = useState(barbers[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('11:00');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const service = services.find((s) => s.id === selectedServiceId) || services[0];
    const barber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];

    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + service.durationMinutes;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const newBooking: Booking = {
      id: `CB-${Math.floor(1000 + Math.random() * 9000)}`,
      serviceIds: [service.id],
      serviceNames: [service.name],
      services: [service],
      barberId: barber.id,
      barberName: barber.name,
      barberAvatar: barber.avatar,
      date,
      startTime,
      endTime,
      totalDurationMinutes: service.durationMinutes,
      totalPrice: service.price,
      customerName,
      customerPhone: phone,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    storage.addBooking(newBooking);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm">
      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl max-w-sm w-full space-y-3 border border-charcoal-200 dark:border-charcoal-800"
      >
        <h4 className="font-semibold text-base text-charcoal-900 dark:text-white">
          Manual / Walk-In Booking
        </h4>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-charcoal-500 mb-1">Customer Name:</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
            />
          </div>

          <div>
            <label className="block text-charcoal-500 mb-1">Phone Number:</label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
            />
          </div>

          <div>
            <label className="block text-charcoal-500 mb-1">Service:</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${s.price} • {s.durationMinutes}m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-charcoal-500 mb-1">Barber:</label>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-charcoal-500 mb-1">Date:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
              />
            </div>
            <div>
              <label className="block text-charcoal-500 mb-1">Start Time:</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 rounded-lg border dark:bg-charcoal-950 dark:border-charcoal-800"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-charcoal-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-copper-600 text-white"
          >
            Create Appointment
          </button>
        </div>
      </form>
    </div>
  );
};
