'use client';

import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generateHistoryHTML = (data: any[], memberName?: string) => `
  <html>
    <head>
      <meta charset="utf-8" />
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Sarabun', 'TH Sarabun New', 'Leelawadee UI', Arial, sans-serif; margin: 16px 40px; color: #000; }
        .wrapper { padding: 28px 40px; border: 1px solid #ddd; border-radius: 16px; }
        h1 { text-align: center; margin-bottom: 24px; font-size: 24px; }
        .info { margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 10px; }
        th { background: #f4f4f4; font-weight: 600; }
        td.number { text-align: right; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <h1>ประวัติการรับซื้อของ ${memberName ?? '-'}</h1>
        <div class="info">
          <p><strong>วันที่ออกรายงาน:</strong> ${new Date().toLocaleString('th-TH')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ประเภทสินค้า</th>
              <th>น้ำหนักสุทธิ (กก.)</th>
              <th>ราคา/กก.</th>
              <th>ยอดรวม (บาท)</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (item) => `
                  <tr>
                    <td>${formatDate(item.date)} ${new Date(item.date).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</td>
                    <td>${item.productType?.name ?? '-'}</td>
                    <td class="number">${formatNumber(item.netWeight)} กก.</td>
                    <td class="number">${formatNumber(item.basePrice)}</td>
                    <td class="number">${formatCurrency(item.totalAmount)}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </body>
  </html>
`;

export const downloadMemberHistoryPDF = async (purchases: any[], member?: { name?: string; code?: string }) => {
  if (!purchases.length) {
    window.alert('ไม่มีข้อมูลสำหรับดาวน์โหลด');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const html = generateHistoryHTML(purchases, member?.name);

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'fixed';
  container.style.top = '-10000px';
  container.style.left = '0';
  container.style.width = '794px';
  container.style.color = '#000';
  container.style.background = '#fff';
  document.body.appendChild(container);

  await new Promise<void>((resolve) => setTimeout(resolve, 120));

  const canvas = await html2canvas(container, { scale: 1, useCORS: true });
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const fileName = `ประวัติการรับซื้อ_${member?.code ?? 'member'}_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

