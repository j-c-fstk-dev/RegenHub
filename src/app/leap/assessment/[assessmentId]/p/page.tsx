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
import { CheckSquare, Loader2, PartyPopper, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveLeapP } from '../../actions';
import Link from 'next/link';

const planItemSchema = z.object({
  action: z.string().nonempty({ message: 'Ação é obrigatória.' }),
  owner: z.string().nonempty({ message: 'Responsável é obrigatório.' }),
  deadline: z.string().nonempty({ message: 'Prazo é obrigatório.' }),
  cost: z.coerce.number().optional(),
  kpi: z.string().optional(),
});

const formSchema = z.object({
  plan: z.array(planItemSchema).min(1, 'Adicione pelo menos uma ação ao plano.'),
});

type FormValues = z.infer<typeof formSchema>;

const PreparePage = ({ params }: { params: { assessmentId: string } }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isDone, setIsDone] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            plan: [{ action: '', owner: '', deadline: '', cost: 0, kpi: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control, name: 'plan'
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await saveLeapP(params.assessmentId, values);
            if (result.success) {
                toast({ title: 'Avaliação Concluída!', description: 'Seu plano de ação foi salvo.' });
                setIsDone(true);
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Não foi possível salvar o plano.' });
            }
        });
    };

    if (isDone) {
        return (
             <div className="container py-12 flex items-center justify-center">
                <Card className="max-w-2xl text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                           <PartyPopper className="h-8 w-8" />
                        </div>
                        <CardTitle className="font-headline text-3xl">Avaliação LEAP Concluída!</CardTitle>
                        <CardDescription>
                            Parabéns! Você finalizou todas as etapas. Seu Relatório de Inteligência da Natureza está sendo preparado e estará disponível em breve.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Você pode acompanhar o status e acessar seus relatórios no seu painel principal.</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button asChild>
                            <Link href="/admin">Voltar para o Painel</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

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
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Plano de Ação</CardTitle>
                            <CardDescription>
                                Defina as próximas ações, responsáveis e prazos. Comece com 1 a 3 ações prioritárias.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             {fields.map((field, index) => (
                                <div key={field.id} className="p-4 rounded-md bg-secondary/50 space-y-4 relative">
                                    <FormField control={form.control} name={`plan.${index}.action`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ação</FormLabel>
                                            <FormControl><Textarea placeholder="Ex: Instalar medidores de consumo de água" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`plan.${index}.owner`} render={({ field }) => (
                                            <FormItem><FormLabel>Responsável</FormLabel><FormControl><Input placeholder="Ex: João, Gerente" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`plan.${index}.deadline`} render={({ field }) => (
                                             <FormItem><FormLabel>Prazo</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`plan.${index}.cost`} render={({ field }) => (
                                            <FormItem><FormLabel>Custo Estimado (R$)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`plan.${index}.kpi`} render={({ field }) => (
                                             <FormItem><FormLabel>KPI / Indicador</FormLabel><FormControl><Input placeholder="Redução de 15% no consumo" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" size="sm" onClick={() => append({ action: '', owner: '', deadline: '', cost: 0, kpi: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Adicionar Ação ao Plano
                            </Button>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" size="lg" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Finalizar Avaliação e Salvar Plano
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

export default PreparePage;
