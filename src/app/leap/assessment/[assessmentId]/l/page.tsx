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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Locate, Loader2, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveLeapL } from '../../actions';

const formSchema = z.object({
  company: z.object({
    sector: z.string().nonempty({ message: 'Setor é obrigatório.' }),
    size: z.string().nonempty({ message: 'Porte é obrigatório.' }),
    sites: z.array(z.object({ value: z.string().nonempty({ message: 'Localização não pode ser vazia.' }) })).min(1, 'Adicione pelo menos uma localização.'),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const LocatePage = ({ params }: { params: { assessmentId: string } }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: {
        sector: '',
        size: '',
        sites: [{ value: '' }],
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'company.sites',
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await saveLeapL(params.assessmentId, values.company);
      if (result.success) {
        toast({ title: 'Etapa 1 Salva!', description: 'Seus dados foram salvos com sucesso.' });
        router.push(`/leap/assessment/${params.assessmentId}/e`);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Não foi possível salvar os dados.' });
      }
    });
  };

  return (
    <div className="container py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold text-primary">LEAP - Etapa 1 de 4</p>
        <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
          <Locate className="h-8 w-8" />
          L - Localizar (Locate)
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
          Vamos começar mapeando onde seu negócio interage com a natureza.
        </p>
      </header>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Informações básicas para contextualizar sua avaliação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="company.sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor Principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o setor do seu negócio" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Agropecuária">Agropecuária</SelectItem>
                          <SelectItem value="Indústria Leve">Indústria Leve</SelectItem>
                          <SelectItem value="Serviços">Serviços</SelectItem>
                          <SelectItem value="Varejo">Varejo</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company.size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porte da Empresa</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o número de funcionários" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-9">1-9 funcionários (Micro)</SelectItem>
                          <SelectItem value="10-49">10-49 funcionários (Pequena)</SelectItem>
                          <SelectItem value="50-249">50-249 funcionários (Média)</SelectItem>
                          <SelectItem value="250+">250+ funcionários (Grande)</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Localizações (sites)</FormLabel>
                <FormDescription className="mb-2">Adicione os endereços das suas principais unidades de operação (fábricas, escritórios, fazendas).</FormDescription>
                <div className="space-y-2">
                    {fields.map((field, index) => (
                         <FormField
                            key={field.id}
                            control={form.control}
                            name={`company.sites.${index}.value`}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input placeholder="Ex: Rua das Flores, 123, São Paulo, SP" {...field}/>
                                        </FormControl>
                                        {fields.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        )}
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ value: "" })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Adicionar outra localização
                  </Button>
              </div>

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
};

export default LocatePage;
