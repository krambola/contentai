import OpenAI from 'openai';
import type { Cliente, Produto, FormatoArte, ReferenciaArte } from '@/types';

// ─── DIMENSÕES POR FORMATO ───────────────────────────────────────────────────

export const DIMENSOES_ARTE: Record<FormatoArte, { width: number; height: number; label: string }> = {
  feed_retrato:  { width: 1080, height: 1350, label: 'Feed 1080×1350' },
  feed_quadrado: { width: 1080, height: 1080, label: 'Feed 1080×1080' },
  story:         { width: 1080, height: 1920, label: 'Story 1080×1920' },
  banner:        { width: 1200, height: 628,  label: 'Banner Promocional' },
};

// DALL-E 3 suporta apenas esses tamanhos:
// 1024x1024, 1792x1024, 1024x1792
// Mapeamos cada formato para o mais próximo
const IMAGE_SIZE: Record<FormatoArte, '1024x1024' | '1536x1024' | '1024x1536'> = {
  feed_retrato:  '1024x1536', // vertical
  feed_quadrado: '1024x1024', // quadrado
  story:         '1024x1536', // vertical
  banner:        '1536x1024', // horizontal
};

function getOpenAIErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof maybeError.message === 'string') return maybeError.message;
    if (typeof maybeError.error?.message === 'string') return maybeError.error.message;
  }
  return 'Erro desconhecido da OpenAI.';
}

// ─── GERADOR DE PROMPT VIA GPT ───────────────────────────────────────────────

export async function gerarPromptArte(
  cliente: Cliente,
  produto: Produto | null,
  formato: FormatoArte,
  objetivo: string,
  promptCustom = '',
  referencias: ReferenciaArte[] = []
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const dim = DIMENSOES_ARTE[formato];
  const coresPrincipais = cliente.coresPrincipais.slice(0, 3).join(', ') || 'neutral elegant colors';
  const coresSecundarias = cliente.coresSecundarias.slice(0, 2).join(', ') || '';
  const referenciasTexto = referencias.length > 0
    ? referencias.map((ref, index) => (
        `Reference ${index + 1} (${ref.tipo}): follow "${ref.seguir || 'the relevant visual qualities'}"; avoid "${ref.evitar || 'direct copying'}".`
      )).join('\n')
    : 'No reference images provided.';
  const promptTexto = `Create an image generation prompt for a professional social media advertising photo.

BRAND: ${cliente.nome}
Segment: ${cliente.segmento}
Brand colors: ${coresPrincipais}${coresSecundarias ? `, ${coresSecundarias}` : ''}
${produto ? `PRODUCT: ${produto.nome} - ${produto.descricao}` : 'Brand institutional content'}
${produto?.fotoUrls?.length ? `Product photo URLs for context: ${produto.fotoUrls.slice(0, 5).join(', ')}` : ''}
GOAL: ${objetivo}
FORMAT: ${dim.label}
VISUAL DIRECTION: ${promptCustom || 'Use the brand identity and campaign goal.'}
REFERENCES:
${referenciasTexto}

Rules:
- Describe visual composition, lighting, photographic style
- Reference brand colors naturally in the scene
- Product should look appetizing/attractive if present
- Use references as inspiration only; do not copy layouts or protected artwork directly
- Style: advertising photography, commercial, professional, high-end
- No text or words in the image
- Max 120 words

Return ONLY the English prompt.`;
  const userContent = referencias.length > 0
    ? [
        { type: 'text' as const, text: promptTexto },
        ...referencias.map((ref) => ({
          type: 'image_url' as const,
          image_url: { url: ref.imageUrl },
        })),
      ]
    : promptTexto;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: 'You are an expert at writing image generation prompts for advertising photography. Return only the prompt, no explanations.',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  return res.choices[0]?.message?.content?.trim() ?? '';
}
// --- GERAÇÃO DE IMAGENS VIA DALL-E 3 ─────────────────────────────────────────
// DALL-E 3 gera 1 imagem por chamada, então fazemos 3 chamadas em paralelo

export async function gerarVariacoesArte(
  prompt: string,
  formato: FormatoArte
): Promise<string[]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const size = IMAGE_SIZE[formato];

  // 3 variações em paralelo com seeds diferentes via style variation
  const seeds = [
    prompt,
    `${prompt}, alternative composition`,
    `${prompt}, different angle`,
  ];

  const resultados = await Promise.allSettled(
    seeds.map((p) =>
      client.images.generate({
        model: 'gpt-image-1',
        prompt: `${p}. No text, no words, no watermarks in the image.`,
        size,
        quality: 'medium',
        n: 1,
      })
    )
  );

  const urls: string[] = [];
  const erros: string[] = [];
  for (const r of resultados) {
    const imageUrl = r.status === 'fulfilled' ? r.value.data?.[0]?.url : undefined;
    const imageB64 = r.status === 'fulfilled' ? r.value.data?.[0]?.b64_json : undefined;
    if (imageUrl) {
      urls.push(imageUrl);
    } else if (imageB64) {
      urls.push(`data:image/png;base64,${imageB64}`);
    } else if (r.status === 'rejected') {
      erros.push(getOpenAIErrorMessage(r.reason));
    }
  }

  if (urls.length === 0) {
    const detalhe = erros[0] ? ` Detalhe: ${erros[0]}` : '';
    throw new Error(`Nenhuma imagem foi gerada pela OpenAI.${detalhe}`);
  }

  return urls;
}
