'use client';

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const DateInput = ({ label, value, onChange }: DateInputProps) => (
  <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
    <span className="shrink-0">{label}</span>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-[9.25rem] rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-500 dark:bg-gray-600 dark:text-white"
    />
  </label>
);

