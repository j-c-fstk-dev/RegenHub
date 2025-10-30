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

  // This effect will run when the user state changes. We store the token
  // in a global variable for convenience, but a more robust solution might use
  // a state management library or context.
  useEffect(() => {
    const setAuthToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          // This is a simplified way to make the token available for API requests.
          (window as any).__FIREBASE_AUTH_TOKEN__ = token;
        } catch (error) {
          // It's possible for this to fail on network issues, we'll log it.
          console.error("Error getting auth token:", error);
        }
      } else {
        (window as any).__FIREBASE_AUTH_TOKEN__ = null;
      }
    };
    setAuthToken();
  }, [user]);

  // A custom fetch function that automatically adds the auth token.
  // We are NOT overriding the global fetch anymore.
  const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = (window as any).__FIREBASE_AUTH_TOKEN__;
    
    const headers = new Headers(init?.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (init) {
        init.headers = headers;
    } else {
        init = { headers };
    }

    return fetch(input, init);
  };
  
  // Expose the custom fetch function globally if needed by other client components
  // that don't want to import it.
  useEffect(() => {
    (window as any).fetchWithAuth = fetchWithAuth;
  }, []);


  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const navItems = [
    { name: 'Impact Wall', href: '/impact' },
    { name: 'LEAP para PMEs', href: '/leap'},
    { name: 'About', href: '/about' },
    { name: 'Developers', href: '/developers' },
    ...(user ? [{ name: 'Admin', href: '/admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Regen Impact</span>
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
            <Link href="/register">Submit Your Action</Link>
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
                  <span className="font-bold font-headline text-lg">Regen Impact</span>
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
                    <Link href="/register">Submit Your Action</Link>
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
