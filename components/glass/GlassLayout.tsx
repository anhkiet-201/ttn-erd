'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import GlassHeader from './GlassHeader';

interface GlassLayoutProps {
    children: React.ReactNode;
    searchQuery?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    maxWidth?: string;
}

export default function GlassLayout({ 
    children, 
    searchQuery, 
    onSearchChange, 
    searchPlaceholder,
    maxWidth = "max-w-[1500px]"
}: GlassLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50/30">
            <GlassHeader 
                searchQuery={searchQuery} 
                onSearchChange={onSearchChange} 
                searchPlaceholder={searchPlaceholder} 
            />
            <div className="flex pt-16 md:pt-20">
                <Sidebar />
                <main className="flex-1 transition-all duration-300 ease-out ml-0 md:ml-[72px] lg:ml-72 p-4 md:p-10 w-full overflow-x-hidden">
                    <div className={`${maxWidth} mx-auto fade-in`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
