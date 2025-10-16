import { Sprout } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            <div className="text-center text-sm text-muted-foreground md:text-left">
              <p>Built by BeRegen & Monthly Earth Day.</p>
              <p>Open-source, community-led, regeneratively aligned.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/impact" className="transition-colors hover:text-foreground">
              Impact
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Partner With Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
