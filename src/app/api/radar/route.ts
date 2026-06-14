import { NextRequest, NextResponse } from 'next/server';
import { gerarAlertas } from '@/lib/ai/openai';
import { salvarAlertas } from '@/lib/firebase/db';
import type { Cliente, Produto } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produtos }: { cliente: Cliente; produtos: Produto[] } = await req.json();
    const alertas = await gerarAlertas(cliente, produtos);
    await salvarAlertas(alertas.map((a) => ({ ...a, geradoEm: new Date().toISOString() })));
    return NextResponse.json({ alertas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao gerar alertas' }, { status: 500 });
  }
}
