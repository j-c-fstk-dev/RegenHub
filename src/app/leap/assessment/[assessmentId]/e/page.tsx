
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

const EvaluatePage = ({ params }: { params: { assessmentId: string } }) => {
    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Etapa 2 de 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <Scale className="h-8 w-8" />
                    E - Avaliar (Evaluate)
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Agora, vamos qualificar e quantificar suas dependências (o que a natureza fornece ao seu negócio) e seus impactos (os efeitos do seu negócio na natureza).
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Avaliação de Dependências e Impactos</CardTitle>
                    <CardDescription>
                        Esta é uma página de espaço reservado para a Etapa 'E'. O conteúdo real do formulário será adicionado aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full border-2 border-dashed rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Formulário da Etapa de Avaliação em breve...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default EvaluatePage;
