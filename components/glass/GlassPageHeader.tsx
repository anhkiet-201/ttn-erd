'use client';

import React from 'react';

interface GlassPageHeaderProps {
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
}

export default function GlassPageHeader({ title, subtitle, action }: GlassPageHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 md:mb-10">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-8 md:w-2.5 md:h-10 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-full" />
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight uppercase line-clamp-1">{title}</h2>
                </div>
                {subtitle && (
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 font-bold bg-white/50 w-fit px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white shadow-sm ml-4 md:ml-5">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {subtitle}
                    </div>
                )}
            </div>
            {action && (
                <button 
                    onClick={action.onClick}
                    className="w-full lg:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95 group min-w-[auto] lg:min-w-[200px]"
                >
                    {action.icon || (
                        <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    )}
                    <span className="text-sm md:text-base">{action.label.toUpperCase()}</span>
                </button>
            )}
        </div>
    );
}
