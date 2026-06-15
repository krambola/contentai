import { NextRequest, NextResponse } from 'next/server';
import { gerarPromptArte, gerarVariacoesArte } from '@/lib/ai/images';
import type { Cliente, Produto, FormatoArte, ReferenciaArte } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cliente, produto, formato, objetivo, promptCustom, referencias }: {
      cliente: Cliente;
      produto: Produto | null;
      formato: FormatoArte;
      objetivo: string;
      promptCustom?: string;
      referencias?: ReferenciaArte[];
    } = await req.json();

    const prompt = await gerarPromptArte(
      cliente,
      produto,
      formato,
      objetivo,
      promptCustom,
      referencias ?? []
    );

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
