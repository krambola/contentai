import type { ItemCalendario, Cliente } from '@/types';
import { TIPOS_PUBLICACAO_LABEL, nomeMes } from '@/lib/utils';

// Exporta o calendário como PDF usando jsPDF (carregado via CDN no cliente)
export async function exportarCalendarioPDF(
  cliente: Cliente,
  itens: ItemCalendario[],
  mes: number,
  ano: number
): Promise<void> {
  // Carrega jsPDF dinamicamente
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const titulo = `Calendário de Conteúdo — ${cliente.nome}`;
  const subtitulo = nomeMes(mes, ano);

  // Cabeçalho
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(subtitulo, 14, 26);

  // Tabela
  const colunas = ['Data', 'Tipo', 'Objetivo', 'Legenda', 'CTA'];
  const linhas = itens.map((item) => [
    new Date(item.data).toLocaleDateString('pt-BR'),
    TIPOS_PUBLICACAO_LABEL[item.tipo] ?? item.tipo,
    item.objetivo,
    item.legenda.slice(0, 120) + (item.legenda.length > 120 ? '...' : ''),
    item.cta,
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (doc as any).autoTable({
    head: [colunas],
    body: linhas,
    startY: 32,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [83, 74, 183], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [238, 237, 254] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 40 },
      3: { cellWidth: 120 },
      4: { cellWidth: 40 },
    },
  });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160);
    doc.text(
      `ContentAI — ${cliente.nome} — Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  doc.save(`calendario-${cliente.nome}-${mes}-${ano}.pdf`);
}
