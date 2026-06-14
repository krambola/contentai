'use client';

import { useEffect, useState } from 'react';
import { Archive, Image, FileText, Video, Calendar, Tag, Lightbulb, Copy, Trash2 } from 'lucide-react';
import { Card, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { getBiblioteca } from '@/lib/firebase/db';
import type { ConteudoBiblioteca, TipoConteudo } from '@/types';
import Link from 'next/link';
import { formatarData } from '@/lib/utils';
import toast from 'react-hot-toast';

const TIPO_CONFIG: Record<TipoConteudo, { label: string; icon: React.ElementType; cor: string }> = {
  arte: { label: 'Arte', icon: Image, cor: 'bg-brand-50 text-brand-600' },
  legenda: { label: 'Legenda', icon: FileText, cor: 'bg-green-50 text-green-600' },
  roteiro: { label: 'Roteiro', icon: Video, cor: 'bg-amber-50 text-amber-600' },
  calendario: { label: 'Calendário', icon: Calendar, cor: 'bg-teal-50 text-teal-600' },
  campanha: { label: 'Campanha', icon: Tag, cor: 'bg-orange-50 text-orange-600' },
  ideia: { label: 'Ideia', icon: Lightbulb, cor: 'bg-purple-50 text-purple-600' },
};

const FILTROS: { key: TipoConteudo | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Tudo' },
  { key: 'arte', label: 'Artes' },
  { key: 'legenda', label: 'Legendas' },
  { key: 'roteiro', label: 'Roteiros' },
  { key: 'calendario', label: 'Calendários' },
  { key: 'campanha', label: 'Campanhas' },
  { key: 'ideia', label: 'Ideias' },
];

export default function BibliotecaPage() {
  const { clienteAtivo } = useAppStore();
  const [itens, setItens] = useState<ConteudoBiblioteca[]>([]);
  const [filtro, setFiltro] = useState<TipoConteudo | 'todos'>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clienteAtivo) { setLoading(false); return; }
    async function load() {
      setLoading(true);
      setItens(await getBiblioteca(clienteAtivo!.id));
      setLoading(false);
    }
    load();
  }, [clienteAtivo]);

  const filtrados = filtro === 'todos' ? itens : itens.filter((i) => i.tipo === filtro);

  if (!clienteAtivo) {
    return (
      <EmptyState
        icon={Archive}
        title="Nenhum cliente selecionado"
        action={<Link href="/clientes"><Button variant="primary">Ir para clientes</Button></Link>}
      />
    );
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtro === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
            {f.key !== 'todos' && (
              <span className="ml-1.5 opacity-60">
                {itens.filter((i) => i.tipo === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Nenhum conteúdo salvo"
          description="Conteúdo gerado nos outros módulos aparece aqui quando salvo."
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtrados.map((item) => {
            const cfg = TIPO_CONFIG[item.tipo];
            const Icon = cfg.icon;
            return (
              <Card key={item.id} className="hover:border-gray-300 transition-colors group">
                {/* Ícone */}
                <div className={`mb-3 flex h-12 w-full items-center justify-center rounded-lg ${cfg.cor}`}>
                  <Icon size={22} />
                </div>
                <p className="mb-1 text-sm font-semibold line-clamp-1">{item.titulo}</p>
                <p className="mb-2 text-xs text-gray-500">
                  {cfg.label} · {formatarData(item.criadoEm)}
                </p>
                {item.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(item.conteudo);
                      toast.success('Copiado!');
                    }}
                  >
                    <Copy size={12} />
                    Copiar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
