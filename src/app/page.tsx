'use client';

import React, { useState, useEffect } from 'react';
import { Resource, Booking, Block } from '@/lib/types';
import { DataService } from '@/lib/dataService';
import { WeekCalendarGrid } from '@/components/WeekCalendarGrid';
import { CalendarGrid } from '@/components/CalendarGrid';
import { BookingModal } from '@/components/BookingModal';
import { BlockModal } from '@/components/BlockModal';
import { useAuth } from '@/components/GoogleAuthProvider';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Grid,
  CalendarDays,
} from 'lucide-react';
import { format, startOfWeek, addDays, subDays, addWeeks, subWeeks } from 'date-fns';

export default function HomePage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ resourceId?: string; periodId?: string; date?: string }>({});

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = [0, 1, 2, 3, 4].map((i) => addDays(weekStart, i));

  const weekRangeText = `${format(weekDays[0], 'dd/MM')} - ${format(weekDays[4], 'dd/MM')}`;
  const selectedDateStr = format(currentDate, 'yyyy-MM-dd');

  const fetchData = async () => {
    try {
      await DataService.syncCloudData();
    } catch (e) {}
    setResources(DataService.getResources());
    setBookings(DataService.getBookings());
    setBlocks(DataService.getBlocks());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      DataService.syncCloudData().then(() => {
        setBookings(DataService.getBookings());
        setBlocks(DataService.getBlocks());
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [currentDate]);

  const handlePrev = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'weekly') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectSlotWeek = (dateStr: string, periodId: string) => {
    setBookingToEdit(null);
    setSelectedSlot({ date: dateStr, periodId, resourceId: resources[0]?.id });
    setIsBookingOpen(true);
  };

  const handleSelectSlotDaily = (resourceId: string, periodId: string) => {
    setBookingToEdit(null);
    setSelectedSlot({ date: selectedDateStr, periodId, resourceId });
    setIsBookingOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsBookingOpen(true);
  };

  return (
    <div className="space-y-3.5 font-sans">
      {/* Top Controls Header Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {viewMode === 'weekly' ? 'Agenda Semanal' : `Agenda Diária (${format(currentDate, 'dd/MM/yyyy')})`}
          </h1>
        </div>

        {/* View Mode & Date Navigation Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Semanal / Diário */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Semanal</span>
            </button>

            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'daily'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Diário</span>
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center bg-indigo-600 text-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-indigo-700 transition-colors border-r border-indigo-500/50"
              title="Anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2.5 py-1.5 text-xs font-bold font-mono">
              {viewMode === 'weekly' ? weekRangeText : format(currentDate, 'dd/MM/yyyy')}
            </span>

            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-indigo-700 transition-colors border-l border-indigo-500/50"
              title="Próximo"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              setBookingToEdit(null);
              setSelectedSlot({ date: selectedDateStr });
              setIsBookingOpen(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Reserva</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setIsBlockOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all border border-slate-200"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Bloquear</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-slate-600">Sincronizando agenda com a nuvem CEPR...</p>
        </div>
      ) : viewMode === 'weekly' ? (
        <WeekCalendarGrid
          weekDays={weekDays}
          bookings={bookings}
          blocks={blocks}
          resources={resources}
          onSelectSlot={handleSelectSlotWeek}
          onEditBooking={handleEditBooking}
          onRefresh={fetchData}
        />
      ) : (
        <CalendarGrid
          resources={resources}
          bookings={bookings}
          blocks={blocks}
          selectedDate={selectedDateStr}
          onSelectSlot={handleSelectSlotDaily}
          selectedShift="all"
          onRefresh={fetchData}
        />
      )}

      {/* Modals */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setBookingToEdit(null);
        }}
        onSuccess={fetchData}
        resources={resources}
        initialResourceId={selectedSlot.resourceId}
        initialPeriodId={selectedSlot.periodId}
        initialDate={selectedSlot.date || selectedDateStr}
        bookingToEdit={bookingToEdit}
      />

      <BlockModal
        isOpen={isBlockOpen}
        onClose={() => setIsBlockOpen(false)}
        onSuccess={fetchData}
        resources={resources}
        initialDate={selectedDateStr}
      />
    </div>
  );
}
