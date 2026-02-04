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
            <div className="flex pt-20">
                <Sidebar />
                <main className="flex-1 ml-0 md:ml-20 lg:ml-72 p-6 md:p-10">
                    <div className={`${maxWidth} mx-auto`}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
