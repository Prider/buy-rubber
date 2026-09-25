'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DarkModeToggle from '@/shared/ui/DarkModeToggle';
import Logo from '@/shared/ui/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
        return;
      }
      router.push('/login');
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="px-8 py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Logo className="h-12 w-auto" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ตั้งรหัสผ่านใหม่</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">รหัสผ่านผู้ดูแลร้าน</p>
                </div>
              </div>
              <DarkModeToggle />
            </div>
          </div>

          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  รหัสผ่านใหม่ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  required
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 transition-all duration-200 shadow-sm"
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
              </button>
            </form>
          </div>

          <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-700/50">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              <a href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                กลับไปเข้าสู่ระบบ
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
