'use client';

import React from 'react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useUI } from '@/components/providers/UIProvider';

interface GlassHeaderProps {
    searchQuery?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
}

export default function GlassHeader({ 
    searchQuery, 
    onSearchChange, 
    searchPlaceholder = "Tìm kiếm..." 
}: GlassHeaderProps) {
    const { user } = useAuthContext();
    const { toggleSidebar } = useUI();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 h-20 flex items-center px-6 gap-6 shadow-sm">
            <div className="flex items-center gap-4 flex-shrink-0">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2.5 hover:bg-blue-50 rounded-2xl text-gray-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm border border-transparent hover:border-blue-100"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 rotation-12">
                        <span className="font-black text-xl">E</span>
                    </div>
                    <div className="hidden sm:flex flex-col -gap-1">
                        <span className="text-xl font-black text-gray-800 tracking-tighter">ERD</span>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Management</span>
                    </div>
                </div>
            </div>

            {onSearchChange && (
                <div className="flex-1 max-w-2xl mx-auto">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            className="block w-full h-12 bg-gray-100/50 border-2 border-transparent rounded-2xl pl-12 pr-4 focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm font-bold text-gray-700 placeholder:text-gray-400 shadow-inner"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 ml-auto">
                <div className="hidden lg:flex flex-col items-end">
                    <span className="text-xs font-black text-gray-900 leading-none">{user?.displayName || 'User'}</span>
                    <span className="text-[10px] font-bold text-gray-400">{user?.email || 'Admin'}</span>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black shadow-sm ring-2 ring-white">
                    {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                </div>
            </div>
        </header>
    );
}
