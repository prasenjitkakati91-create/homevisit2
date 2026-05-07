import React from 'react';
import { cn } from '../../utils/helpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
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
    primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-md shadow-slate-200/50 dark:shadow-none',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-100',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-colors',
  };

  const sizes = {
    sm: 'px-3.5 py-2 text-[11px] uppercase tracking-wider',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 cursor-pointer',
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
      'bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-sm medical-shadow',
      onClick && 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.99]',
      className
    )}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'info' | 'neutral'; className?: string }> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    neutral: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>}
    <input
      className={cn(
        'w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-hidden focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium placeholder:text-slate-300',
        className
      )}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { label: string; value: string }[] }> = ({ label, options, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>}
    <div className="relative">
      <select
        className={cn(
          'w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-hidden focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium appearance-none',
          className
        )}
        {...props}
      >
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </div>
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{label}</label>}
    <textarea
      className={cn(
        'w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-hidden focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-medium min-h-[120px] placeholder:text-slate-300',
        className
      )}
      {...props}
    />
  </div>
);
