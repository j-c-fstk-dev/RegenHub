
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

const AssessPage = ({ params }: { params: { assessmentId: string } }) => {
    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Etapa 3 de 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <LineChart className="h-8 w-8" />
                    A - Analisar (Assess)
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Com base nas suas dependências e impactos, vamos identificar os riscos e as oportunidades para o seu negócio.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Análise de Riscos e Oportunidades</CardTitle>
                    <CardDescription>
                        Esta é uma página de espaço reservado para a Etapa 'A'. O conteúdo real do formulário será adicionado aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full border-2 border-dashed rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Formulário da Etapa de Análise em breve...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AssessPage;
