'use client';

import React from 'react';

// Input
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

export function GlassInput({ icon, className = '', ...props }: GlassInputProps) {
    return (
        <div className="relative group">
            {icon && (
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    {icon}
                </div>
            )}
            <input 
                className={`
                    block w-full h-12 
                    bg-gray-100/50 border-2 border-transparent rounded-2xl 
                    ${icon ? 'pl-11' : 'px-4'} pr-4 
                    focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 
                    transition-all text-sm font-bold text-gray-700 placeholder:text-gray-400 shadow-inner
                    ${className}
                `}
                {...props}
            />
        </div>
    );
}

// Select
interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export function GlassSelect({ label, children, className = '', ...props }: GlassSelectProps) {
    return (
        <select 
            className={`
                bg-gray-100/50 border-0 text-gray-700 text-xs font-black rounded-2xl 
                focus:ring-4 focus:ring-blue-500/10 block p-3 pr-10 
                transition-all hover:bg-gray-100 appearance-none cursor-pointer
                ${className}
            `}
            {...props}
        >
            {label && <option disabled value="">{label.toUpperCase()}</option>}
            {children}
        </select>
    );
}

// Filter Bar
export function GlassFilterBar({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`
            bg-white/60 backdrop-blur-xl p-5 
            rounded-[32px] shadow-sm border border-white/50 mb-10 
            flex flex-wrap items-center gap-6
            ${className}
        `}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4.5h18m-18 5h18m-18 5h18m-18 5h18" />
                    </svg>
                </div>
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Bộ lọc</span>
            </div>
            <div className="h-10 w-[2px] bg-gray-100 hidden md:block" />
            <div className="flex flex-wrap items-center gap-4 flex-1">
                {children}
            </div>
        </div>
    );
}
