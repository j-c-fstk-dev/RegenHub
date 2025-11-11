
'use client';

import Link from 'next/link';
import { Sprout, LogOut, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Header = () => {
  const { auth } = useFirebase();
  const { user } = useUser();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/');
    }
  };

  const navItems = [
    { name: 'Impact Wall', href: '/impact' },
    { name: 'Regen Passport', href: '/regen-passport' },
    { name: 'LEAP for SMEs', href: '/leap'},
    { name: 'About', href: '/about' },
    { name: 'Developers', href: '/developers' },
    { name: 'Contact', href: '/contact' },
  ];

  // Conditionally show Admin link only for the specific admin user.
  const isAdmin = user?.email === 'dev.jorge.c@gmail.com';


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
           {user && (
            <>
              <Link href="/dashboard" className="font-medium text-foreground/60 transition-colors hover:text-foreground/80">
                Dashboard
              </Link>
               {isAdmin && (
                  <Link href="/admin" className="font-medium text-foreground/60 transition-colors hover:text-foreground/80">
                    Admin
                  </Link>
               )}
            </>
          )}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isClient && (
            <>
              {user ? (
                 <Button variant="ghost" size="icon" onClick={handleSignOut} disabled={!auth} title="Sign Out">
                    <LogOut className="h-5 w-5" />
                 </Button>
              ) : (
                <Button asChild variant="ghost" size="icon" title="Login">
                    <Link href="/login">
                        <UserIcon className="h-5 w-5" />
                    </Link>
                </Button>
              )}
            </>
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
                  {user && (
                     <Link
                      href="/dashboard"
                      className="text-lg font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      Dashboard
                    </Link>
                  )}
                  {isAdmin && (
                     <Link
                      href="/admin"
                      className="text-lg font-medium text-foreground/80 transition-colors hover:text-primary"
                    >
                      Admin
                    </Link>
                  )}
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
