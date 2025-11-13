'use client';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const DateInput = ({ label, value, onChange }: DateInputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-600 dark:text-white"
    />
  </div>
);

