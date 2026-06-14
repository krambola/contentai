import { NextRequest, NextResponse } from 'next/server';
import { gerarIdeias } from '@/lib/ai/openai';
import { salvarIdeias } from '@/lib/firebase/db';
import type { Cliente, Produto } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produto }: { cliente: Cliente; produto: Produto } = await req.json();
    const ideias = await gerarIdeias(cliente, produto);
    await salvarIdeias(ideias.map((i) => ({ ...i, geradoEm: new Date().toISOString() })));
    return NextResponse.json({ ideias });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao gerar ideias' }, { status: 500 });
  }
}
