'use client';

import { useEffect, useState } from 'react';
import { Plus, Package, Lightbulb, Tag } from 'lucide-react';
import { Card, Badge, EmptyState, LoadingSpinner } from '@/components/ui';
import Button from '@/components/ui/Button';
import { getProdutos } from '@/lib/firebase/db';
import { useAppStore } from '@/lib/store';
import type { Produto } from '@/types';
import ProdutoModal from '@/components/modules/ProdutoModal';
import { formatarMoeda } from '@/lib/utils';
import Link from 'next/link';

export default function ProdutosPage() {
  const { clienteAtivo } = useAppStore();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEdicao, setProdutoEdicao] = useState<Produto | null>(null);

  async function carregar() {
    if (!clienteAtivo) { setLoading(false); return; }
    setLoading(true);
    setProdutos(await getProdutos(clienteAtivo.id));
    setLoading(false);
  }

  useEffect(() => { carregar(); }, [clienteAtivo]);

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Package}
        title="Nenhum cliente selecionado"
        description="Selecione um cliente na barra lateral para gerenciar seus produtos."
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {clienteAtivo.nome} · {produtos.length} produto{produtos.length !== 1 ? 's' : ''} cadastrado{produtos.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setProdutoEdicao(null); setModalAberto(true); }}
        >
          <Plus size={14} />
          Novo produto
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Carregando produtos..." />
      ) : produtos.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Cadastre produtos ou serviços para gerar conteúdo personalizado."
          action={
            <Button variant="primary" onClick={() => setModalAberto(true)}>
              <Plus size={14} />
              Cadastrar produto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {produtos.map((p) => (
            <Card key={p.id} className="hover:border-gray-300 transition-colors">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.nome}</p>
                  <p className="text-xs text-gray-500">{p.categoria}</p>
                </div>
                {p.melhorPeriodo && (
                  <Badge variant="amber">{p.melhorPeriodo}</Badge>
                )}
              </div>

              <p className="mb-3 text-sm text-gray-600 line-clamp-2">{p.descricao}</p>

              {p.beneficios.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {p.beneficios.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="h-1 w-1 rounded-full bg-brand-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {p.palavrasChave.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {p.palavrasChave.slice(0, 4).map((k) => (
                    <span key={k} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      <Tag size={9} />
                      {k}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-sm font-semibold text-brand-600">
                  {p.preco ? formatarMoeda(p.preco) : p.precoTexto || '—'}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setProdutoEdicao(p); setModalAberto(true); }}
                  >
                    Editar
                  </Button>
                  <Link href={`/ideias?produtoId=${p.id}`}>
                    <Button size="sm" variant="primary">
                      <Lightbulb size={12} />
                      Ideias
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalAberto && (
        <ProdutoModal
          produto={produtoEdicao}
          clienteId={clienteAtivo.id}
          onClose={() => setModalAberto(false)}
          onSaved={() => { setModalAberto(false); carregar(); }}
        />
      )}
    </div>
  );
}
