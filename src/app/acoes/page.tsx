'use client';

import { useEffect, useState } from 'react';
import { Zap, Sparkles, Video, Tag, TrendingUp, Star, Users, Play } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getProdutos } from '@/lib/firebase/db';
import type { Produto } from '@/types';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Acao {
  titulo: string;
  descricao: string;
  tipo: string;
  urgencia: string;
}

const TIPO_ICONE: Record<string, React.ElementType> = {
  gravar_video: Video,
  criar_promocao: Tag,
  impulsionar_post: TrendingUp,
  criar_combo: Users,
  coletar_depoimento: Star,
  fazer_reels: Play,
};

const URGENCIA_CONFIG = {
  imediata: { label: 'Imediata', variant: 'coral' as const },
  esta_semana: { label: 'Esta semana', variant: 'amber' as const },
  este_mes: { label: 'Este mês', variant: 'gray' as const },
};

const TIPO_LINK: Record<string, string> = {
  gravar_video: '/roteiros',
  fazer_reels: '/roteiros',
  criar_promocao: '/ideias',
  impulsionar_post: '/calendario',
  criar_combo: '/ideias',
  coletar_depoimento: '/biblioteca',
};

export default function AcoesPage() {
  const { clienteAtivo } = useAppStore();
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      setProdutos(await getProdutos(clienteAtivo!.id));
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  async function gerar() {
    if (!clienteAtivo) return;
    setGerando(true);
    try {
      const res = await fetch('/api/acoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: clienteAtivo, produtos }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAcoes(data.acoes);
      toast.success('Próximas ações geradas!');
    } catch {
      toast.error('Erro ao gerar ações.');
    } finally {
      setGerando(false);
    }
  }

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Zap}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{clienteAtivo.nome} · sugestões da IA</p>
        <Button variant="primary" size="sm" onClick={gerar} loading={gerando}>
          <Sparkles size={13} />
          {acoes.length > 0 ? 'Atualizar sugestões' : 'Gerar sugestões'}
        </Button>
      </div>

      {gerando && <LoadingSpinner text="Analisando dados e gerando sugestões..." />}

      {!gerando && acoes.length === 0 && (
        <EmptyState
          icon={Zap}
          title="Nenhuma sugestão gerada"
          description="Clique em 'Gerar sugestões' para que a IA analise o negócio e sugira as ações mais impactantes."
        />
      )}

      {!gerando && acoes.length > 0 && (
        <div className="space-y-3">
          {acoes.map((acao, i) => {
            const Icon = TIPO_ICONE[acao.tipo] ?? Zap;
            const urgCfg = URGENCIA_CONFIG[acao.urgencia as keyof typeof URGENCIA_CONFIG];
            const link = TIPO_LINK[acao.tipo] ?? '/dashboard';

            return (
              <Card key={i} className="hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-semibold">{acao.titulo}</p>
                      {urgCfg && (
                        <Badge variant={urgCfg.variant}>{urgCfg.label}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{acao.descricao}</p>
                  </div>
                  <Link href={link}>
                    <Button size="sm" variant="primary">
                      Executar
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
