// src/lib/exportUtils.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type ColumnDef<T> = {
  header: string;
  accessor: keyof T | ((row: T) => string | number | null | undefined);
};

export type ExportOptions<T> = {
  filename: string;
  title?: string;
  columns: ColumnDef<T>[];
  data: T[];
};

/**
 * Extrai o valor de uma coluna de forma segura
 */
function getCellValue<T>(row: T, col: ColumnDef<T>): string {
  const raw =
    typeof col.accessor === "function"
      ? col.accessor(row)
      : (row[col.accessor] as unknown);

  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
}

/**
 * Gera e baixa um arquivo CSV (UTF-8 com BOM para Excel)
 */
export function exportCSV<T>({ filename, columns, data }: ExportOptions<T>) {
  const headers = columns.map((c) => c.header);
  const rows = data.map((row) =>
    columns.map((col) => getCellValue(row, col))
  );

  const escape = (v: string) =>
    `"${v.replace(/"/g, '""').replace(/\n/g, " ")}"`;

  const csv = [headers, ...rows]
    .map((r) => r.map(escape).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Gera e baixa um arquivo PDF com tabela formatada
 */
export function exportPDF<T>({
  filename,
  title,
  columns,
  data,
}: ExportOptions<T>) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  if (title) {
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(title, pageWidth / 2, 15, { align: "center" });
  }

  // Data de geração
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const dataGeracao = new Date().toLocaleString("pt-BR");
  doc.text(`Gerado em: ${dataGeracao}`, pageWidth - 15, title ? 22 : 12, {
    align: "right",
  });

  // Tabela
  autoTable(doc, {
    startY: title ? 28 : 18,
    head: [columns.map((c) => c.header)],
    body: data.map((row) => columns.map((col) => getCellValue(row, col))),
    theme: "striped",
    headStyles: {
      fillColor: [37, 99, 235], // azul primário
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { left: 10, right: 10 },
    styles: {
      cellPadding: 2.5,
      overflow: "linebreak",
    },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Helper para disparar download do blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}