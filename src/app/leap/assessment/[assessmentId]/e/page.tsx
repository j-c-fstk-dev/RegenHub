'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';


const formSchema = z.object({
  inputs: z.object({
    water: z.object({
      source: z.string().nonempty({ message: 'Please select a water source.' }),
      volume: z.string().nonempty({ message: 'Please estimate the monthly volume.' }),
    }),
    energy: z.object({
      source: z.string().nonempty({ message: 'Please select an energy source.' }),
      consumption: z.string().nonempty({ message: 'Please estimate the monthly consumption.' }),
    }),
  }),
  impacts: z.object({
      practices: z.string().optional(),
  })
});

type FormValues = z.infer<typeof formSchema>;

const EvaluatePage = () => {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isPending, startTransition] = useTransition();
    const assessmentId = params.assessmentId as string;

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
        if (!firestore || !assessmentId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        startTransition(async () => {
            try {
                const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
                await updateDoc(assessmentRef, {
                  'inputs.water': values.inputs.water,
                  'inputs.energy': values.inputs.energy,
                  'impacts.generalPractices': values.impacts.practices,
                  stage: 'A', // Move to the next stage
                  updatedAt: serverTimestamp(),
                });
                toast({ title: 'Step 2 Saved!', description: 'Dependencies and impacts evaluation saved.' });
                router.push(`/leap/assessment/${assessmentId}/a`);
            } catch (error) {
                const permissionError = new FirestorePermissionError({
                    path: `leapAssessments/${assessmentId}`,
                    operation: 'update',
                    requestResourceData: { ...values, stage: 'A' },
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not save data.' });
            }
        });
    };

    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Step 2 of 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <Scale className="h-8 w-8" />
                    E - Evaluate
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Now, let's qualify and quantify your dependencies and impacts. Estimates are welcome.
                </p>
            </header>

            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Dependencies and Impacts</CardTitle>
                            <CardDescription>
                                Answer the questions about your business's main inputs and practices.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Water Section */}
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="-ml-1 px-1 text-lg font-medium font-headline">💧 Water</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="inputs.water.source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Main Source</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Public Network">Public Network</SelectItem>
                                                        <SelectItem value="Artesian Well">Artesian Well</SelectItem>
                                                        <SelectItem value="Rainwater Harvesting">Rainwater Harvesting</SelectItem>
                                                        <SelectItem value="River or Lake">River or Lake</SelectItem>
                                                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
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
                                                <FormLabel>Estimated Monthly Consumption</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Up to 1 m³">Up to 1 m³ (water tank)</SelectItem>
                                                        <SelectItem value="1-10 m³">1-10 m³</SelectItem>
                                                        <SelectItem value="10-50 m³">10-50 m³</SelectItem>
                                                        <SelectItem value="50+ m³">Above 50 m³</SelectItem>
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
                                <legend className="-ml-1 px-1 text-lg font-medium font-headline">⚡ Energy</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="inputs.energy.source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Main Source</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Conventional Grid">Conventional Grid</SelectItem>
                                                        <SelectItem value="Solar PV">Solar PV</SelectItem>
                                                        <SelectItem value="Fuel Generator">Fuel Generator</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
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
                                                <FormLabel>Estimated Monthly Consumption</FormLabel>
                                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Up to 100 kWh">Up to 100 kWh (residential)</SelectItem>
                                                        <SelectItem value="100-500 kWh">100-500 kWh</SelectItem>
                                                        <SelectItem value="500-2000 kWh">500-2000 kWh</SelectItem>
                                                        <SelectItem value="2000+ kWh">Above 2000 kWh</SelectItem>
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
                                        <FormLabel>Sustainability Practices</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Briefly describe any existing practices for saving water, energy, managing waste, etc." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />

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
}

export default EvaluatePage;
