'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ShieldCheck, FilePenLine, ListOrdered, LayoutDashboard, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/report-incident', label: 'Report Incident', icon: FilePenLine },
  { href: '/track-report', label: 'Track Reports', icon: ListOrdered },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="border-b">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold">CyberSafe</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    'w-full justify-start',
                    pathname === item.href && 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                  )}
                >
                  <a>
                    <item.icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t p-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CyberSafe Initiative.
        </p>
         <a href="https://www.cybercrime.gov.in/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center mt-1">
            National Cyber Crime Reporting Portal <ExternalLink className="ml-1 h-3 w-3" />
          </a>
      </SidebarFooter>
    </>
  );
}
