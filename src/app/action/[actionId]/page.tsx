'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Award, Building, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';

// Mock types until we define them properly
type ActionDetails = {
    id: string;
    title: string;
    description: string;
    status: string;
    validationScore: number;
    aiVerification?: {
        summary: string;
        finalScore: number;
        notes?: string;
    };
    org: {
        name: string;
        slug: string;
    };
};

const ActionDetailPage = ({ params }: { params: { actionId: string } }) => {
    const { actionId } = params;
    const [action, setAction] = useState<ActionDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAction = async () => {
            if (!actionId) {
                setError("Action ID is missing.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch(`/api/action/${actionId}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        notFound();
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch action details.');
                }
                const data = await response.json();
                setAction(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAction();
    }, [actionId]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-12">
                <Card className="max-w-2xl mx-auto border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle /> Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!action) {
        return notFound();
    }

    const isVerified = action.status === 'verified';

    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden">
                    <CardHeader className="bg-secondary/50 p-6">
                        <Badge variant={isVerified ? "default" : "destructive"} className="w-fit">
                            {isVerified ? (
                                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Verificado</span>
                            ) : (
                                <span>Não Verificado</span>
                            )}
                        </Badge>
                        <CardTitle className="font-headline text-3xl mt-2">{action.title}</CardTitle>
                        <CardDescription>Certificado de Impacto Regenerativo</CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                               <h3 className="font-semibold text-lg border-b pb-2">Detalhes da Ação</h3>
                               <p className="text-muted-foreground">{action.description}</p>
                                <div className="pt-4">
                                     <h4 className="font-semibold text-md flex items-center gap-2 text-primary"><Building className="h-5 w-5"/> Realizado por</h4>
                                      <Button variant="link" asChild className="px-0 h-auto text-lg">
                                        <Link href={`/org/${action.org.slug}`}>{action.org.name}</Link>
                                      </Button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Card className="bg-accent/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2"><Award className="text-accent"/> Pontuação Final</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-5xl font-bold text-primary">{action.validationScore}</p>
                                        <p className="text-xs text-muted-foreground">Pontuação atribuída pelo validador humano.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                         {action.aiVerification && (
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/> Análise da IA</h3>
                                <div className="p-4 rounded-md bg-secondary space-y-3 text-sm">
                                    <div>
                                        <strong className="text-muted-foreground">Sumário:</strong>
                                        <p>{action.aiVerification.summary}</p>
                                    </div>
                                    <div>
                                        <strong className="text-muted-foreground">Notas da Análise:</strong>
                                        <p>{action.aiVerification.notes || 'Nenhuma nota adicional.'}</p>
                                    </div>
                                    <div>
                                        <strong className="text-muted-foreground">Pontuação Sugerida pela IA:</strong>
                                        <p className="font-bold">{action.aiVerification.finalScore}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-secondary/50 p-4 flex justify-end">
                        <Button variant="outline">Compartilhar Certificado</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ActionDetailPage;
