import { cn } from '@/lib/utils';

export default function TimeInput({ value, onChange, disabled, className }) {
  return (
    <input
      type="time"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50',
        className
      )}
    />
  );
}