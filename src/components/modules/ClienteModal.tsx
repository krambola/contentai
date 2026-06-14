'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea, Select } from '@/components/ui';
import { criarCliente, atualizarCliente } from '@/lib/firebase/db';
import { uploadLogo } from '@/lib/firebase/storage';
import { SEGMENTOS } from '@/lib/utils';
import type { Cliente, ClienteInput } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  cliente: Cliente | null;
  onClose: () => void;
  onSaved: () => void;
}

type Tab = 'basico' | 'visual' | 'posicionamento';

export default function ClienteModal({ cliente, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<Tab>('basico');
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coresPrincipais, setCoresPrincipais] = useState<string[]>(
    cliente?.coresPrincipais ?? ['#534AB7']
  );
  const [coresSecundarias, setCoresSecundarias] = useState<string[]>(
    cliente?.coresSecundarias ?? ['#EEEDFE']
  );

  const { register, handleSubmit, formState: { errors } } = useForm<ClienteInput>({
    defaultValues: cliente ?? {
      nome: '',
      segmento: 'Alimentação',
      cidade: '',
      ativo: true,
      coresPrincipais: [],
      coresSecundarias: [],
      fontes: [],
      publicoAlvo: '',
      diferenciais: '',
      tomDeVoz: '',
      objetivos: '',
    },
  });

  async function onSubmit(data: ClienteInput) {
    setSaving(true);
    try {
      let logoUrl = cliente?.logoUrl;
      if (logoFile) {
        const id = cliente?.id ?? crypto.randomUUID();
        logoUrl = await uploadLogo(id, logoFile);
      }

      const payload: ClienteInput = {
        ...data,
        coresPrincipais,
        coresSecundarias,
        logoUrl,
      };

      if (cliente) {
        await atualizarCliente(cliente.id, payload);
        toast.success('Cliente atualizado!');
      } else {
        await criarCliente(payload);
        toast.success('Cliente cadastrado!');
      }
      onSaved();
    } catch {
      toast.error('Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'basico', label: 'Dados básicos' },
    { key: 'visual', label: 'Identidade visual' },
    { key: 'posicionamento', label: 'Posicionamento' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold">
            {cliente ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 pr-5 text-sm transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-brand-600 text-brand-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            {/* TAB: DADOS BÁSICOS */}
            {tab === 'basico' && (
              <div className="space-y-4">
                <Input
                  label="Nome da empresa *"
                  {...register('nome', { required: 'Nome obrigatório' })}
                  error={errors.nome?.message}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Segmento *"
                    {...register('segmento', { required: true })}
                    options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
                  />
                  <Input label="Cidade" {...register('cidade')} />
                </div>
                <Input
                  label="Instagram"
                  placeholder="@seuInstagram"
                  {...register('instagram')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Facebook" {...register('facebook')} />
                  <Input label="WhatsApp" {...register('whatsapp')} placeholder="(35) 99999-9999" />
                </div>
                <Input label="Site" {...register('site')} placeholder="https://" />
                <Input label="Google Meu Negócio" {...register('googleMeuNegocio')} />
              </div>
            )}

            {/* TAB: IDENTIDADE VISUAL */}
            {tab === 'visual' && (
              <div className="space-y-5">
                {/* Logo */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Logotipo</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-6 hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
                    <Upload size={20} className="text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {logoFile ? logoFile.name : 'Clique para enviar logo (PNG, SVG)'}
                    </p>
                    <input
                      type="file"
                      accept=".png,.svg,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {/* Cores principais */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Cores principais</p>
                  <div className="flex flex-wrap gap-2">
                    {coresPrincipais.map((cor, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input
                          type="color"
                          value={cor}
                          onChange={(e) => {
                            const novo = [...coresPrincipais];
                            novo[i] = e.target.value;
                            setCoresPrincipais(novo);
                          }}
                          className="h-8 w-8 cursor-pointer rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setCoresPrincipais(coresPrincipais.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCoresPrincipais([...coresPrincipais, '#000000'])}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-gray-300 hover:border-brand-400 text-gray-400"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Cores secundárias */}
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Cores secundárias</p>
                  <div className="flex flex-wrap gap-2">
                    {coresSecundarias.map((cor, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input
                          type="color"
                          value={cor}
                          onChange={(e) => {
                            const novo = [...coresSecundarias];
                            novo[i] = e.target.value;
                            setCoresSecundarias(novo);
                          }}
                          className="h-8 w-8 cursor-pointer rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setCoresSecundarias(coresSecundarias.filter((_, j) => j !== i))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCoresSecundarias([...coresSecundarias, '#ffffff'])}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-gray-300 hover:border-brand-400 text-gray-400"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <Input
                  label="Fontes da marca"
                  placeholder="Ex: Playfair Display, Montserrat"
                  {...register('elementosGraficos')}
                  hint="Separe por vírgula"
                />
              </div>
            )}

            {/* TAB: POSICIONAMENTO */}
            {tab === 'posicionamento' && (
              <div className="space-y-4">
                <Textarea
                  label="Público-alvo *"
                  rows={3}
                  placeholder="Ex: Mulheres de 25 a 45 anos, classes A e B, que valorizam produtos artesanais..."
                  {...register('publicoAlvo', { required: 'Público-alvo obrigatório' })}
                  error={errors.publicoAlvo?.message}
                />
                <Textarea
                  label="Diferenciais"
                  rows={3}
                  placeholder="O que torna este negócio único no mercado?"
                  {...register('diferenciais')}
                />
                <Input
                  label="Tom de voz"
                  placeholder="Ex: Acolhedor, sofisticado, próximo, divertido..."
                  {...register('tomDeVoz')}
                />
                <Textarea
                  label="Objetivos nas redes sociais"
                  rows={2}
                  placeholder="Ex: Aumentar vendas, fidelizar clientes, gerar reconhecimento de marca..."
                  {...register('objetivos')}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between border-t border-gray-100 px-6 py-4">
            <div className="flex gap-2">
              {tabs.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`h-2 w-6 rounded-full transition-colors ${tab === t.key ? 'bg-brand-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
