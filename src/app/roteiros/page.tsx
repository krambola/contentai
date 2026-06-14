'use client';

import { useEffect, useState } from 'react';
import { Video, Sparkles, BookmarkPlus, Copy } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState, Select } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos, getRoteiros } from '@/lib/firebase/db';
import type { Produto, Roteiro, FormatoRoteiro, DuracaoRoteiro } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatarData } from '@/lib/utils';

export default function RoteirosPage() {
  const { clienteAtivo } = useAppStore();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [roteiroAtual, setRoteiroAtual] = useState<Roteiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  const [formato, setFormato] = useState<FormatoRoteiro>('reel');
  const [duracao, setDuracao] = useState<DuracaoRoteiro>(30);
  const [produtoId, setProdutoId] = useState<string>('');

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const [ps, rs] = await Promise.all([
        getProdutos(clienteAtivo!.id),
        getRoteiros(clienteAtivo!.id),
      ]);
      setProdutos(ps);
      setRoteiros(rs);
      if (rs.length > 0) setRoteiroAtual(rs[0]);
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  async function gerar() {
    if (!clienteAtivo) return;
    setGerando(true);
    try {
      const produto = produtos.find((p) => p.id === produtoId) ?? null;
      const res = await fetch('/api/roteiros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteAtivo, produto, formato, duracao }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRoteiroAtual(data);
      setRoteiros((prev) => [data, ...prev]);
      toast.success('Roteiro gerado!');
    } catch {
      toast.error('Erro ao gerar roteiro.');
    } finally {
      setGerando(false);
    }
  }

  function copiarRoteiro(r: Roteiro) {
    const texto = `GANCHO:\n${r.gancho}\n\nDESENVOLVIMENTO:\n${r.desenvolvimento}\n\nCTA:\n${r.cta}`;
    navigator.clipboard.writeText(texto);
    toast.success('Roteiro copiado!');
  }

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Video}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Painel esquerdo: configuração */}
      <div className="space-y-4">
        <Card>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Configurar roteiro
          </p>
          <div className="space-y-3">
            <Select
              label="Formato"
              value={formato}
              onChange={(e) => setFormato(e.target.value as FormatoRoteiro)}
              options={[
                { value: 'reel', label: 'Reel' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'stories', label: 'Stories' },
                { value: 'institucional', label: 'Vídeo institucional' },
              ]}
            />
            <Select
              label="Duração"
              value={String(duracao)}
              onChange={(e) => setDuracao(Number(e.target.value) as DuracaoRoteiro)}
              options={[
                { value: '15', label: '15 segundos' },
                { value: '30', label: '30 segundos' },
                { value: '60', label: '60 segundos' },
              ]}
            />
            <Select
              label="Produto (opcional)"
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              options={[
                { value: '', label: 'Institucional (sem produto)' },
                ...produtos.map((p) => ({ value: p.id, label: p.nome })),
              ]}
            />
            <Button
              variant="primary"
              className="w-full"
              onClick={gerar}
              loading={gerando}
            >
              <Sparkles size={14} />
              Gerar roteiro
            </Button>
          </div>
        </Card>

        {/* Histórico */}
        {roteiros.length > 0 && (
          <Card>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Histórico
            </p>
            <div className="space-y-2">
              {roteiros.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoteiroAtual(r)}
                  className={`w-full rounded-lg p-2 text-left text-xs transition-colors ${
                    roteiroAtual?.id === r.id ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium capitalize">{r.formato} · {r.duracao}s</p>
                  <p className="text-gray-400">{formatarData(r.geradoEm)}</p>
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Painel direito: roteiro atual */}
      <div className="col-span-2">
        {gerando && <LoadingSpinner text="Criando roteiro... aguarde." />}

        {!gerando && !roteiroAtual && (
          <EmptyState
            icon={Video}
            title="Nenhum roteiro gerado"
            description="Configure o formato e clique em 'Gerar roteiro' para começar."
          />
        )}

        {!gerando && roteiroAtual && (
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 capitalize">
                  {roteiroAtual.formato}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {roteiroAtual.duracao}s
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => copiarRoteiro(roteiroAtual)}>
                  <Copy size={13} />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border-l-4 border-brand-600 bg-brand-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-600">
                  Gancho · 0–5s
                </p>
                <p className="text-sm leading-relaxed text-gray-800">{roteiroAtual.gancho}</p>
              </div>

              <div className="rounded-xl border-l-4 border-green-500 bg-green-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-green-700">
                  Desenvolvimento · 5–{roteiroAtual.duracao - 5}s
                </p>
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
                  {roteiroAtual.desenvolvimento}
                </p>
              </div>

              <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-700">
                  CTA · últimos 5s
                </p>
                <p className="text-sm leading-relaxed text-gray-800">{roteiroAtual.cta}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
