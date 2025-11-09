'use client';

import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { useTransition, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { CheckSquare, Loader2, PartyPopper, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';


const planItemSchema = z.object({
  action: z.string().nonempty({ message: 'Action is required.' }),
  owner: z.string().nonempty({ message: 'Owner is required.' }),
  deadline: z.string().nonempty({ message: 'Deadline is required.' }),
  cost: z.coerce.number().optional(),
  kpi: z.string().optional(),
});

const formSchema = z.object({
  plan: z.array(planItemSchema).min(1, 'Add at least one action to the plan.'),
});

type FormValues = z.infer<typeof formSchema>;

const PreparePage = () => {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isPending, startTransition] = useTransition();
    const [isDone, setIsDone] = useState(false);
    const assessmentId = params.assessmentId as string;

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
        if (!firestore || !assessmentId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
            return;
        }
        startTransition(async () => {
            try {
                const assessmentRef = doc(firestore, 'leapAssessments', assessmentId);
                await updateDoc(assessmentRef, {
                    plan: values.plan,
                    stage: 'done', // Mark assessment as complete
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Assessment Complete!', description: 'Your action plan has been saved.' });
                setIsDone(true);
            } catch (error) {
                const permissionError = new FirestorePermissionError({
                    path: `leapAssessments/${assessmentId}`,
                    operation: 'update',
                    requestResourceData: { ...values, stage: 'done' },
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not save the plan.' });
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
                        <CardTitle className="font-headline text-3xl">LEAP Assessment Complete!</CardTitle>
                        <CardDescription>
                            Congratulations! You have finished all the steps. Your Nature Intelligence Report is being prepared and will be available soon.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">You can track the status and access your reports on your main dashboard.</p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button asChild>
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Step 4 of 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <CheckSquare className="h-8 w-8" />
                    P - Prepare
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Based on the risk and opportunity analysis, let's create a concrete action plan.
                </p>
            </header>

            <Card>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Action Plan</CardTitle>
                            <CardDescription>
                                Define the next actions, owners, and deadlines. Start with 1 to 3 priority actions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             {fields.map((field, index) => (
                                <div key={field.id} className="p-4 rounded-md bg-secondary/50 space-y-4 relative">
                                    <FormField control={form.control} name={`plan.${index}.action`} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Action</FormLabel>
                                            <FormControl><Textarea placeholder="E.g., Install water consumption meters" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`plan.${index}.owner`} render={({ field }) => (
                                            <FormItem><FormLabel>Owner</FormLabel><FormControl><Input placeholder="E.g., John, Manager" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`plan.${index}.deadline`} render={({ field }) => (
                                             <FormItem><FormLabel>Deadline</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name={`plan.${index}.cost`} render={({ field }) => (
                                            <FormItem><FormLabel>Estimated Cost ($)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name={`plan.${index}.kpi`} render={({ field }) => (
                                             <FormItem><FormLabel>KPI / Indicator</FormLabel><FormControl><Input placeholder="15% reduction in consumption" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                             <Button type="button" variant="outline" size="sm" onClick={() => append({ action: '', owner: '', deadline: '', cost: 0, kpi: '' })}>
                                <PlusCircle className="mr-2 h-4 w-4"/> Add Action to Plan
                            </Button>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" size="lg" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Finish Assessment & Save Plan
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
};

export default PreparePage;
