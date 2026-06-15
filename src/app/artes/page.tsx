'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Download, Layers, Type, Palette,
  ChevronLeft, Check, Loader2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Bold, Trash2, Plus,
} from 'lucide-react';
import { Card, LoadingSpinner, EmptyState, Select } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos, getArtes, salvarArte, salvarNaBiblioteca } from '@/lib/firebase/db';
import { uploadReferenciaArte } from '@/lib/firebase/storage';
import { DIMENSOES_ARTE } from '@/lib/ai/images';
import type { Produto, Arte, FormatoArte, ReferenciaArte, TipoReferenciaArte } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ─── TIPOS DO EDITOR ──────────────────────────────────────────────────────────

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  align: 'left' | 'center' | 'right';
  width: number;
}

const FORMATOS: { key: FormatoArte; label: string; desc: string; icon: string }[] = [
  { key: 'feed_retrato',  label: 'Feed Retrato',  desc: '1080 × 1350', icon: '📸' },
  { key: 'feed_quadrado', label: 'Feed Quadrado', desc: '1080 × 1080', icon: '⬛' },
  { key: 'story',         label: 'Story / Reels', desc: '1080 × 1920', icon: '📱' },
  { key: 'banner',        label: 'Banner',        desc: '1200 × 628',  icon: '🖼' },
];

const OBJETIVOS = [
  'Divulgação de produto',
  'Promoção / Desconto',
  'Lançamento',
  'Datas comemorativas',
  'Institucional / Marca',
  'Depoimento de cliente',
  'Dica / Conteúdo educativo',
];

const TIPOS_REFERENCIA: { key: TipoReferenciaArte; label: string }[] = [
  { key: 'produto', label: 'Produto' },
  { key: 'estilo', label: 'Estilo visual' },
  { key: 'paleta', label: 'Paleta/identidade' },
  { key: 'composicao', label: 'Composição' },
  { key: 'inspiracao', label: 'Inspiração geral' },
];

const ESTILOS_TEXTO = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'premium', label: 'Premium' },
  { value: 'promocional', label: 'Promocional' },
  { value: 'direto', label: 'Direto' },
  { value: 'educativo', label: 'Educativo' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'divertido', label: 'Divertido' },
];

// Escala visual do canvas no editor (para caber na tela)
function escalaCanvas(formato: FormatoArte): { w: number; h: number; scale: number } {
  const dim = DIMENSOES_ARTE[formato];
  const maxH = 480;
  const maxW = 380;
  const scale = Math.min(maxW / dim.width, maxH / dim.height);
  return { w: Math.round(dim.width * scale), h: Math.round(dim.height * scale), scale };
}

