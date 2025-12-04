/**
 * FinCalc Pro - Dashboard Layout with Authentication
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Menu, X, Users, TrendingUp, Chrome as Home, FileText, Settings, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { AccountCenterDrawer } from '@/components/account-center';

const navigation = [
  { name: 'Client Information', href: '/client-information', icon: Users },
  { name: 'Current Financial Position', href: '/financial-position', icon: Calculator },
  { name: 'Financial Projections', href: '/projections', icon: TrendingUp },
  { name: 'Investment Properties', href: '/investment-properties', icon: Home },
  { name: 'Tax Optimization', href: '/tax-optimization', icon: FileText },
  { name: 'Summary & Export', href: '/summary', icon: FileText },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountCenterOpen, setAccountCenterOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex flex-col h-full">
            <div className="flex items-center px-6 py-4 border-b border-border bg-card">
              <div className="bg-accent px-2 py-1 mr-2">
                <span className="text-lg font-bold text-black">PWP</span>
              </div>
              <span className="text-lg font-bold text-white">Perpetual Wealth Partners</span>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:bg-accent/10 hover:text-accent"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card">
        <div className="flex flex-col flex-grow pt-5 bg-card border-r border-border overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="bg-accent px-2 py-1 mr-2">
              <span className="text-lg font-bold text-accent-foreground">PWP</span>
            </div>
            <span className="text-lg font-bold text-accent">Perpetual Wealth Partners</span>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted hover:text-accent transition-colors"
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-border p-4">
            <div className="flex items-center">
              <div className="h-9 w-9 bg-accent rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-accent-foreground">
                  {(user?.name ?? "Demo User").split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">{user?.name ?? "Demo User"}</p>
                <Badge variant="secondary" className="text-xs">
                  {user?.role ?? "Admin"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-background border-b border-border">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-4 border-r border-border text-muted-foreground md:hidden hover:text-accent"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1" />
            
            <div className="ml-4 flex items-center md:ml-6 space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Account Center */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAccountCenterOpen(true)}
                className="relative text-white hover:text-accent"
              >
                <Users className="h-5 w-5" />
                <span className="sr-only">Account Center</span>
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative text-muted-foreground hover:text-accent">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-white">{user?.name ?? "Demo User"}</p>
                    <p className="text-xs text-gray-400">{user?.email ?? "demo@example.com"}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>

      {/* Account Center Drawer */}
      <AccountCenterDrawer 
        open={accountCenterOpen}
        onOpenChange={setAccountCenterOpen}
      />
    </div>
  );
}