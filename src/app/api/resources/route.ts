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

    if (!name || !type || !totalQuantity) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const db = readDB();
    const newResource: Resource = {
      id: `res-${Date.now()}`,
      name,
      type,
      totalQuantity: Number(totalQuantity),
      description: description || '',
      active: true,
    };

    db.resources.push(newResource);
    writeDB(db);

    return NextResponse.json({ resource: newResource });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar recurso' }, { status: 500 });
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
      name: name ?? db.resources[index].name,
      type: type ?? db.resources[index].type,
      totalQuantity: totalQuantity ? Number(totalQuantity) : db.resources[index].totalQuantity,
      description: description ?? db.resources[index].description,
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
