import { NextRequest, NextResponse } from 'next/server';
import { gerarAnalise } from '@/lib/ai/openai';
import { salvarAnalise } from '@/lib/firebase/db';
import type { Cliente, Produto } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produtos }: { cliente: Cliente; produtos: Produto[] } = await req.json();
    const analise = await gerarAnalise(cliente, produtos);
    const id = await salvarAnalise({ ...analise, geradoEm: new Date().toISOString() });
    return NextResponse.json({ ...analise, id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao gerar análise' }, { status: 500 });
  }
}
