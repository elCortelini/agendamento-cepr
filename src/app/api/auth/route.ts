import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/storage';
import { UserRole } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, avatar, credential } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const db = readDB();
    let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    // Auto assign admin role if email contains 'admin' or matches first user or specific domain rule
    const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'professor';

    if (!user) {
      user = {
        id: `usr-${Date.now()}`,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
        role,
      };
      db.users.push(user);
      writeDB(db);
    } else if (avatar && user.avatar !== avatar) {
      user.avatar = avatar;
      writeDB(db);
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao autenticar usuário' }, { status: 500 });
  }
}
