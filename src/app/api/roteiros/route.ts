import { NextRequest, NextResponse } from 'next/server';
import { gerarRoteiro } from '@/lib/ai/openai';
import { salvarRoteiro } from '@/lib/firebase/db';
import type { Cliente, Produto, FormatoRoteiro, DuracaoRoteiro } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produto, formato, duracao }: {
      cliente: Cliente;
      produto: Produto | null;
      formato: FormatoRoteiro;
      duracao: DuracaoRoteiro;
    } = await req.json();

    const roteiro = await gerarRoteiro(cliente, produto, formato, duracao);
    const id = await salvarRoteiro({ ...roteiro, geradoEm: new Date().toISOString() });
    return NextResponse.json({ ...roteiro, id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao gerar roteiro' }, { status: 500 });
  }
}
