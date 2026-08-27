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

  const fetchData = () => {
    setLoading(true);
    try {
      setResources(DataService.getResources());
      setBookings(DataService.getBookings());
      setBlocks(DataService.getBlocks());
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    <div className="space-y-6 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda de Recursos</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Visualize e gerencie as reservas</p>
        </div>

        {/* View Switcher Toggle (Semanal vs Diário) */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1.5 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              viewMode === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Semanal</span>
          </button>

          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              viewMode === 'daily'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Diário</span>
          </button>
        </div>
      </div>

      {/* Main Content Card Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-black text-slate-900">
            {viewMode === 'weekly' ? 'Agenda Semanal' : `Agenda Diária (${format(currentDate, 'dd/MM/yyyy')})`}
          </h2>
        </div>

        {/* Date Navigation & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center bg-indigo-600 text-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-indigo-700 transition-colors border-r border-indigo-500/50"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-2 text-xs font-bold font-mono">
              {viewMode === 'weekly' ? weekRangeText : format(currentDate, 'dd/MM/yyyy')}
            </span>

            <button
              onClick={handleNext}
              className="p-2 hover:bg-indigo-700 transition-colors border-l border-indigo-500/50"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setBookingToEdit(null);
              setSelectedSlot({ date: selectedDateStr });
              setIsBookingOpen(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm ml-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Reserva</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setIsBlockOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-200"
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
          <p className="text-xs font-bold text-slate-600">Carregando horários da agenda CEPR...</p>
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
