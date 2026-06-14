'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui';
import { criarProduto, atualizarProduto } from '@/lib/firebase/db';
import type { Produto, ProdutoInput } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  produto: Produto | null;
  clienteId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProdutoModal({ produto, clienteId, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false);
  const [beneficios, setBeneficios] = useState<string[]>(produto?.beneficios ?? ['']);
  const [palavrasChave, setPalavrasChave] = useState<string>(
    produto?.palavrasChave.join(', ') ?? ''
  );

  const { register, handleSubmit, formState: { errors } } = useForm<ProdutoInput>({
    defaultValues: produto ?? {
      clienteId,
      nome: '',
      categoria: '',
      descricao: '',
      beneficios: [],
      diferenciais: '',
      precoTexto: '',
      fotoUrls: [],
      videoUrls: [],
      palavrasChave: [],
    },
  });

  async function onSubmit(data: ProdutoInput) {
    setSaving(true);
    try {
      const payload: ProdutoInput = {
        ...data,
        clienteId,
        beneficios: beneficios.filter(Boolean),
        palavrasChave: palavrasChave.split(',').map((k) => k.trim()).filter(Boolean),
      };

      if (produto) {
        await atualizarProduto(produto.id, payload);
        toast.success('Produto atualizado!');
      } else {
        await criarProduto(payload);
        toast.success('Produto cadastrado!');
      }
      onSaved();
    } catch {
      toast.error('Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold">
            {produto ? 'Editar produto' : 'Novo produto / serviço'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nome *"
                {...register('nome', { required: 'Nome obrigatório' })}
                error={errors.nome?.message}
              />
              <Input label="Categoria" {...register('categoria')} placeholder="Ex: Sobremesas" />
            </div>

            <Textarea
              label="Descrição"
              rows={3}
              {...register('descricao')}
              placeholder="Descreva o produto ou serviço..."
            />

            {/* Benefícios */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Benefícios</p>
              {beneficios.map((b, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={b}
                    onChange={(e) => {
                      const n = [...beneficios];
                      n[i] = e.target.value;
                      setBeneficios(n);
                    }}
                    placeholder={`Benefício ${i + 1}`}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setBeneficios(beneficios.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBeneficios([...beneficios, ''])}
                className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <Plus size={12} />
                Adicionar benefício
              </button>
            </div>

            <Input
              label="Diferenciais"
              {...register('diferenciais')}
              placeholder="O que diferencia este produto?"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preço"
                {...register('precoTexto')}
                placeholder="Ex: R$ 89,90 ou A partir de R$ 50"
              />
              <Input
                label="Melhor período de venda"
                {...register('melhorPeriodo')}
                placeholder="Ex: Festas de fim de ano"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Palavras-chave
              </label>
              <input
                value={palavrasChave}
                onChange={(e) => setPalavrasChave(e.target.value)}
                placeholder="artesanal, presente, sobremesa (separadas por vírgula)"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {produto ? 'Salvar' : 'Cadastrar produto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
