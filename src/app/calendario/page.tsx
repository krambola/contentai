'use client';

import { useEffect, useState } from 'react';
import { Calendar, Sparkles, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos, getCalendario } from '@/lib/firebase/db';
import type { ItemCalendario, Produto } from '@/types';
import { nomeMes, TIPOS_PUBLICACAO_LABEL } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CORES_TIPO: Record<string, string> = {
  feed: 'bg-brand-100 text-brand-700',
  reel: 'bg-green-100 text-green-700',
  stories: 'bg-amber-100 text-amber-700',
  carrossel: 'bg-orange-100 text-orange-700',
  campanha: 'bg-red-100 text-red-700',
};

export default function CalendarioPage() {
  const { clienteAtivo } = useAppStore();
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [itens, setItens] = useState<ItemCalendario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);

  async function exportarPDF() {
    if (!clienteAtivo || itens.length === 0) return;
    setExportando(true);
    try {
      const { exportarCalendarioPDF } = await import('@/lib/pdf/exportCalendario');
      await exportarCalendarioPDF(clienteAtivo, itens, mes, ano);
    } catch {
      toast.error('Erro ao exportar PDF.');
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const [ps, is] = await Promise.all([
        getProdutos(clienteAtivo!.id),
        getCalendario(clienteAtivo!.id, mes, ano),
      ]);
      setProdutos(ps);
      setItens(is);
      setLoading(false);
    }
    load();
  }, [clienteAtivo, mes, ano]);

  async function gerar() {
    if (!clienteAtivo) return;
    setGerando(true);
    try {
      const res = await fetch('/api/calendario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteAtivo, produtos, mes, ano }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItens(data.itens);
      toast.success(`${data.itens.length} posts planejados!`);
    } catch {
      toast.error('Erro ao gerar calendário.');
    } finally {
      setGerando(false);
    }
  }

  function navegar(delta: number) {
    const d = new Date(ano, mes - 1 + delta);
    setMes(d.getMonth() + 1);
    setAno(d.getFullYear());
    setDiaSelecionado(null);
  }

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  // Build calendar grid
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const cells = Array.from({ length: primeiroDia + diasNoMes }, (_, i) =>
    i < primeiroDia ? null : i - primeiroDia + 1
  );

  const itensPorDia = (dia: number) =>
    itens.filter((it) => new Date(it.data).getDate() === dia);

  const diasSelecionadoItens = diaSelecionado ? itensPorDia(diaSelecionado) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navegar(-1)} className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        <p className="min-w-[160px] text-center text-sm font-semibold capitalize">
          {nomeMes(mes, ano)}
        </p>
        <button onClick={() => navegar(1)} className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50">
          <ChevronRight size={16} />
        </button>
        <div className="ml-auto flex items-center gap-2">
          {itens.length > 0 && (
            <Badge variant="purple">{itens.length} posts planejados</Badge>
          )}
          {itens.length > 0 && (
            <Button size="sm" variant="secondary" onClick={exportarPDF} loading={exportando}>
              <FileDown size={13} />
              Exportar PDF
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={gerar} loading={gerando}>
            <Sparkles size={13} />
            {itens.length > 0 ? 'Regenerar' : 'Gerar calendário'}
          </Button>
        </div>
      </div>

      {gerando && <LoadingSpinner text="Gerando calendário estratégico..." />}

      {!gerando && (
        <div className="grid grid-cols-3 gap-5">
          {/* Calendário */}
          <div className="col-span-2">
            <Card className="p-3">
              {/* Cabeçalho dos dias */}
              <div className="mb-2 grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                  <div key={d} className="py-1 text-center text-xs font-medium text-gray-400">
                    {d}
                  </div>
                ))}
              </div>

              {/* Dias */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((dia, i) => {
                  if (!dia) return <div key={`empty-${i}`} />;
                  const posts = itensPorDia(dia);
                  const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() + 1 && ano === hoje.getFullYear();
                  const isSel = dia === diaSelecionado;
                  return (
                    <button
                      key={dia}
                      onClick={() => setDiaSelecionado(isSel ? null : dia)}
                      className={`min-h-[56px] rounded-lg border p-1 text-left transition-all ${
                        isSel
                          ? 'border-brand-400 bg-brand-50'
                          : isHoje
                          ? 'border-brand-200 bg-brand-50/50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className={`mb-1 text-xs font-medium ${isHoje ? 'text-brand-600' : 'text-gray-500'}`}>
                        {dia}
                      </p>
                      {posts.slice(0, 2).map((p, j) => (
                        <div
                          key={j}
                          className={`mb-0.5 truncate rounded px-1 py-0.5 text-[9px] ${CORES_TIPO[p.tipo] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {TIPOS_PUBLICACAO_LABEL[p.tipo]}
                        </div>
                      ))}
                      {posts.length > 2 && (
                        <p className="text-[9px] text-gray-400">+{posts.length - 2}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Detalhe do dia */}
          <div>
            {diaSelecionado && diasSelecionadoItens.length > 0 ? (
              <Card>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Dia {diaSelecionado}
                </p>
                <div className="space-y-3">
                  {diasSelecionadoItens.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${CORES_TIPO[item.tipo]}`}>
                          {TIPOS_PUBLICACAO_LABEL[item.tipo]}
                        </span>
                      </div>
                      <p className="mb-1 text-xs font-medium text-gray-700">{item.objetivo}</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{item.legenda}</p>
                      {item.cta && (
                        <p className="mt-2 text-xs font-medium text-brand-600">CTA: {item.cta}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="border-dashed text-center">
                <Calendar size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500">
                  {itens.length === 0
                    ? 'Gere o calendário para ver os posts planejados'
                    : 'Clique em um dia para ver os posts'}
                </p>
              </Card>
            )}

            {/* Legenda */}
            <Card className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Legenda
              </p>
              <div className="space-y-1.5">
                {Object.entries(TIPOS_PUBLICACAO_LABEL).map(([tipo, label]) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${CORES_TIPO[tipo]}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
