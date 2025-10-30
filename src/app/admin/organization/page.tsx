'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Building, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createOrganization } from '../actions';

const orgFormSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters.'),
  slug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  bio: z.string().optional(),
});

type OrgFormValues = z.infer<typeof orgFormSchema>;

type Organization = {
  id: string;
  name: string;
  bio: string;
  slug: string;
}

const OrganizationPage = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: { name: '', slug: '', bio: '' },
  });

  const orgsCollectionRef = useMemoFirebase(() => collection(firestore, 'organizations'), [firestore]);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user || !firestore || !orgsCollectionRef) return;
      setIsLoading(true);
      try {
        const q = query(orgsCollectionRef, where('createdBy', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const orgDoc = querySnapshot.docs[0];
          setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization);
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('Failed to load organization data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
        fetchOrganization();
    }
  }, [user, firestore, isUserLoading, orgsCollectionRef]);


  const onSubmit = (values: OrgFormValues) => {
    if (!user) return;
    startTransition(async () => {
      const result = await createOrganization(values, user.uid);
      if (result.success && result.orgId) {
        toast({ title: 'Success!', description: 'Your organization has been created.' });
        setOrganization({ id: result.orgId, ...values });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not create organization.' });
      }
    });
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
        <div className="container py-12">
            <Card className="max-w-2xl mx-auto border-destructive/50">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle/> Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="container py-12">
        <div className="max-w-2xl mx-auto">
            {organization ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl flex items-center gap-3"><Building /> {organization.name}</CardTitle>
                        <CardDescription>@{organization.slug}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{organization.bio || "No biography provided."}</p>
                        {/* Future: Add project management here */}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Create Your Organization</CardTitle>
                        <CardDescription>This will be the main entity that your projects and actions are linked to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Organization Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Coletivo RegenSampa" {...field} /></FormControl>
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
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Organization
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    </div>
  );
};

export default OrganizationPage;
