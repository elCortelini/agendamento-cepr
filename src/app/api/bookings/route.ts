import { NextResponse } from 'next/server';
import { readDB, writeDB, getResourceAvailability } from '@/lib/storage';
import { Booking, DEFAULT_PERIODS } from '@/lib/types';
import { addDays, parseISO, format } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const email = searchParams.get('email');

  const db = readDB();
  let bookings = db.bookings;

  if (date) {
    bookings = bookings.filter((b) => b.date === date);
  }

  if (email) {
    bookings = bookings.filter((b) => b.professorEmail.toLowerCase() === email.toLowerCase());
  }

  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      resourceId,
      date,
      periodId,
      quantity,
      professorName,
      professorEmail,
      turma,
      justification,
      isRecurring,
      recurrenceDays,
      recurrenceUntilDate,
    } = body;

    if (!resourceId || !date || !periodId || !quantity || !professorName || !professorEmail || !turma) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }

    const db = readDB();
    const resource = db.resources.find((r) => r.id === resourceId);
    if (!resource) {
      return NextResponse.json({ error: 'Recurso não encontrado.' }, { status: 404 });
    }

    const period = DEFAULT_PERIODS.find((p) => p.id === periodId);
    const periodName = period ? period.name : periodId;

    const requestedQty = Number(quantity);
    const datesToBook: string[] = [date];

    if (isRecurring && recurrenceUntilDate) {
      let curr = addDays(parseISO(date), recurrenceDays || 7);
      const until = parseISO(recurrenceUntilDate);
      while (curr <= until) {
        datesToBook.push(format(curr, 'yyyy-MM-dd'));
        curr = addDays(curr, recurrenceDays || 7);
      }
    }

    for (const d of datesToBook) {
      const avail = getResourceAvailability(resourceId, d, periodId);
      if (avail.isBlocked) {
        return NextResponse.json(
          { error: `O recurso está bloqueado na data ${d}: ${avail.blockReason || 'Bloqueio administrativo'}` },
          { status: 400 }
        );
      }
      if (avail.availableQuantity < requestedQty) {
        return NextResponse.json(
          {
            error: `Quantidade indisponível na data ${d}. Disponível: ${avail.availableQuantity}, Solicitado: ${requestedQty}`,
          },
          { status: 400 }
        );
      }
    }

    const newBookings: Booking[] = [];

    for (const d of datesToBook) {
      const newBooking: Booking = {
        id: `book-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        resourceId,
        resourceName: resource.name,
        date: d,
        periodId,
        periodName,
        quantity: requestedQty,
        professorName,
        professorEmail,
        turma,
        justification: justification || '',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      db.bookings.push(newBooking);
      newBookings.push(newBooking);
    }

    writeDB(db);

    return NextResponse.json({ bookings: newBookings, count: newBookings.length });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Erro ao processar reserva.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, wasUsed, status, adminNote } = body;

    const db = readDB();
    const index = db.bookings.findIndex((b) => b.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    }

    db.bookings[index] = {
      ...db.bookings[index],
      wasUsed: wasUsed !== undefined ? wasUsed : db.bookings[index].wasUsed,
      status: status ?? db.bookings[index].status,
      adminNote: adminNote ?? db.bookings[index].adminNote,
    };

    writeDB(db);

    return NextResponse.json({ booking: db.bookings[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar reserva.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userEmail = searchParams.get('userEmail');
    const userRole = searchParams.get('userRole');

    if (!id) {
      return NextResponse.json({ error: 'ID da reserva é obrigatório.' }, { status: 400 });
    }

    const db = readDB();
    const booking = db.bookings.find((b) => b.id === id);

    if (!booking) {
      return NextResponse.json({ error: 'Reserva não encontrada.' }, { status: 404 });
    }

    // Permission enforcement:
    // Admin can delete any booking
    // Professor can ONLY delete their own booking (matching email)
    if (userRole !== 'admin' && userEmail) {
      if (booking.professorEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return NextResponse.json(
          { error: 'Você não tem permissão para cancelar reservas de outros professores.' },
          { status: 403 }
        );
      }
    }

    // Remove permanently or set status to cancelled
    db.bookings = db.bookings.filter((b) => b.id !== id);
    writeDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir reserva.' }, { status: 500 });
  }
}
