
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locate } from "lucide-react";

const LocatePage = ({ params }: { params: { assessmentId: string } }) => {
    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Etapa 1 de 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <Locate className="h-8 w-8" />
                    L - Localizar (Locate)
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Vamos começar mapeando onde seu negócio interage com a natureza. Pense em suas operações diretas e nos pontos mais importantes da sua cadeia de suprimentos.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Mapeamento de Interações</CardTitle>
                    <CardDescription>
                        Esta é uma página de espaço reservado para a Etapa 'L'. O conteúdo real do formulário será adicionado aqui.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 w-full border-2 border-dashed rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Formulário da Etapa de Localização em breve...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default LocatePage;
