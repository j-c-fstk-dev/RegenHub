
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const PreparePage = ({ params }: { params: { assessmentId: string } }) => {
    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Etapa 4 de 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <CheckSquare className="h-8 w-8" />
                    P - Preparar (Prepare)
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Com base na análise de riscos e oportunidades, vamos criar um plano de ação concreto.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Plano de Ação</CardTitle>
                    <CardDescription>
                        Esta é uma página de espaço reservado para a Etapa 'P'. O conteúdo real do formulário será adicionado aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full border-2 border-dashed rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Formulário da Etapa de Preparação em breve...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default PreparePage;
