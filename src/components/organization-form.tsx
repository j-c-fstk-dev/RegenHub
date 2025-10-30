'use client';

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc, setDoc, writeBatch, serverTimestamp, arrayUnion, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const orgFormSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters.'),
  slug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  bio: z.string().max(280, "Bio should not exceed 280 characters.").optional(),
});
type OrgFormValues = z.infer<typeof orgFormSchema>;

type Organization = { id: string; name: string; slug: string; bio: string; };

interface OrganizationFormProps {
  userId: string;
  onOrgCreated: (org: Organization) => void;
}

export function OrganizationForm({ userId, onOrgCreated }: OrganizationFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: { name: '', slug: '', bio: '' },
  });

  const onSubmit = (values: OrgFormValues) => {
    if (!firestore) return;
    startTransition(async () => {
        const batch = writeBatch(firestore);
        try {
            const orgRef = doc(collection(firestore, 'organizations'));
            batch.set(orgRef, {
                ...values,
                createdBy: userId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isVerified: false,
            });

            const userRef = doc(firestore, 'users', userId);
            batch.update(userRef, {
                orgs: arrayUnion(orgRef.id)
            });

            await batch.commit();

            toast({ title: 'Success!', description: 'Your organization has been created.' });
            onOrgCreated({ id: orgRef.id, ...values, bio: values.bio || '' });
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not create organization.' });
        }
    });
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl><Input placeholder="e.g., RegenSampa Collective" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Unique Slug</FormLabel>
                        <FormControl><Input placeholder="e.g., regensampa" {...field} /></FormControl>
                        <FormDescription>This will be used in your public profile URL.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Short Bio</FormLabel>
                        <FormControl><Textarea placeholder="Describe your organization's mission in a few words." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Organization & Continue
            </Button>
        </form>
    </Form>
  );
}
