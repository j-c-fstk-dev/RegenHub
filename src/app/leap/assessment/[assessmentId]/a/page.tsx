'use client';

import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Loader2, ArrowRight, PlusCircle, Trash2, ShieldAlert, BadgeInfo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveLeapA } from '../../actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const riskSchema = z.object({
  theme: z.string().nonempty({ message: 'Tema é obrigatório.' }),
  probability: z.coerce.number().min(1).max(5),
  severity: z.coerce.number().min(1).max(5),
  notes: z.string().optional(),
});

const opportunitySchema = z.object({
  theme: z.string().nonempty({ message: 'Tema é obrigatório.' }),
  rationale: z.string().optional(),
  ease: z.coerce.number().min(1).max(3),
  payoff: z.coerce.number().min(1).max(3),
});

const formSchema = z.object({
  risks: z.array(riskSchema).optional(),
  opportunities: z.array(opportunitySchema).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const RadioGroupRating = ({ field, labels }: { field: any, labels: string[] }) => (
    <FormControl>
        <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value}
            className="flex items-center space-x-2"
        >
            {labels.map((label, index) => (
                <FormItem key={index} className="flex flex-col items-center space-y-1">
                    <FormControl>
                        <RadioGroupItem value={String(index + 1)} id={`${field.name}-${index}`}/>
                    </FormControl>
                    <Label htmlFor={`${field.name}-${index}`} className="text-xs">{label}</Label>
                </FormItem>
            ))}
        </RadioGroup>
    </FormControl>
);


const AssessPage = ({ params }: { params: { assessmentId: string } }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            risks: [{ theme: 'Água', probability: 3, severity: 3, notes: '' }],
            opportunities: [{ theme: 'Eficiência Energética', rationale: '', ease: 2, payoff: 2 }],
        },
    });

    const { fields: riskFields, append: appendRisk, remove: removeRisk } = useFieldArray({
        control: form.control, name: 'risks'
    });
     const { fields: opportunityFields, append: appendOpportunity, remove: removeOpportunity } = useFieldArray({
        control: form.control, name: 'opportunities'
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await saveLeapA(params.assessmentId, {
                risks: values.risks || [],
                opportunities: values.opportunities || [],
            });
            if (result.success) {
                toast({ title: 'Etapa 3 Salva!', description: 'Análise de riscos e oportunidades salva.' });
                router.push(`/leap/assessment/${params.assessmentId}/p`);
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Não foi possível salvar os dados.' });
            }
        });
    };

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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Análise de Riscos e Oportunidades</CardTitle>
                            <CardDescription>
                                Adicione os principais riscos e oportunidades que você identifica para seu negócio relacionados à natureza.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            {/* Risks Section */}
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="flex items-center gap-2 -ml-1 px-1 text-lg font-medium font-headline"><ShieldAlert className="h-5 w-5 text-destructive" /> Riscos</legend>
                                {riskFields.map((field, index) => (
                                    <div key={field.id} className="p-4 rounded-md bg-secondary/50 space-y-4 relative">
                                        <FormField control={form.control} name={`risks.${index}.theme`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tema do Risco</FormLabel>
                                                <FormControl><Input placeholder="Ex: Escassez de água, Regulação ambiental" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <FormField control={form.control} name={`risks.${index}.probability`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Probabilidade</FormLabel>
                                                    <RadioGroupRating field={field} labels={['1', '2', '3', '4', '5']} />
                                                    <FormDescription className="text-xs">1: Muito Baixa, 5: Muito Alta</FormDescription>
                                                </FormItem>
                                            )}/>
                                             <FormField control={form.control} name={`risks.${index}.severity`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Severidade do Impacto</FormLabel>
                                                    <RadioGroupRating field={field} labels={['1', '2', '3', '4', '5']} />
                                                     <FormDescription className="text-xs">1: Muito Baixa, 5: Muito Alta</FormDescription>
                                                </FormItem>
                                            )}/>
                                        </div>
                                         <FormField control={form.control} name={`risks.${index}.notes`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notas</FormLabel>
                                                <FormControl><Textarea placeholder="Descreva o risco e por que ele é relevante." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeRisk(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendRisk({ theme: '', probability: 3, severity: 3, notes: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Risco
                                </Button>
                            </fieldset>

                             {/* Opportunities Section */}
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="flex items-center gap-2 -ml-1 px-1 text-lg font-medium font-headline"><BadgeInfo className="h-5 w-5 text-primary" /> Oportunidades</legend>
                                {opportunityFields.map((field, index) => (
                                    <div key={field.id} className="p-4 rounded-md bg-secondary/50 space-y-4 relative">
                                        <FormField control={form.control} name={`opportunities.${index}.theme`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tema da Oportunidade</FormLabel>
                                                <FormControl><Input placeholder="Ex: Eficiência hídrica, Novo produto sustentável" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <FormField control={form.control} name={`opportunities.${index}.ease`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Facilidade de Implementação</FormLabel>
                                                    <RadioGroupRating field={field} labels={['Fácil', 'Médio', 'Difícil']} />
                                                </FormItem>
                                            )}/>
                                             <FormField control={form.control} name={`opportunities.${index}.payoff`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Retorno Potencial</FormLabel>
                                                    <RadioGroupRating field={field} labels={['Baixo', 'Médio', 'Alto']} />
                                                </FormItem>
                                            )}/>
                                        </div>
                                         <FormField control={form.control} name={`opportunities.${index}.rationale`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Justificativa</FormLabel>
                                                <FormControl><Textarea placeholder="Descreva a oportunidade e o valor que ela pode gerar." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeOpportunity(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendOpportunity({ theme: '', rationale: '', ease: 2, payoff: 2 })}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Oportunidade
                                </Button>
                            </fieldset>
                        
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar e Ir para a Próxima Etapa <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

export default AssessPage;
