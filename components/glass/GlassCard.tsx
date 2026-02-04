'use client';

import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}

export default function GlassCard({ children, className = '', noPadding = false }: GlassCardProps) {
    return (
        <div className={`
            bg-white/80 backdrop-blur-xl 
            rounded-[32px] md:rounded-[40px] 
            shadow-xl shadow-blue-900/5 
            border border-white/50 
            overflow-hidden
            ${noPadding ? '' : 'p-6 md:p-8'}
            ${className}
        `}>
            {children}
        </div>
    );
}
