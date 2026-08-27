import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/storage';
import { Resource } from '@/lib/types';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ resources: db.resources });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, totalQuantity, description } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e Tipo do recurso são obrigatórios' }, { status: 400 });
    }

    const db = readDB();
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      name: name.trim(),
      type,
      totalQuantity: totalQuantity ? Math.max(1, Number(totalQuantity)) : 1,
      description: (description || '').trim(),
      active: true,
    };

    db.resources.push(newResource);
    writeDB(db);

    return NextResponse.json({ resource: newResource });
  } catch (error) {
    console.error('Error in POST /api/resources:', error);
    return NextResponse.json({ error: 'Erro interno ao criar recurso' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, type, totalQuantity, description, active } = body;

    const db = readDB();
    const index = db.resources.findIndex((r) => r.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Recurso não encontrado' }, { status: 404 });
    }

    db.resources[index] = {
      ...db.resources[index],
      name: name ? name.trim() : db.resources[index].name,
      type: type ?? db.resources[index].type,
      totalQuantity: totalQuantity ? Number(totalQuantity) : db.resources[index].totalQuantity,
      description: description !== undefined ? description.trim() : db.resources[index].description,
      active: active !== undefined ? active : db.resources[index].active,
    };

    writeDB(db);

    return NextResponse.json({ resource: db.resources[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar recurso' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do recurso é obrigatório' }, { status: 400 });
    }

    const db = readDB();
    db.resources = db.resources.filter((r) => r.id !== id);
    writeDB(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir recurso' }, { status: 500 });
  }
}
