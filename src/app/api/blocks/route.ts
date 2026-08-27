import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/storage';
import { Block } from '@/lib/types';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ blocks: db.blocks });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resourceId, date, periodId, reason, createdBy } = body;

    if (!resourceId || !date || !periodId || !reason) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes para criar bloqueio.' }, { status: 400 });
    }

    const db = readDB();
    const resource = resourceId === 'all' ? null : db.resources.find((r) => r.id === resourceId);

    const newBlock: Block = {
      id: `blk-${Date.now()}`,
      resourceId,
      resourceName: resource ? resource.name : 'Todos os Recursos',
      date,
      periodId,
      reason,
      createdBy: createdBy || 'admin@gecps.edu.br',
      createdAt: new Date().toISOString(),
    };

    db.blocks.push(newBlock);
    writeDB(db);

    return NextResponse.json({ block: newBlock });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar bloqueio.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do bloqueio é obrigatório.' }, { status: 400 });
    }

    const db = readDB();
    db.blocks = db.blocks.filter((b) => b.id !== id);
    writeDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir bloqueio.' }, { status: 500 });
  }
}
