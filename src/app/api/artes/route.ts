import { NextRequest, NextResponse } from 'next/server';
import { gerarPromptArte, gerarVariacoesArte } from '@/lib/ai/images';
import type { Cliente, Produto, FormatoArte } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produto, formato, objetivo }: {
      cliente: Cliente;
      produto: Produto | null;
      formato: FormatoArte;
      objetivo: string;
    } = await req.json();

    // 1. Claude gera o prompt ideal para a marca
    const prompt = await gerarPromptArte(cliente, produto, formato, objetivo);

    // 2. FLUX gera 3 variações de imagem
    const imageUrls = await gerarVariacoesArte(prompt, formato);

    return NextResponse.json({ prompt, imageUrls });
  } catch (err) {
    console.error('Erro ao gerar arte:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao gerar arte' },
      { status: 500 }
    );
  }
}