export default function ArtesPage() {
  const { clienteAtivo } = useAppStore();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [artesSalvas, setArtesSalvas] = useState<Arte[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState<'config' | 'gerando' | 'editor'>('config');
  const [formato, setFormato] = useState<FormatoArte>('feed_retrato');
  const [produtoId, setProdutoId] = useState('');
  const [objetivo, setObjetivo] = useState(OBJETIVOS[0]);
  const [promptCustom, setPromptCustom] = useState('');
  const [referencias, setReferencias] = useState<ReferenciaArte[]>([]);
  const [referenciaFiles, setReferenciaFiles] = useState<Record<string, File>>({});
  const [estiloTexto, setEstiloTexto] = useState('profissional');
  const [referenciaTexto, setReferenciaTexto] = useState('');
  const [evitarTexto, setEvitarTexto] = useState('');

  // Geração
  const [promptGerado, setPromptGerado] = useState('');
  const [variacoes, setVariacoes] = useState<string[]>([]);
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(0);
  const [gerando, setGerando] = useState(false);

  // Editor
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [layerSelecionada, setLayerSelecionada] = useState<string | null>(null);
  const [overlayColor, setOverlayColor] = useState('#00000040');
  const [showOverlay, setShowOverlay] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const [ps, as] = await Promise.all([
        getProdutos(clienteAtivo!.id),
        getArtes(clienteAtivo!.id),
      ]);
      setProdutos(ps);
      setArtesSalvas(as);
      // Pré-preenche cores do cliente
      if (clienteAtivo!.coresPrincipais?.[0]) {
        // usa cor principal como overlay padrão com 40% opacidade
        const hex = clienteAtivo!.coresPrincipais[0];
        setOverlayColor(hex + '66');
      }
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  function adicionarReferencia(file: File) {
    if (referencias.length >= 4) {
      toast.error('Limite de 4 referências por arte.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.');
      return;
    }
    const id = crypto.randomUUID();
    setReferencias((prev) => [
      ...prev,
      {
        id,
        tipo: 'inspiracao',
        imageUrl: URL.createObjectURL(file),
        seguir: '',
        evitar: '',
      },
    ]);
    setReferenciaFiles((prev) => ({ ...prev, [id]: file }));
  }

  function atualizarReferencia(id: string, changes: Partial<ReferenciaArte>) {
    setReferencias((prev) => prev.map((ref) => ref.id === id ? { ...ref, ...changes } : ref));
  }

  function removerReferencia(id: string) {
    setReferencias((prev) => prev.filter((ref) => ref.id !== id));
    setReferenciaFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  // ─── GERAÇÃO DE IMAGEM ───────────────────────────────────────────────────────

  async function gerarArte() {
    if (!clienteAtivo) return;
    setGerando(true);
    setStep('gerando');
    try {
      const produto = produtos.find((p) => p.id === produtoId) ?? null;
      const referenciasEnviadas = await Promise.all(
        referencias.map(async (ref) => {
          const file = referenciaFiles[ref.id];
          if (!file) return ref;
          const imageUrl = await uploadReferenciaArte(clienteAtivo.id, file);
          return { ...ref, imageUrl };
        })
      );
      const res = await fetch('/api/artes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: clienteAtivo,
          produto,
          formato,
          objetivo,
          promptCustom: promptCustom || undefined,
          referencias: referenciasEnviadas,
          estiloTexto,
          referenciaTexto: referenciaTexto || undefined,
          evitarTexto: evitarTexto || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPromptGerado(data.prompt);
      setVariacoes(data.imageUrls);
      setVariacaoSelecionada(0);
      const textos = data.textos ?? {};

      // Cria layers editaveis com textos profissionais gerados pela IA.
      setLayers([
        {
          id: crypto.randomUUID(),
          text: textos.titulo ?? clienteAtivo.nome,
          x: 20, y: 24,
          fontSize: 34, fontWeight: 'bold',
          color: '#FFFFFF',
          align: 'left',
          width: 340,
        },
        {
          id: crypto.randomUUID(),
          text: textos.subtitulo ?? (produto?.nome ?? objetivo),
          x: 20, y: 76,
          fontSize: 18, fontWeight: 'normal',
          color: '#FFFFFF',
          align: 'left',
          width: 330,
        },
        {
          id: crypto.randomUUID(),
          text: textos.cta ?? 'Saiba mais',
          x: 20, y: 122,
          fontSize: 16, fontWeight: 'bold',
          color: clienteAtivo.coresPrincipais[0] ?? '#FFFFFF',
          align: 'left',
          width: 220,
        },
      ]);
      setStep('editor');
      toast.success('Arte gerada com textos profissionais.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar arte.');
      setStep('config');
    } finally {
      setGerando(false);
    }
  }

  // ─── EXPORT / SALVAR ─────────────────────────────────────────────────────────

  async function exportarArte() {
    const canvas = canvasRef.current;
    if (!canvas || !clienteAtivo) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `arte-${clienteAtivo.nome}-${formato}.png`;
    a.click();
    toast.success('Arte baixada!');
  }

  async function salvarNaBibliotecaHandler() {
    if (!clienteAtivo || !variacoes[variacaoSelecionada]) return;
    await salvarArte({
      clienteId: clienteAtivo.id,
      produtoId: produtoId || undefined,
      formato,
      objetivo,
      promptUsado: promptGerado,
      imageUrl: variacoes[variacaoSelecionada],
      largura: DIMENSOES_ARTE[formato].width,
      altura: DIMENSOES_ARTE[formato].height,
      geradoEm: new Date().toISOString(),
    });
    await salvarNaBiblioteca({
      clienteId: clienteAtivo.id,
      tipo: 'arte',
      titulo: `Arte ${DIMENSOES_ARTE[formato].label} — ${objetivo}`,
      conteudo: promptGerado,
      fileUrl: variacoes[variacaoSelecionada],
      produtoId: produtoId || undefined,
      tags: [formato, objetivo],
      criadoEm: new Date().toISOString(),
    });
    setArtesSalvas((prev) => [
      {
        id: crypto.randomUUID(),
        clienteId: clienteAtivo.id,
        produtoId: produtoId || undefined,
        formato,
        objetivo,
        promptUsado: promptGerado,
        imageUrl: variacoes[variacaoSelecionada],
        largura: DIMENSOES_ARTE[formato].width,
        altura: DIMENSOES_ARTE[formato].height,
        geradoEm: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast.success('Salvo na biblioteca!');
  }

  // ─── LAYER HELPERS ────────────────────────────────────────────────────────────

  function addLayer() {
    const nova: TextLayer = {
      id: crypto.randomUUID(),
      text: 'Novo texto',
      x: 20, y: 120,
      fontSize: 16, fontWeight: 'normal',
      color: '#FFFFFF',
      align: 'left',
      width: 280,
    };
    setLayers((prev) => [...prev, nova]);
    setLayerSelecionada(nova.id);
  }

  function updateLayer(id: string, changes: Partial<TextLayer>) {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, ...changes } : l));
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (layerSelecionada === id) setLayerSelecionada(null);
  }

  const layerAtiva = layers.find((l) => l.id === layerSelecionada) ?? null;
  const { w: cW, h: cH } = escalaCanvas(formato);

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* ── STEP: CONFIG ── */}
      {step === 'config' && (
        <>
          <div className="grid grid-cols-2 gap-6">
            {/* Configuração */}
            <Card>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Configurar arte
              </p>
              <div className="space-y-4">
                {/* Formato */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Formato</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FORMATOS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFormato(f.key)}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                          formato === f.key
                            ? 'border-brand-400 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg">{f.icon}</span>
                        <div>
                          <p className="text-xs font-medium">{f.label}</p>
                          <p className="text-xs text-gray-400">{f.desc}</p>
                        </div>
                        {formato === f.key && (
                          <Check size={14} className="ml-auto text-brand-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Produto */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Produto (opcional)
                  </label>
                  <select
                    value={produtoId}
                    onChange={(e) => setProdutoId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    <option value="">Institucional (sem produto)</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Objetivo */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Objetivo da arte
                  </label>
                  <select
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  >
                    {OBJETIVOS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                {/* Prompt customizado */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Direção visual (opcional)
                  </label>
                  <textarea
                    value={promptCustom}
                    onChange={(e) => setPromptCustom(e.target.value)}
                    rows={2}
                    placeholder="Ex: fundo branco clean, produto centralizado, luz natural..."
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="mb-3 text-sm font-medium text-gray-700">Texto da arte</p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Estilo de escrita</label>
                      <select
                        value={estiloTexto}
                        onChange={(e) => setEstiloTexto(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                      >
                        {ESTILOS_TEXTO.map((estilo) => (
                          <option key={estilo.value} value={estilo.value}>{estilo.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Referencia de escrita
                      </label>
                      <textarea
                        value={referenciaTexto}
                        onChange={(e) => setReferenciaTexto(e.target.value)}
                        rows={2}
                        placeholder="Ex: chamada curta, objetiva, com tom de especialista..."
                        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        O que evitar no texto
                      </label>
                      <input
                        value={evitarTexto}
                        onChange={(e) => setEvitarTexto(e.target.value)}
                        placeholder="Ex: promessas exageradas, texto longo, girias..."
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Referências visuais</p>
                    <span className="text-xs text-gray-400">{referencias.length}/4</span>
                  </div>

                  <div className="space-y-3">
                    {referencias.map((ref) => (
                      <div key={ref.id} className="rounded-xl border border-gray-200 p-3">
                        <div className="mb-3 flex gap-3">
                          <img
                            src={ref.imageUrl}
                            alt="Referência visual"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <select
                              value={ref.tipo}
                              onChange={(e) => atualizarReferencia(ref.id, { tipo: e.target.value as TipoReferenciaArte })}
                              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-brand-600 focus:outline-none"
                            >
                              {TIPOS_REFERENCIA.map((tipo) => (
                                <option key={tipo.key} value={tipo.key}>{tipo.label}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removerReferencia(ref.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remover referência
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={ref.seguir}
                            onChange={(e) => atualizarReferencia(ref.id, { seguir: e.target.value })}
                            placeholder="O que seguir?"
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-brand-600 focus:outline-none"
                          />
                          <input
                            value={ref.evitar}
                            onChange={(e) => atualizarReferencia(ref.id, { evitar: e.target.value })}
                            placeholder="O que evitar copiar?"
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-brand-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}

                    {referencias.length < 4 && (
                      <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500 hover:border-brand-300 hover:text-brand-600">
                        <Plus size={14} className="mr-2" />
                        Adicionar imagem de referência
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) adicionarReferencia(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={gerarArte}
                  loading={gerando}
                >
                  <Sparkles size={14} />
                  Gerar 3 variações com IA
                </Button>
              </div>
            </Card>

            {/* Preview de cores + artes salvas */}
            <div className="space-y-4">
              <Card>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Identidade visual
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Cores principais</p>
                    <div className="flex gap-2">
                      {clienteAtivo.coresPrincipais.map((c, i) => (
                        <div
                          key={i}
                          className="h-7 w-7 rounded-lg border border-gray-200"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                      {clienteAtivo.coresPrincipais.length === 0 && (
                        <p className="text-xs text-gray-400">Não definidas</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-500">Cores secundárias</p>
                    <div className="flex gap-2">
                      {clienteAtivo.coresSecundarias.map((c, i) => (
                        <div
                          key={i}
                          className="h-7 w-7 rounded-lg border border-gray-200"
                          style={{ background: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                  {clienteAtivo.logoUrl && (
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Logo</p>
                      <img
                        src={clienteAtivo.logoUrl}
                        alt="Logo"
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {artesSalvas.length > 0 && (
                <Card>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Artes anteriores
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {artesSalvas.slice(0, 6).map((a) => (
                      <div key={a.id} className="overflow-hidden rounded-lg border border-gray-100">
                        <img
                          src={a.imageUrl}
                          alt={a.objetivo}
                          className="aspect-square w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── STEP: GERANDO ── */}
      {step === 'gerando' && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
            <Loader2 size={28} className="animate-spin text-brand-600" />
          </div>
          <p className="font-semibold text-gray-800">Gerando arte com IA...</p>
          <div className="space-y-1 text-center">
            <p className="text-sm text-gray-500">1. Claude analisa a marca e cria o prompt visual</p>
            <p className="text-sm text-gray-500">2. FLUX gera 3 variações de imagem</p>
            <p className="text-sm text-gray-400 text-xs">Pode levar até 30 segundos</p>
          </div>
        </div>
      )}

      {/* ── STEP: EDITOR ── */}
      {step === 'editor' && (
        <div className="space-y-4">
          {/* Barra topo do editor */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('config')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft size={15} />
              Nova arte
            </button>
            <div className="flex-1" />
            <Button size="sm" variant="secondary" onClick={salvarNaBibliotecaHandler}>
              Salvar na biblioteca
            </Button>
            <Button size="sm" variant="primary" onClick={exportarArte}>
              <Download size={13} />
              Baixar PNG
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Canvas / Preview */}
            <div className="col-span-2 space-y-3">
              {/* Seleção de variações */}
              <div className="flex gap-3">
                {variacoes.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setVariacaoSelecionada(i)}
                    className={`overflow-hidden rounded-xl border-2 transition-all ${
                      variacaoSelecionada === i
                        ? 'border-brand-500 shadow-md'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                    style={{ width: 80, height: 80 }}
                  >
                    <img src={url} alt={`Variação ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={gerarArte}
                  className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
                >
                  <Sparkles size={16} />
                  <span className="mt-1 text-xs">Novo</span>
                </button>
              </div>

              {/* Canvas com overlay e textos */}
              <Card className="p-2 flex items-center justify-center bg-gray-100">
                <div
                  className="relative overflow-hidden rounded-lg shadow-lg"
                  style={{ width: cW, height: cH }}
                >
                  {/* Imagem base */}
                  {variacoes[variacaoSelecionada] && (
                    <img
                      src={variacoes[variacaoSelecionada]}
                      alt="Arte gerada"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}

                  {/* Overlay de cor */}
                  {showOverlay && (
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: overlayColor }}
                    />
                  )}

                  {/* Layers de texto */}
                  {layers.map((layer) => {
                    const { scale } = escalaCanvas(formato);
                    return (
                      <div
                        key={layer.id}
                        className={`absolute cursor-pointer select-none ${
                          layerSelecionada === layer.id
                            ? 'ring-2 ring-brand-400 ring-offset-1'
                            : ''
                        }`}
                        style={{
                          left: layer.x * scale,
                          top: layer.y * scale,
                          width: layer.width * scale,
                          fontSize: layer.fontSize * scale,
                          fontWeight: layer.fontWeight,
                          color: layer.color,
                          textAlign: layer.align,
                          lineHeight: 1.3,
                          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                        onClick={() => setLayerSelecionada(layer.id)}
                      >
                        {layer.text}
                      </div>
                    );
                  })}

                  {/* Canvas oculto para export */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </Card>

              {/* Prompt usado */}
              {promptGerado && (
                <details className="rounded-lg border border-gray-100 p-3">
                  <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                    Ver prompt usado pela IA
                  </summary>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">{promptGerado}</p>
                </details>
              )}
            </div>

            {/* Painel de edição */}
            <div className="space-y-3">
              {/* Overlay */}
              <Card>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Overlay de cor
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showOverlay}
                    onChange={(e) => setShowOverlay(e.target.checked)}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-600">Ativar overlay</label>
                  {showOverlay && (
                    <input
                      type="color"
                      value={overlayColor.slice(0, 7)}
                      onChange={(e) => setOverlayColor(e.target.value + overlayColor.slice(7))}
                      className="h-8 w-10 cursor-pointer rounded border border-gray-200"
                    />
                  )}
                </div>
              </Card>

              {/* Layers de texto */}
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Textos
                  </p>
                  <button
                    onClick={addLayer}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                  >
                    <Plus size={12} />
                    Adicionar
                  </button>
                </div>

                <div className="mb-3 space-y-1">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                        layerSelecionada === layer.id
                          ? 'border-brand-300 bg-brand-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                      onClick={() => setLayerSelecionada(layer.id)}
                    >
                      <Type size={12} className="text-gray-400 flex-shrink-0" />
                      <p className="flex-1 truncate text-xs">{layer.text}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                        className="text-gray-300 hover:text-red-400"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Propriedades da layer selecionada */}
                {layerAtiva && (
                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <textarea
                      value={layerAtiva.text}
                      onChange={(e) => updateLayer(layerAtiva.id, { text: e.target.value })}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-600 focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Tamanho</label>
                        <input
                          type="number"
                          value={layerAtiva.fontSize}
                          onChange={(e) => updateLayer(layerAtiva.id, { fontSize: Number(e.target.value) })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-600 focus:outline-none"
                          min={8} max={120}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Cor</label>
                        <input
                          type="color"
                          value={layerAtiva.color}
                          onChange={(e) => updateLayer(layerAtiva.id, { color: e.target.value })}
                          className="h-8 w-full cursor-pointer rounded border border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => updateLayer(layerAtiva.id, { fontWeight: layerAtiva.fontWeight === 'bold' ? 'normal' : 'bold' })}
                        className={`flex h-7 w-7 items-center justify-center rounded border text-xs transition-colors ${
                          layerAtiva.fontWeight === 'bold'
                            ? 'border-brand-400 bg-brand-50 text-brand-600'
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        <Bold size={12} />
                      </button>
                      {(['left', 'center', 'right'] as const).map((a) => {
                        const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
                        return (
                          <button
                            key={a}
                            onClick={() => updateLayer(layerAtiva.id, { align: a })}
                            className={`flex h-7 w-7 items-center justify-center rounded border text-xs transition-colors ${
                              layerAtiva.align === a
                                ? 'border-brand-400 bg-brand-50 text-brand-600'
                                : 'border-gray-200 text-gray-500'
                            }`}
                          >
                            <Icon size={12} />
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Posição X</label>
                        <input
                          type="number"
                          value={layerAtiva.x}
                          onChange={(e) => updateLayer(layerAtiva.id, { x: Number(e.target.value) })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Posição Y</label>
                        <input
                          type="number"
                          value={layerAtiva.y}
                          onChange={(e) => updateLayer(layerAtiva.id, { y: Number(e.target.value) })}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-brand-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Atalhos de cores da marca */}
                    <div>
                      <p className="mb-1 text-xs text-gray-400">Cores da marca</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {[...clienteAtivo.coresPrincipais, ...clienteAtivo.coresSecundarias, '#FFFFFF', '#000000'].map((c, i) => (
                          <button
                            key={i}
                            onClick={() => updateLayer(layerAtiva.id, { color: c })}
                            className="h-5 w-5 rounded border border-gray-200"
                            style={{ background: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
