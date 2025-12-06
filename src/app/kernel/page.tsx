
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DownloadCloud, Rocket, Sprout } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const KernelLandingPage = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setInstallPrompt(event);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
        } else {
            // Fallback for browsers that don't support the install prompt
            alert("Para instalar, use a opção 'Adicionar à Tela de Início' ou 'Instalar App' no menu do seu navegador.");
        }
    };

    return (
        <div className="container py-12">
            <header className="mb-12 text-center">
                <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
                    <Sprout className="h-10 w-10 text-primary"/>
                </div>
                <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                    RegenKernel
                </h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                    Sua ferramenta soberana para registrar impacto regenerativo, online ou offline.
                </p>
            </header>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                           <Rocket className="h-8 w-8 text-primary"/>
                           <CardTitle className="font-headline text-2xl">Lançar a Aplicação</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardDescription>
                            Acesse o dashboard do Kernel para registrar novas ações, ver suas atividades salvas localmente e sincronizar com o RegenImpactHub quando estiver online.
                        </CardDescription>
                    </CardContent>
                    <CardFooter>
                         <Button asChild size="lg" className="w-full">
                            <Link href="/kernel/app">Acessar o Kernel</Link>
                        </Button>
                    </CardFooter>
                </Card>
                 <Card className="flex flex-col">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                           <DownloadCloud className="h-8 w-8 text-primary"/>
                           <CardTitle className="font-headline text-2xl">Instalar o PWA</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <CardDescription>
                           Instale o RegenKernel no seu celular ou computador para acesso rápido e uma experiência de aplicativo nativa, mesmo sem internet.
                        </CardDescription>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleInstallClick} size="lg" variant="secondary" className="w-full" disabled={!installPrompt}>
                            Instalar no Dispositivo
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default KernelLandingPage;

