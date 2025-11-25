import React from 'react';
import { BackupSettings as Settings } from '../hooks/useBackupSettings';
import { FREQUENCY_OPTIONS, MAX_BACKUP_COUNT } from '../constants';

interface BackupSettingsProps {
  settings: Settings;
  loading: boolean;
  onUpdate: (updates: Partial<Settings>) => void;
  onSave: () => void;
}

export function BackupSettings({
  settings,
  loading,
  onUpdate,
  onSave,
}: BackupSettingsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          ⚙️ ตั้งค่าการสำรองอัตโนมัติ
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Enable Auto Backup */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className="text-sm font-semibold text-gray-900 dark:text-white">
              เปิดใช้งานการสำรองอัตโนมัติ
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ระบบจะสำรองข้อมูลตามเวลาที่กำหนด
            </p>
          </div>
          <button
            onClick={() => onUpdate({ enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.enabled && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  ความถี่ในการสำรอง
                </label>
                <select
                  value={settings.frequency}
                  onChange={(e) => onUpdate({ frequency: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  เวลาที่จะสำรอง
                </label>
                <input
                  type="time"
                  value={settings.time}
                  onChange={(e) => onUpdate({ time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
              </div>

              {/* Max Count */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  จำนวนสูงสุดที่เก็บไว้
                </label>
                <input
                  type="number"
                  min={MAX_BACKUP_COUNT.MIN}
                  max={MAX_BACKUP_COUNT.MAX}
                  value={settings.maxCount}
                  onChange={(e) => onUpdate({ maxCount: parseInt(e.target.value) || MAX_BACKUP_COUNT.DEFAULT })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ระบบจะลบไฟล์เก่าอัตโนมัติเมื่อเกินจำนวนที่กำหนด
                </p>
              </div>

              {/* Auto Cleanup */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">
                    ลบไฟล์เก่าอัตโนมัติ
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ลบไฟล์เก่าอัตโนมัติเมื่อเกินจำนวนสูงสุด
                  </p>
                </div>
                <button
                  onClick={() => onUpdate({ autoCleanup: !settings.autoCleanup })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoCleanup ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoCleanup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

