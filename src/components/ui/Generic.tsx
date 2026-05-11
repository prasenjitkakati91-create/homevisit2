import React from 'react';
import { cn } from '../../utils/helpers';
import { motion } from 'motion/react';

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
    primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.5)] border border-slate-800',
    secondary: 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)] hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.6)] border border-blue-500/50',
    outline: 'bg-white/50 backdrop-blur-md border border-slate-200/60 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-colors shadow-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[11px] uppercase tracking-wider',
    md: 'px-6 py-3.5 text-sm',
    lg: 'px-8 py-5 text-base',
    icon: 'p-3',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-2xl transition-all disabled:opacity-50 cursor-pointer overflow-hidden relative',
        variants[variant],
        sizes[size],
        className
      )}
      {...props as any}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}
      {children}
      {variant === 'secondary' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      )}
    </motion.button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => {
  const CardComponent = onClick ? motion.div : "div";
  return (
    <CardComponent 
      onClick={onClick}
      {...(onClick ? { whileTap: { scale: 0.98 } } : {})}
      className={cn(
        'bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        onClick && 'cursor-pointer hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)] hover:border-blue-200/50 transition-shadow',
        className
      )}
    >
      {children}
    </CardComponent>
  );
};

export const GlassCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void 
}> = ({ children, className, onClick }) => {
  const CardComponent = onClick ? motion.div : "div";
  return (
    <CardComponent 
      onClick={onClick}
      {...(onClick ? { whileTap: { scale: 0.98 } } : {})}
      className={cn(
        'bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)] relative overflow-hidden',
        onClick && 'cursor-pointer hover:bg-white/50 transition-colors',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </CardComponent>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'info' | 'neutral'; className?: string }> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-emerald-50/80 backdrop-blur-md text-emerald-600 border-emerald-200/50 shadow-[0_2px_10px_rgba(16,185,129,0.1)]',
    warning: 'bg-amber-50/80 backdrop-blur-md text-amber-600 border-amber-200/50 shadow-[0_2px_10px_rgba(245,158,11,0.1)]',
    info: 'bg-blue-50/80 backdrop-blur-md text-blue-600 border-blue-200/50 shadow-[0_2px_10px_rgba(59,130,246,0.1)]',
    neutral: 'bg-slate-100/60 backdrop-blur-md text-slate-500 border-slate-200/50 shadow-[0_2px_10px_rgba(148,163,184,0.1)]',
  };
  return (
    <span className={cn('px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <input
      className={cn(
        'w-full px-5 py-4 bg-white/50 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-hidden focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all text-sm font-medium placeholder:text-slate-400',
        className
      )}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { label: string; value: string }[] }> = ({ label, options, className, ...props }) => (
  <div className="space-y-2 w-full">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <div className="relative">
      <select
        className={cn(
          'w-full px-5 py-4 bg-white/50 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-hidden focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all text-sm font-medium appearance-none',
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
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>}
    <textarea
      className={cn(
        'w-full px-5 py-4 bg-white/50 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-hidden focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all text-sm font-medium min-h-[140px] placeholder:text-slate-400',
        className
      )}
      {...props}
    />
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('skeleton rounded-2xl', className)} />
);

