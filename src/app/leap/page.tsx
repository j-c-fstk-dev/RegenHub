'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Locate, Scale, CheckSquare, LineChart, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { startLeapAssessment } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

const leapSteps = [
    {
        icon: Locate,
        title: "L - Locate (Localizar)",
        description: "Mapeie onde seu negócio interage com a natureza, desde suas operações até a cadeia de suprimentos."
    },
    {
        icon: Scale,
        title: "E - Evaluate (Avaliar)",
        description: "Avalie suas dependências (o que a natureza fornece) e seus impactos (os efeitos do seu negócio)."
    },
    {
        icon: LineChart,
        title: "A - Assess (Analisar)",
        description: "Identifique riscos materiais (operacionais, regulatórios) e oportunidades (eficiência, novos mercados)."
    },
    {
        icon: CheckSquare,
        title: "P - Prepare (Preparar)",
        description: "Prepare-se para agir, definindo um plano de ação priorizado com metas, prazos e responsáveis."
    }
];

const LeapPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();

    const handleStartAssessment = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para iniciar uma avaliação.'});
            router.push('/login');
            return;
        }

        startTransition(async () => {
            const token = (window as any).__FIREBASE_AUTH_TOKEN__;
            if (!token) {
                 toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Sessão inválida. Por favor, faça login novamente.' });
                 router.push('/login');
                 return;
            }

            const result = await fetch('/api/leap/start', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json());
            
            if (result.success && result.assessmentId) {
                toast({ title: 'Avaliação Iniciada!', description: 'Você foi redirecionado para a primeira etapa.' });
                router.push(`/leap/assessment/${result.assessmentId}/l`);
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Não foi possível iniciar a avaliação.' });
                if (result.error?.includes('expirou')) {
                    router.push('/login');
                }
            }
        });
    };

    return (
        <div className="container py-12">
            <header className="mb-12 text-center">
                <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
                    <BrainCircuit className="h-10 w-10 text-primary"/>
                </div>
                <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
                    Módulo LEAP para PMEs
                </h1>
                <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
                    Uma ferramenta guiada para transformar a maneira como sua empresa entende e responde aos seus impactos e dependências da natureza.
                </p>
                 <Button size="lg" className="mt-8" onClick={handleStartAssessment} disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Iniciar Avaliação LEAP'}
                </Button>
            </header>

            <div className="max-w-5xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">O que é o Método LEAP?</CardTitle>
                        <CardDescription>
                            Adaptado da Força-Tarefa para Divulgações Financeiras Relacionadas à Natureza (TNFD), o LEAP é um processo de avaliação que ajuda organizações a identificar e gerenciar seus riscos e oportunidades ambientais.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                       {leapSteps.map(step => (
                           <div key={step.title} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                               <div className="flex-shrink-0 text-accent">
                                   <step.icon className="h-8 w-8"/>
                               </div>
                               <div>
                                   <h3 className="font-semibold text-lg">{step.title}</h3>
                                   <p className="text-sm text-muted-foreground">{step.description}</p>
                               </div>
                           </div>
                       ))}
                    </CardContent>
                </Card>

                 <div className="mt-12 text-center">
                    <h3 className="font-headline text-2xl font-bold text-primary">Pronto para o Próximo Passo?</h3>
                    <p className="mt-2 text-muted-foreground">Em menos de 90 minutos, você pode gerar seu primeiro Relatório de Inteligência da Natureza.</p>
                     <Button asChild size="lg" variant="outline" className="mt-6">
                        <Link href="#"><FileText className="mr-2 h-4 w-4"/> Ver Exemplo de Relatório</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LeapPage;
