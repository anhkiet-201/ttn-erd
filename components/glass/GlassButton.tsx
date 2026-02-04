'use client';

import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
    icon?: React.ReactNode;
}

export default function GlassButton({ 
    children, 
    variant = 'primary', 
    icon, 
    className = '', 
    ...props 
}: GlassButtonProps) {
    const variants = {
        primary: 'bg-gray-900 text-white hover:bg-blue-600 shadow-xl shadow-gray-200 hover:shadow-blue-200',
        secondary: 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50 shadow-sm',
        ghost: 'bg-transparent text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-100',
        danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100',
        success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100',
    };

    return (
        <button 
            className={`
                inline-flex items-center justify-center gap-2 
                px-6 py-3 rounded-2xl font-black 
                transition-all duration-300 active:scale-95 group
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]} 
                ${className}
            `}
            {...props}
        >
            {icon && <span className="w-5 h-5 flex items-center justify-center group-hover:rotate-12 transition-transform">{icon}</span>}
            <span className="truncate">{children}</span>
        </button>
    );
}
