import { NextRequest, NextResponse } from 'next/server';
import { gerarCalendario } from '@/lib/ai/openai';
import { salvarItensCalendario } from '@/lib/firebase/db';
import type { Cliente, Produto } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produtos, mes, ano }: {
      cliente: Cliente;
      produtos: Produto[];
      mes: number;
      ano: number;
    } = await req.json();

    const itens = await gerarCalendario(cliente, produtos, mes, ano);
    await salvarItensCalendario(itens.map((item) => ({
      ...item,
      geradoEm: new Date().toISOString(),
    })));

    return NextResponse.json({ itens });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao gerar calendário' }, { status: 500 });
  }
}
