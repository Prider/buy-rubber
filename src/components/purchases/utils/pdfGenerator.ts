import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PurchaseTransaction } from '../types';
import { generateSlipHTML } from './slipGenerator';

/**
 * Shared PDF generation utility that accepts HTML string
 */
export async function generatePDFFromHTML(html: string, fileName: string): Promise<void> {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '0';
  container.style.color = '#000000';
  container.style.filter = 'none';
  container.style.webkitFilter = 'none';
  container.style.background = '#ffffff';
  container.style.backgroundColor = '#ffffff';
    
  document.body.appendChild(container);

  // Wait for fonts and content to load
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), 200);
  });

  const slipElement = container.querySelector('.slip') as HTMLElement | null;

  const attrW = slipElement?.getAttribute('data-slip-width');
  let slipWidthPx = attrW ? parseInt(attrW, 10) : 320;
  if (!Number.isFinite(slipWidthPx) || slipWidthPx <= 0) {
    slipWidthPx = slipElement?.offsetWidth || 320;
  }

  container.style.width = `${slipWidthPx}px`;

  if (slipElement) {
    slipElement.style.background = '#ffffff';
    slipElement.style.backgroundColor = '#ffffff';
  }

  const canvas = await html2canvas(slipElement || container, {
    scale: 1,
    useCORS: true,
    backgroundColor: '#ffffff',
    removeContainer: false,
    logging: false,
    width: slipWidthPx,
    windowWidth: slipWidthPx,
  });

  document.body.removeChild(container);

  // 96px ≈ 1in → mm
  const pdfWidthMm = slipWidthPx * (25.4 / 96);
  const pdfHeightMm = (canvas.height / canvas.width) * pdfWidthMm;

  // Create PDF with exact slip dimensions
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [pdfWidthMm, pdfHeightMm],
    compress: true,
  });

  // Ensure PDF background is white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pdfWidthMm, pdfHeightMm, 'F');

  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);

  doc.save(fileName);
}

/**
 * Generate and download PDF from transaction
 */
export async function generateTransactionPDF(transaction: PurchaseTransaction): Promise<void> {
  const html = generateSlipHTML(transaction);
  const dateStr = new Date().toLocaleDateString('th-TH').replace(/\//g, '-');
  const fileName = `รายการรับซื้อ_${transaction.purchaseNo}_${dateStr}.pdf`;
  
  await generatePDFFromHTML(html, fileName);
}

/**
 * Shared print utility that accepts HTML string
 */
export function printHTML(html: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
}

/**
 * Print transaction slip
 */
export function printTransactionSlip(transaction: PurchaseTransaction): void {
  const html = generateSlipHTML(transaction);
  printHTML(html);
}


