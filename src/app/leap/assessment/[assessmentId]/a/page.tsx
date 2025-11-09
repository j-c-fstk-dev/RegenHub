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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';


const riskSchema = z.object({
  theme: z.string().nonempty({ message: 'Theme is required.' }),
  probability: z.coerce.number().min(1).max(5),
  severity: z.coerce.number().min(1).max(5),
  notes: z.string().optional(),
});

const opportunitySchema = z.object({
  theme: z.string().nonempty({ message: 'Theme is required.' }),
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
            defaultValue={String(field.value)}
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


const AssessPage = () => {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [isPending, startTransition] = useTransition();
    const assessmentId = params.assessmentId as string;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            risks: [{ theme: 'Water Scarcity', probability: 3, severity: 3, notes: '' }],
            opportunities: [{ theme: 'Energy Efficiency', rationale: '', ease: 2, payoff: 2 }],
        },
    });

    const { fields: riskFields, append: appendRisk, remove: removeRisk } = useFieldArray({
        control: form.control, name: 'risks'
    });
     const { fields: opportunityFields, append: appendOpportunity, remove: removeOpportunity } = useFieldArray({
        control: form.control, name: 'opportunities'
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
                  risks: values.risks || [],
                  opportunities: values.opportunities || [],
                  stage: 'P', // Move to the next stage
                  updatedAt: serverTimestamp(),
                });
                toast({ title: 'Step 3 Saved!', description: 'Risk and opportunity analysis saved.' });
                router.push(`/leap/assessment/${assessmentId}/p`);
            } catch (error) {
                 const permissionError = new FirestorePermissionError({
                    path: `leapAssessments/${assessmentId}`,
                    operation: 'update',
                    requestResourceData: { ...values, stage: 'P' },
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not save data.' });
            }
        });
    };

    return (
        <div className="container py-12">
            <header className="mb-8">
                <p className="text-sm font-semibold text-primary">LEAP - Step 3 of 4</p>
                <h1 className="font-headline text-4xl font-bold flex items-center gap-3">
                    <LineChart className="h-8 w-8" />
                    A - Assess
                </h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
                    Based on your dependencies and impacts, let's identify the risks and opportunities for your business.
                </p>
            </header>

            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Risk and Opportunity Analysis</CardTitle>
                            <CardDescription>
                                Add the main risks and opportunities you identify for your business related to nature.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">

                            {/* Risks Section */}
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="flex items-center gap-2 -ml-1 px-1 text-lg font-medium font-headline"><ShieldAlert className="h-5 w-5 text-destructive" /> Risks</legend>
                                {riskFields.map((field, index) => (
                                    <div key={field.id} className="p-4 rounded-md bg-secondary/50 space-y-4 relative">
                                        <FormField control={form.control} name={`risks.${index}.theme`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Risk Theme</FormLabel>
                                                <FormControl><Input placeholder="E.g., Water scarcity, Environmental regulation" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <FormField control={form.control} name={`risks.${index}.probability`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Probability</FormLabel>
                                                    <RadioGroupRating field={field} labels={['1', '2', '3', '4', '5']} />
                                                    <FormDescription className="text-xs">1: Very Low, 5: Very High</FormDescription>
                                                </FormItem>
                                            )}/>
                                             <FormField control={form.control} name={`risks.${index}.severity`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Impact Severity</FormLabel>
                                                    <RadioGroupRating field={field} labels={['1', '2', '3', '4', '5']} />
                                                     <FormDescription className="text-xs">1: Very Low, 5: Very High</FormDescription>
                                                </FormItem>
                                            )}/>
                                        </div>
                                         <FormField control={form.control} name={`risks.${index}.notes`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl><Textarea placeholder="Describe the risk and why it's relevant." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeRisk(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendRisk({ theme: '', probability: 3, severity: 3, notes: '' })}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Risk
                                </Button>
                            </fieldset>

                             {/* Opportunities Section */}
                            <fieldset className="space-y-4 rounded-lg border p-4">
                                <legend className="flex items-center gap-2 -ml-1 px-1 text-lg font-medium font-headline"><BadgeInfo className="h-5 w-5 text-primary" /> Opportunities</legend>
                                {opportunityFields.map((field, index) => (
                                    <div key={field.id} className="p-4 rounded-md bg-secondary/50 space-y-4 relative">
                                        <FormField control={form.control} name={`opportunities.${index}.theme`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Opportunity Theme</FormLabel>
                                                <FormControl><Input placeholder="E.g., Water efficiency, New sustainable product" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <FormField control={form.control} name={`opportunities.${index}.ease`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Ease of Implementation</FormLabel>
                                                    <RadioGroupRating field={field} labels={['Easy', 'Medium', 'Hard']} />
                                                </FormItem>
                                            )}/>
                                             <FormField control={form.control} name={`opportunities.${index}.payoff`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Potential Payoff</FormLabel>
                                                    <RadioGroupRating field={field} labels={['Low', 'Medium', 'High']} />
                                                </FormItem>
                                            )}/>
                                        </div>
                                         <FormField control={form.control} name={`opportunities.${index}.rationale`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rationale</FormLabel>
                                                <FormControl><Textarea placeholder="Describe the opportunity and the value it could generate." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => removeOpportunity(index)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => appendOpportunity({ theme: '', rationale: '', ease: 2, payoff: 2 })}>
                                    <PlusCircle className="mr-2 h-4 w-4"/> Add Opportunity
                                </Button>
                            </fieldset>
                        
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

export default AssessPage;
