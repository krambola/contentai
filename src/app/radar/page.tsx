'use client';

import { useEffect, useState } from 'react';
import { Radar, Sparkles, ArrowRight } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos, getAlertas } from '@/lib/firebase/db';
import type { AlertaRadar, Produto } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

const PRIORIDADE_CONFIG = {
  alta: { label: 'Alta', variant: 'coral' as const, borderColor: 'border-orange-200', bg: 'bg-orange-50' },
  media: { label: 'Média', variant: 'purple' as const, borderColor: 'border-brand-200', bg: 'bg-brand-50' },
  baixa: { label: 'Baixa', variant: 'gray' as const, borderColor: 'border-gray-200', bg: 'bg-gray-50' },
};

const TIPO_EMOJI: Record<string, string> = {
  data_comemorativa: '🎉',
  produto_sem_post: '📦',
  sazonalidade: '📅',
  tendencia: '📈',
};

export default function RadarPage() {
  const { clienteAtivo } = useAppStore();
  const [alertas, setAlertas] = useState<AlertaRadar[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      const [ps, as] = await Promise.all([
        getProdutos(clienteAtivo!.id),
        getAlertas(clienteAtivo!.id),
      ]);
      setProdutos(ps);
      setAlertas(as);
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  async function rodarRadar() {
    if (!clienteAtivo) return;
    setGerando(true);
    try {
      const res = await fetch('/api/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteAtivo, produtos }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlertas(data.alertas);
      toast.success(`${data.alertas.length} oportunidades identificadas!`);
    } catch {
      toast.error('Erro ao rodar radar.');
    } finally {
      setGerando(false);
    }
  }

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Radar}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  const alta = alertas.filter((a) => a.prioridade === 'alta');
  const media = alertas.filter((a) => a.prioridade === 'media');
  const baixa = alertas.filter((a) => a.prioridade === 'baixa');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {clienteAtivo.nome}
          {alertas.length > 0 && (
            <span className="ml-2 text-xs text-gray-400">· {alertas.length} alertas ativos</span>
          )}
        </p>
        <Button variant="primary" size="sm" onClick={rodarRadar} loading={gerando}>
          <Sparkles size={13} />
          {alertas.length > 0 ? 'Atualizar radar' : 'Rodar radar'}
        </Button>
      </div>

      {gerando && <LoadingSpinner text="Analisando oportunidades nos próximos 60 dias..." />}

      {!gerando && alertas.length === 0 && (
        <EmptyState
          icon={Radar}
          title="Radar ainda não executado"
          description="Clique em 'Rodar radar' para identificar oportunidades sazonais e tendências."
        />
      )}

      {!gerando && alertas.length > 0 && (
        <div className="space-y-6">
          {[
            { label: '🔴 Alta prioridade', items: alta },
            { label: '🟡 Média prioridade', items: media },
            { label: '⚪ Baixa prioridade', items: baixa },
          ].map(({ label, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {label}
                </p>
                <div className="space-y-3">
                  {items.map((alerta) => {
                    const cfg = PRIORIDADE_CONFIG[alerta.prioridade];
                    return (
                      <Card key={alerta.id} className={`border ${cfg.borderColor} ${cfg.bg}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-base">{TIPO_EMOJI[alerta.tipo]}</span>
                              <p className="font-semibold text-gray-900">{alerta.titulo}</p>
                              {alerta.diasRestantes != null && (
                                <Badge variant={cfg.variant}>{alerta.diasRestantes} dias</Badge>
                              )}
                            </div>
                            <p className="mb-2 text-sm text-gray-600">{alerta.descricao}</p>
                            <div className="rounded-lg border border-white bg-white px-3 py-2">
                              <p className="text-xs font-medium text-gray-700">
                                💡 {alerta.sugestao}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Link href="/calendario">
                              <Button size="sm" variant="primary">
                                Planejar
                                <ArrowRight size={12} />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
