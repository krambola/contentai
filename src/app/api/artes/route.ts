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
    const referenciasProduto: ReferenciaArte[] = (produto?.fotoUrls ?? []).slice(0, 5).map((imageUrl, index) => ({
      id: `produto-${index}`,
      tipo: 'produto',
      imageUrl,
      seguir: 'preserve the real product shape, color, packaging, texture, and proportions',
      evitar: 'do not replace it with another product or invent different packaging',
    }));
    const referenciasFinais = [...referenciasProduto, ...(referencias ?? [])].slice(0, 8);

    const prompt = await gerarPromptArte(
      cliente,
      produto,
      formato,
      objetivo,
      promptCustom,
      referenciasFinais
    );

    // 2. FLUX gera 3 variações de imagem
    const imageUrls = await gerarVariacoesArte(prompt, formato, referenciasFinais);

    return NextResponse.json({ prompt, imageUrls });
  } catch (err) {
    console.error('Erro ao gerar arte:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao gerar arte' },
      { status: 500 }
    );
  }
}
