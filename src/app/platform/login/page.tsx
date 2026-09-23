'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const TOKEN_KEY = 'platform_token';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/platform/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      router.push('/platform');
    } catch {
      setError('เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-gray-950 p-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Logo className="h-10 w-auto" />
          <h1 className="text-xl font-bold">เจ้าของแพลตฟอร์ม</h1>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ชื่อผู้ใช้"
          className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน"
          className="w-full rounded-xl border px-4 py-3 dark:bg-gray-700"
        />
        <button disabled={loading} className="w-full rounded-xl bg-slate-800 text-white py-3 font-semibold">
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
