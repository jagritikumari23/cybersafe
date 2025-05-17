'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold">CyberSafe</span>
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {/* Future additions: User avatar, settings dropdown */}
      </div>
    </header>
  );
}
