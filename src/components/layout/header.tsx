'use client';

import Link from 'next/link';
import { Sprout, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Header = () => {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    const setAuthToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          // This is a simplified way to make the token available for API requests.
          // In a real app, you'd likely use a request interceptor (e.g., with axios)
          // to automatically add this header to all outgoing API calls.
          (window as any).__FIREBASE_AUTH_TOKEN__ = token;
        } catch (error) {
          console.error("Error getting auth token:", error);
        }
      }
    };
    setAuthToken();
  }, [user]);

  // Add an interceptor to the global fetch
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const token = (window as any).__FIREBASE_AUTH_TOKEN__;
        
        // Only attach the token to our own API routes
        const url = typeof input === 'string' ? input : input.url;
        if (token && url.startsWith('/api/')) {
            if (!init) {
                init = {};
            }
            if (!init.headers) {
                init.headers = {};
            }
            (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    (window as any).__FIREBASE_AUTH_TOKEN__ = null;
    router.push('/');
  };

  const navItems = [
    { name: 'Impact Wall', href: '/impact' },
    { name: 'About', href: '/about' },
    { name: 'Developers', href: '/developers' },
    ...(user ? [{ name: 'Admin', href: '/admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Regen Hub</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="font-medium text-foreground/60 transition-colors hover:text-foreground/80"
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
             <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
             </Button>
          ) : (
            <Button asChild variant="ghost" size="icon">
                <Link href="/login">
                    <UserIcon className="h-5 w-5" />
                </Link>
            </Button>
          )}
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Submit Your Intent</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex flex-col gap-6 pt-10">
                <Link href="/" className="flex items-center space-x-2">
                  <Sprout className="h-6 w-6 text-primary" />
                  <span className="font-bold font-headline text-lg">Regen Hub</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-lg font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                 <Button asChild size="lg">
                    <Link href="/register">Submit Your Intent</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
