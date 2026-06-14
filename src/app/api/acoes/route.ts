import { NextRequest, NextResponse } from 'next/server';
import { gerarProximasAcoes } from '@/lib/ai/openai';
import type { Cliente, Produto } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produtos }: { cliente: Cliente; produtos: Produto[] } = await req.json();
    const acoes = await gerarProximasAcoes(cliente, produtos);
    return NextResponse.json({ acoes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao gerar ações' }, { status: 500 });
  }
}
