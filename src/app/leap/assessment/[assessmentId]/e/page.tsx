'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Scale, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveLeapE } from '../../actions';

const formSchema = z.object({
  inputs: z.object({
    water: z.object({
      source: z.string().nonempty({ message: 'Selecione a fonte de água.' }),
      volume: z.string().nonempty({ message: 'Estime o volume mensal.' }),
    }),
    energy: z.object({
      source: z.string().nonempty({ message: 'Selecione a fonte de energia.' }),
      consumption: z.string().nonempty({ message: 'Estime o consumo mensal.' }),
    }),
  }),
  impacts: z.object({
      practices: z.string().optional(),
  })
});

type FormValues = z.infer<typeof formSchema>;

const EvaluatePage = ({ params }: { params: { assessmentId: string } }) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            inputs: {
                water: { source: '', volume: '' },
                energy: { source: '', consumption: '' },
            },
            impacts: {
                practices: '',
            }
        },
    });

    const onSubmit = (values: FormValues) => {
        startTransition(async () => {
            const result = await saveLeapE(params.assessmentId, values);
            if (result.success) {
                toast({ title: 'Etapa 2 Salva!', description: 'Avaliação de dependências e impactos salva.' });
                router.push(`/leap/assessment/${params.assessmentId}/a`);
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Não foi possível salvar os dados.' });
            }
        });
    };

    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Etapa 2 de 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <Scale className="h-8 w-8" />
                    E - Avaliar (Evaluate)
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Agora, vamos qualificar e quantificar suas dependências e impactos. Estimativas são bem-vindas.
                </p>
            </header>

            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Dependências e Impactos</CardTitle>
                            <CardDescription>
                                Responda sobre os principais insumos e práticas do seu negócio.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Water Section */}
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="-ml-1 px-1 text-lg font-medium font-headline">💧 Água</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="inputs.water.source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fonte Principal</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Rede pública">Rede pública</SelectItem>
                                                        <SelectItem value="Poço artesiano">Poço artesiano</SelectItem>
                                                        <SelectItem value="Captação de chuva">Captação de chuva</SelectItem>
                                                        <SelectItem value="Rio ou lago">Rio ou lago</SelectItem>
                                                        <SelectItem value="Não se aplica">Não se aplica</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="inputs.water.volume"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Consumo Mensal Estimado</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Até 1 m³">Até 1 m³ (caixa d'água)</SelectItem>
                                                        <SelectItem value="1-10 m³">1-10 m³</SelectItem>
                                                        <SelectItem value="10-50 m³">10-50 m³</SelectItem>
                                                        <SelectItem value="50+ m³">Acima de 50 m³</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </fieldset>

                            {/* Energy Section */}
                             <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="-ml-1 px-1 text-lg font-medium font-headline">⚡ Energia</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="inputs.energy.source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Fonte Principal</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Rede convencional">Rede convencional</SelectItem>
                                                        <SelectItem value="Solar fotovoltaica">Solar fotovoltaica</SelectItem>
                                                        <SelectItem value="Gerador a combustível">Gerador a combustível</SelectItem>
                                                        <SelectItem value="Outra">Outra</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="inputs.energy.consumption"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Consumo Mensal Estimado</FormLabel>
                                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Até 100 kWh">Até 100 kWh (residencial)</SelectItem>
                                                        <SelectItem value="100-500 kWh">100-500 kWh</SelectItem>
                                                        <SelectItem value="500-2000 kWh">500-2000 kWh</SelectItem>
                                                        <SelectItem value="2000+ kWh">Acima de 2000 kWh</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </fieldset>

                             <FormField
                                control={form.control}
                                name="impacts.practices"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Práticas de Sustentabilidade</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Descreva brevemente quaisquer práticas existentes para economizar água, energia, gerenciar resíduos, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />

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

export default EvaluatePage;