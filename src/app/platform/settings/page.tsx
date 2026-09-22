'use client';

import { useEffect, useState } from 'react';

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('platform_token') || ''}` };
}

export default function PlatformSettingsPage() {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [promptPayId, setPromptPayId] = useState('');
  const [premiumPriceThb, setPremiumPriceThb] = useState('0');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/platform/settings', { headers: authHeader() })
      .then((res) => res.json())
      .then((data) => {
        setBankName(data.bankName || '');
        setAccountName(data.accountName || '');
        setAccountNumber(data.accountNumber || '');
        setPromptPayId(data.promptPayId || '');
        setPremiumPriceThb(String(data.premiumPriceThb ?? 0));
        setQrPreview(data.qrDataUrl || null);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('bankName', bankName);
    form.append('accountName', accountName);
    form.append('accountNumber', accountNumber);
    form.append('promptPayId', promptPayId);
    form.append('premiumPriceThb', premiumPriceThb);
    if (qrFile) form.append('qrImage', qrFile);
    const res = await fetch('/api/platform/settings', {
      method: 'PUT',
      headers: authHeader(),
      body: form,
    });
    const data = await res.json();
    setMessage(data.success ? 'บันทึกแล้ว' : 'บันทึกไม่สำเร็จ');
  };

  return (
    <form onSubmit={save} className="max-w-xl space-y-4 bg-white dark:bg-gray-800 rounded-2xl p-6 border">
      <h1 className="text-2xl font-bold">บัญชีรับเงิน Premium</h1>
      {message && <p className="text-sm text-green-600">{message}</p>}
      <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="ธนาคาร" className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700" />
      <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="ชื่อบัญชี" className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700" />
      <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="เลขบัญชี" className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700" />
      <input value={promptPayId} onChange={(e) => setPromptPayId(e.target.value)} placeholder="พร้อมเพย์" className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700" />
      <input value={premiumPriceThb} onChange={(e) => setPremiumPriceThb(e.target.value)} placeholder="ราคา Premium (บาท)" className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700" />
      <input type="file" accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
      {qrPreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrPreview} alt="QR" className="w-40 h-40 bg-white rounded-xl" />
      )}
      <button className="rounded-xl bg-slate-800 text-white px-5 py-3 font-semibold">บันทึก</button>
    </form>
  );
}
