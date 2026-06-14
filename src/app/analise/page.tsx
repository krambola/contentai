'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Rocket, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos, getUltimaAnalise } from '@/lib/firebase/db';
import type { AnaliseNegocio, Produto } from '@/types';
import { formatarData } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AnalisePage() {
  const { clienteAtivo } = useAppStore();
  const [analise, setAnalise] = useState<AnaliseNegocio | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const [a, ps] = await Promise.all([
        getUltimaAnalise(clienteAtivo!.id),
        getProdutos(clienteAtivo!.id),
      ]);
      setAnalise(a);
      setProdutos(ps);
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  async function analisar() {
    if (!clienteAtivo) return;
    setGerando(true);
    try {
      const res = await fetch('/api/analise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteAtivo, produtos }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalise(data);
      toast.success('Análise gerada com sucesso!');
    } catch {
      toast.error('Erro ao gerar análise. Verifique sua chave da API.');
    } finally {
      setGerando(false);
    }
  }

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Nenhum cliente selecionado"
        description="Selecione um cliente para gerar a análise."
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner text="Carregando análise..." />;

  const swot = [
    {
      key: 'pontosFortes',
      label: 'Pontos fortes',
      icon: TrendingUp,
      cor: 'text-green-600',
      bg: 'bg-green-50 border-green-100',
      check: '✓',
      checkCor: 'text-green-500',
      itens: analise?.pontosFortes ?? [],
    },
    {
      key: 'pontosFragos',
      label: 'Pontos fracos',
      icon: TrendingDown,
      cor: 'text-red-600',
      bg: 'bg-red-50 border-red-100',
      check: '✗',
      checkCor: 'text-red-500',
      itens: analise?.pontosFragos ?? [],
    },
    {
      key: 'oportunidades',
      label: 'Oportunidades',
      icon: Rocket,
      cor: 'text-brand-600',
      bg: 'bg-brand-50 border-brand-100',
      check: '→',
      checkCor: 'text-brand-500',
      itens: analise?.oportunidades ?? [],
    },
    {
      key: 'ameacas',
      label: 'Ameaças',
      icon: AlertTriangle,
      cor: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
      check: '!',
      checkCor: 'text-amber-500',
      itens: analise?.ameacas ?? [],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {clienteAtivo.nome}
            {analise && (
              <span className="ml-2 text-xs text-gray-400">
                · Última análise: {formatarData(analise.geradoEm)}
              </span>
            )}
          </p>
        </div>
        <Button variant="primary" onClick={analisar} loading={gerando}>
          <Sparkles size={14} />
          {analise ? 'Reanalisar com IA' : 'Analisar cliente'}
        </Button>
      </div>

      {gerando && (
        <LoadingSpinner text="A IA está analisando o negócio... pode levar alguns segundos." />
      )}

      {!gerando && !analise && (
        <EmptyState
          icon={TrendingUp}
          title="Análise ainda não gerada"
          description="Clique em 'Analisar cliente' para que a IA processe os dados e gere o diagnóstico SWOT."
        />
      )}

      {!gerando && analise && (
        <>
          {analise.resumoGeral && (
            <Card className="border-brand-100 bg-brand-50">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 mb-2">
                Resumo executivo
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{analise.resumoGeral}</p>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            {swot.map((q) => (
              <Card key={q.key} className={`border ${q.bg}`}>
                <div className={`mb-3 flex items-center gap-2 text-sm font-semibold ${q.cor}`}>
                  <q.icon size={16} />
                  {q.label}
                </div>
                {q.itens.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum item identificado.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {q.itens.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className={`mt-0.5 font-bold ${q.checkCor}`}>{q.check}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
