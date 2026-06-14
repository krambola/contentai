import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function nomeMes(mes: number, ano: number): string {
  return new Date(ano, mes - 1).toLocaleString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export const CORES_SEGMENTO: Record<string, string> = {
  alimentacao: 'bg-amber-100 text-amber-800',
  beleza: 'bg-pink-100 text-pink-800',
  moda: 'bg-purple-100 text-purple-800',
  saude: 'bg-green-100 text-green-800',
  educacao: 'bg-blue-100 text-blue-800',
  pet: 'bg-orange-100 text-orange-800',
  tecnologia: 'bg-cyan-100 text-cyan-800',
  outro: 'bg-gray-100 text-gray-700',
};

export const TIPOS_PUBLICACAO_LABEL: Record<string, string> = {
  feed: '📸 Feed',
  reel: '🎬 Reel',
  stories: '📱 Stories',
  carrossel: '📖 Carrossel',
  campanha: '🏷 Campanha',
};

export const SEGMENTOS = [
  'Alimentação',
  'Beleza e Estética',
  'Moda e Vestuário',
  'Saúde e Bem-estar',
  'Educação',
  'Pet Shop',
  'Tecnologia',
  'Serviços Gerais',
  'Decoração',
  'Fitness e Academia',
  'Outro',
];
