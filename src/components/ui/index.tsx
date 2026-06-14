import { cn } from '@/lib/utils';
import { HTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

// ─── CARD ────────────────────────────────────────────────────────────────────

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── BADGE ───────────────────────────────────────────────────────────────────

type BadgeVariant = 'purple' | 'teal' | 'amber' | 'coral' | 'green' | 'gray' | 'red';

const badgeClasses: Record<BadgeVariant, string> = {
  purple: 'bg-brand-50 text-brand-600',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  coral: 'bg-orange-50 text-orange-700',
  green: 'bg-green-50 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-700',
};

export function Badge({
  variant = 'gray',
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        badgeClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── TEXTAREA ────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';

// ─── SELECT ──────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);

Select.displayName = 'Select';

// ─── DIVIDER ─────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-gray-100', className)} />;
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

const avatarColors = [
  'bg-brand-50 text-brand-600',
  'bg-teal-50 text-teal-700',
  'bg-amber-50 text-amber-700',
  'bg-orange-50 text-orange-700',
  'bg-green-50 text-green-700',
];

export function Avatar({ nome, size = 'md' }: { nome: string; size?: 'sm' | 'md' | 'lg' }) {
  const iniciais = nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  const color = avatarColors[nome.charCodeAt(0) % avatarColors.length];
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold flex-shrink-0',
        color,
        {
          'w-8 h-8 text-xs': size === 'sm',
          'w-10 h-10 text-sm': size === 'md',
          'w-12 h-12 text-base': size === 'lg',
        }
      )}
    >
      {iniciais}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Icon size={24} className="text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── LOADING SPINNER ─────────────────────────────────────────────────────────

export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

// ─── SECTION TITLE ───────────────────────────────────────────────────────────

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
      {children}
    </p>
  );
}
