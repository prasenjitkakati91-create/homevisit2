import React from 'react';
import { cn } from '../../utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className, 
  disabled, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-[0_10px_20px_-10px_rgba(15,23,42,0.3)]',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)]',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-colors',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[11px] uppercase tracking-wider',
    md: 'px-6 py-3.5 text-sm',
    lg: 'px-8 py-5 text-base',
    icon: 'p-3',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-[1.25rem] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white border border-slate-100 rounded-[2.5rem] p-6 premium-shadow',
      onClick && 'cursor-pointer hover:premium-shadow-hover hover:border-blue-200/50 transition-all active:scale-[0.99]',
      className
    )}
  >
    {children}
  </div>
);

export const GlassCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void 
}> = ({ children, className, onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      'bg-white/60 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-6 shadow-[0_8px_32px_rgba(15,23,42,0.05)]',
      onClick && 'cursor-pointer hover:bg-white/80 transition-all active:scale-[0.99]',
      className
    )}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'info' | 'neutral'; className?: string }> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
    warning: 'bg-amber-50 text-amber-600 border-amber-100/50',
    info: 'bg-blue-50 text-blue-600 border-blue-100/50',
    neutral: 'bg-slate-100/80 text-slate-500 border-slate-200/50',
  };
  return (
    <span className={cn('px-3.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-2">{label}</label>}
    <input
      className={cn(
        'w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-hidden focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all text-sm font-medium placeholder:text-slate-300',
        className
      )}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { label: string; value: string }[] }> = ({ label, options, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-2">{label}</label>}
    <div className="relative">
      <select
        className={cn(
          'w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-hidden focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all text-sm font-medium appearance-none',
          className
        )}
        {...props}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-2">{label}</label>}
    <textarea
      className={cn(
        'w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-hidden focus:border-blue-400 focus:ring-4 focus:ring-blue-400/5 transition-all text-sm font-medium min-h-[140px] placeholder:text-slate-300',
        className
      )}
      {...props}
    />
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-slate-100 animate-pulse rounded-2xl', className)} />
);

