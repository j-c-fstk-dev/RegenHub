'use client';

import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
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
import { useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';


const formSchema = z.object({
  company: z.object({
    sector: z.string().nonempty({ message: 'Sector is required.' }),
    size: z.string().nonempty({ message: 'Company size is required.' }),
    sites: z.array(z.object({ value: z.string().nonempty({ message: 'Location cannot be empty.' }) })).min(1, 'Add at least one location.'),
  }),
});

type FormValues = z.infer<typeof formSchema>;

const LocatePage = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isPending, startTransition] = useTransition();
  const assessmentId = params.assessmentId as string;
  
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
    if (!firestore || !assessmentId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
        return;
    }
    startTransition(async () => {
        try {
            const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
            await updateDoc(assessmentRef, {
              'company.sector': values.company.sector,
              'company.size': values.company.size,
              'company.sites': values.company.sites.map(s => s.value),
              stage: 'E', // Move to the next stage
              updatedAt: serverTimestamp(),
            });
             toast({ title: 'Step 1 Saved!', description: 'Your data has been saved successfully.' });
            router.push(`/leap/assessment/${assessmentId}/e`);
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: `leapAssessments/${assessmentId}`,
                operation: 'update',
                requestResourceData: { company: values.company, stage: 'E' },
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save data.' });
        }
    });
  };

  return (
    <div className="container py-12">
      <header className="mb-8">
        <p className="text-sm font-semibold text-primary">LEAP - Step 1 of 4</p>
        <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
          <Locate className="h-8 w-8" />
          L - Locate
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
          Let's start by mapping where your business interacts with nature.
        </p>
      </header>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Company Data</CardTitle>
              <CardDescription>
                Basic information to contextualize your assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <FormField
                control={form.control}
                name="company.sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Sector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select your business sector" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Agriculture">Agriculture</SelectItem>
                          <SelectItem value="Light Industry">Light Industry</SelectItem>
                          <SelectItem value="Services">Services</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
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
                    <FormLabel>Company Size</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select the number of employees" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-9">1-9 employees (Micro)</SelectItem>
                          <SelectItem value="10-49">10-49 employees (Small)</SelectItem>
                          <SelectItem value="50-249">50-249 employees (Medium)</SelectItem>
                          <SelectItem value="250+">250+ employees (Large)</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Locations (sites)</FormLabel>
                <FormDescription className="mb-2">Add the addresses of your main operating units (factories, offices, farms).</FormDescription>
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
                                            <Input placeholder="E.g., 123 Flower St, São Paulo, SP" {...field}/>
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
                    Add another location
                  </Button>
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Go to Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default LocatePage;
