
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, DownloadCloud, HardDrive, WifiOff } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';

const KernelFeature = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);

const KernelPage = () => {
    return (
        <div className="container py-12">
            <header className="mb-12 text-center">
                <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
                    <HardDrive className="h-10 w-10 text-primary"/>
                </div>
                <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                    RegenKernel
                </h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                    Your sovereign, offline-first tool for capturing and verifying regenerative actions directly from the field.
                </p>
                 <Button size="lg" className="mt-8" asChild>
                    {/* This link will eventually be replaced by a PWA installation prompt */}
                    <Link href="/work-in-progress">
                        <DownloadCloud className="mr-2 h-5 w-5"/>
                        Launch & Install Kernel
                    </Link>
                </Button>
            </header>

            <div className="mx-auto max-w-5xl space-y-16">
                 <Card className="overflow-hidden">
                    <div className="grid md:grid-cols-2 items-center">
                         <div className="p-8 space-y-4">
                            <h2 className="font-headline text-3xl font-bold text-primary">Capture Impact, Anywhere.</h2>
                            <p className="text-muted-foreground">RegenKernel solves the "last mile" problem. It's a lightweight, installable web application (PWA) that works even without an internet connection, allowing you to record actions with verifiable proof, right where they happen.</p>
                        </div>
                        <div className="relative h-64 md:h-full">
                             <Image 
                                src="https://images.unsplash.com/photo-1589793463342-32a7e4cf3b3c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                alt="A person using a tablet in a rural field"
                                fill
                                className="object-cover"
                                data-ai-hint="tablet field"
                             />
                        </div>
                    </div>
                </Card>

                <div className="grid md:grid-cols-3 gap-8">
                    <KernelFeature 
                        icon={WifiOff}
                        title="Offline-First"
                        description="Create and edit actions, attach media, and generate proofs entirely without an internet connection. Your data stays on your device."
                    />
                    <KernelFeature 
                        icon={CheckCircle}
                        title="Verifiable Proofs"
                        description="Every action is cryptographically hashed and signed locally, creating a tamper-proof ledger that proves the integrity of your data."
                    />
                    <KernelFeature 
                        icon={DownloadCloud}
                        title="Sovereign Sync"
                        description="When you're back online, sync your verified data bundles to the RegenHub platform with a single click to get them validated."
                    />
                </div>
                 <div className="text-center">
                    <h2 className="font-headline text-3xl font-bold text-primary">Ready to Get Started?</h2>
                    <p className="mt-2 text-muted-foreground">Install the Kernel on your device to begin your journey of sovereign impact verification.</p>
                     <Button size="lg" className="mt-6" asChild>
                        <Link href="/work-in-progress">
                            <DownloadCloud className="mr-2 h-5 w-5"/>
                            Launch & Install Kernel
                        </Link>
                    </Button>
                 </div>
            </div>
        </div>
    );
};

export default KernelPage;
