
import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
    const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    const variants = {
        default: "bg-slate-900 text-slate-50 hover:bg-slate-900/80",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        outline: "text-slate-950 border border-slate-200 hover:bg-slate-100",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/80",
    };

    return (
        <div className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </div>
    );
}
