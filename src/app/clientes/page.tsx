'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Building2, Check } from 'lucide-react';
import { Card, Badge, EmptyState, LoadingSpinner, Avatar } from '@/components/ui';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getClientes } from '@/lib/firebase/db';
import { useAppStore } from '@/lib/store';
import type { Cliente } from '@/types';
import ClienteModal from '@/components/modules/ClienteModal';
import toast from 'react-hot-toast';

export default function ClientesPage() {
  const { clienteAtivo, setClienteAtivo } = useAppStore();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState<Cliente | null>(null);

  async function carregar() {
    setLoading(true);
    setClientes(await getClientes());
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.segmento.toLowerCase().includes(busca.toLowerCase())
  );

  function selecionar(c: Cliente) {
    setClienteAtivo(c);
    toast.success(`${c.nome} selecionado como cliente ativo`);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-600 focus:outline-none"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setClienteEdicao(null); setModalAberto(true); }}
        >
          <Plus size={14} />
          Novo cliente
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Carregando clientes..." />
      ) : filtrados.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum cliente encontrado"
          description="Cadastre seu primeiro cliente para começar a gerar conteúdo."
          action={
            <Button variant="primary" onClick={() => setModalAberto(true)}>
              <Plus size={14} />
              Cadastrar cliente
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtrados.map((c) => (
            <Card
              key={c.id}
              className={`transition-all ${clienteAtivo?.id === c.id ? 'border-brand-300 bg-brand-50/30' : 'hover:border-gray-300'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar nome={c.nome} size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{c.nome}</p>
                      {clienteAtivo?.id === c.id && (
                        <Badge variant="purple">
                          <Check size={10} className="mr-1" />
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{c.segmento} · {c.cidade}</p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {c.instagram && <Badge variant="purple">Instagram</Badge>}
                      {c.googleMeuNegocio && <Badge variant="green">Google Meu Negócio</Badge>}
                      {c.whatsapp && <Badge variant="teal">WhatsApp</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setClienteEdicao(c); setModalAberto(true); }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={clienteAtivo?.id === c.id ? 'secondary' : 'primary'}
                    onClick={() => selecionar(c)}
                  >
                    {clienteAtivo?.id === c.id ? 'Selecionado' : 'Selecionar'}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500">Tom de voz</p>
                  <p className="text-sm">{c.tomDeVoz || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Público-alvo</p>
                  <p className="text-sm">{c.publicoAlvo || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Objetivo</p>
                  <p className="text-sm">{c.objetivos || '—'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalAberto && (
        <ClienteModal
          cliente={clienteEdicao}
          onClose={() => setModalAberto(false)}
          onSaved={() => { setModalAberto(false); carregar(); }}
        />
      )}
    </div>
  );
}
