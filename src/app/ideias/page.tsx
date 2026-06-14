'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Lightbulb, Sparkles, BookmarkPlus } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos, getIdeias, salvarNaBiblioteca } from '@/lib/firebase/db';
import type { Produto, Ideia, FormatoIdeia } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

const FORMATOS: { key: FormatoIdeia; label: string; emoji: string }[] = [
  { key: 'reel', label: 'Reels', emoji: '🎬' },
  { key: 'carrossel', label: 'Carrosséis', emoji: '📖' },
  { key: 'stories', label: 'Stories', emoji: '📱' },
  { key: 'campanha', label: 'Campanhas', emoji: '🏷' },
  { key: 'promocao', label: 'Promoções', emoji: '🎁' },
];

export default function IdeiasPage() {
  const { clienteAtivo } = useAppStore();
  const searchParams = useSearchParams();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [ideias, setIdeias] = useState<Ideia[]>([]);
  const [formatoAtivo, setFormatoAtivo] = useState<FormatoIdeia>('reel');
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const ps = await getProdutos(clienteAtivo!.id);
      setProdutos(ps);
      const produtoId = searchParams.get('produtoId');
      const inicial = ps.find((p) => p.id === produtoId) ?? ps[0] ?? null;
      setProdutoSelecionado(inicial);
      if (inicial) {
        const is = await getIdeias(clienteAtivo!.id, inicial.id);
        setIdeias(is);
      }
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  async function gerar() {
    if (!clienteAtivo || !produtoSelecionado) return;
    setGerando(true);
    try {
      const res = await fetch('/api/ideias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteAtivo, produto: produtoSelecionado }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeias(data.ideias);
      toast.success(`${data.ideias.length} ideias geradas!`);
    } catch {
      toast.error('Erro ao gerar ideias.');
    } finally {
      setGerando(false);
    }
  }

  async function salvarIdeia(ideia: Ideia) {
    if (!clienteAtivo) return;
    await salvarNaBiblioteca({
      clienteId: clienteAtivo.id,
      tipo: 'ideia',
      titulo: ideia.titulo,
      conteudo: ideia.descricao,
      produtoId: ideia.produtoId,
      tags: [ideia.formato],
      criadoEm: new Date().toISOString(),
    });
    toast.success('Salvo na biblioteca!');
  }

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner text="Carregando..." />;

  const ideiasDoFormato = ideias.filter((i) => i.formato === formatoAtivo);

  return (
    <div className="space-y-5">
      {/* Seleção de produto + botão */}
      <div className="flex items-center gap-3">
        <select
          value={produtoSelecionado?.id ?? ''}
          onChange={async (e) => {
            const p = produtos.find((x) => x.id === e.target.value) ?? null;
            setProdutoSelecionado(p);
            if (p && clienteAtivo) {
              const is = await getIdeias(clienteAtivo.id, p.id);
              setIdeias(is);
            }
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        >
          {produtos.length === 0 && <option value="">Nenhum produto cadastrado</option>}
          {produtos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <Button
          variant="primary"
          size="sm"
          onClick={gerar}
          loading={gerando}
          disabled={!produtoSelecionado}
        >
          <Sparkles size={13} />
          Gerar {ideias.length > 0 ? 'novas ' : ''}ideias
        </Button>
        {ideias.length > 0 && (
          <Badge variant="purple">{ideias.length} ideias</Badge>
        )}
      </div>

      {gerando && <LoadingSpinner text="Gerando ideias criativas... aguarde." />}

      {!gerando && (
        <>
          {/* Abas de formato */}
          <div className="flex gap-1 border-b border-gray-100">
            {FORMATOS.map((f) => {
              const count = ideias.filter((i) => i.formato === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFormatoAtivo(f.key)}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors ${
                    formatoAtivo === f.key
                      ? 'border-brand-600 text-brand-600 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f.emoji} {f.label}
                  {count > 0 && (
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-xs text-brand-600">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lista de ideias */}
          {ideiasDoFormato.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title={`Nenhuma ideia de ${FORMATOS.find((f) => f.key === formatoAtivo)?.label}`}
              description="Selecione um produto e clique em 'Gerar ideias'."
            />
          ) : (
            <div className="space-y-3">
              {ideiasDoFormato.map((ideia, i) => (
                <Card key={ideia.id} className="hover:border-gray-300 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="min-w-[28px] text-sm font-semibold text-brand-400">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ideia.titulo}</p>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                        {ideia.descricao}
                      </p>
                    </div>
                    <button
                      onClick={() => salvarIdeia(ideia)}
                      className="text-gray-400 hover:text-brand-600 transition-colors"
                      title="Salvar na biblioteca"
                    >
                      <BookmarkPlus size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
