'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useEffect, useCallback } from 'react';
import { Loader2, FolderPlus, Building } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, FirestorePermissionError, errorEmitter } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrganizationForm } from './organization-form';
import { ProjectForm } from './project-form';

const actionFormSchema = z.object({
  projectId: z.string().nonempty({ message: "Please select a project." }),
  title: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(500),
  category: z.string().nonempty({ message: "Please select a category."}),
  location: z.string().optional(),
  mediaUrls: z.string().url({ message: 'Please enter a valid URL for your proof.' }).optional().or(z.literal('')),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

type Project = { id: string; title: string; };
type Organization = { id: string; name: string; slug: string; bio: string; };

export function RegisterForm() {
  const [isSubmitPending, startSubmitTransition] = useTransition();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentStep, setCurrentStep] = useState('loading'); // loading, login, create_org, create_project, form

  const fetchUserOrgsAndProjects = useCallback(async () => {
    if (!user || !firestore) {
      setCurrentStep('login'); // Should not happen if logic is right, but as a fallback
      return;
    }
    
    setCurrentStep('loading');

    const orgsCollectionRef = collection(firestore, 'organizations');
    const orgQuery = query(orgsCollectionRef, where('createdBy', '==', user.uid));
    
    try {
        const orgSnapshot = await getDocs(orgQuery);

        if (!orgSnapshot.empty) {
            const orgDoc = orgSnapshot.docs[0];
            const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
            setOrganization(orgData);

            const projectsCollectionRef = collection(firestore, 'projects');
            const projectsQuery = query(projectsCollectionRef, where('orgId', '==', orgData.id));
            
            try {
                const projectsSnapshot = await getDocs(projectsQuery);
                const fetchedProjects = projectsSnapshot.docs.map(p => ({ id: p.id, title: p.data().title as string }));
                setProjects(fetchedProjects);

                if (fetchedProjects.length === 0) {
                    setCurrentStep('create_project');
                } else {
                    setCurrentStep('form');
                }
            } catch (projectError) {
                 const permissionError = new FirestorePermissionError({
                    path: `projects where orgId == ${orgData.id}`,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        } else {
            // This is the correct path for a new user with no organization
            setOrganization(null);
            setProjects([]);
            setCurrentStep('create_org');
        }
    } catch (orgError) {
        const permissionError = new FirestorePermissionError({
          path: `organizations where createdBy == ${user.uid}`,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [user, firestore]);

  useEffect(() => {
    if (isUserLoading) {
      setCurrentStep('loading');
      return;
    }
    if (!user) {
      setCurrentStep('login');
      return;
    }
    if (user && firestore) {
      fetchUserOrgsAndProjects();
    }
  }, [user, isUserLoading, firestore, fetchUserOrgsAndProjects]);

  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: { projectId: '', title: '', description: '', category: '', location: '', mediaUrls: ''},
  });

  const onSubmit = (values: ActionFormValues) => {
    if (!user || !organization) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or organization not found.' });
        return;
    }

    startSubmitTransition(async () => {
      const selectedProject = projects.find(p => p.id === values.projectId);
      const projectTitle = selectedProject?.title || 'Unknown Project';

      const payload = {
        orgId: organization.id,
        ...values,
        mediaUrls: values.mediaUrls ? [values.mediaUrls] : [],
        project: {
          title: projectTitle
        }
      };

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'An unknown error occurred.');

        toast({ title: 'Action Submitted!', description: 'Your action is now pending verification. Thank you!'});
        form.reset();
        router.push('/admin');

      } catch (error) {
        console.error("Submission error:", error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error instanceof Error ? error.message : 'Please try again.'});
      }
    });
  }

  const handleOrgCreated = (newOrg: Organization) => {
    setOrganization(newOrg);
    setCurrentStep('create_project'); // Move to next step
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [...prev, newProject]);
    setCurrentStep('form'); // Move to final step
  };

  const renderContent = () => {
    switch (currentStep) {
        case 'loading':
            return ( <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>);
        case 'login':
            return (
                 <Card>
                    <CardHeader><CardTitle>Step 1: Log In</CardTitle><CardDescription>To register an action, you first need an account.</CardDescription></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Please log in or sign up to continue. Your actions will be linked to your profile.</p>
                        <Button asChild className="w-full"><Link href="/login?redirect=/register">Log In or Sign Up</Link></Button>
                    </CardContent>
                </Card>
            );
        case 'create_org':
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2"><Building /> Step 1: Create an Organization</CardTitle>
                        <CardDescription>First, you need an organization. Actions are submitted on behalf of a collective, group, or company.</CardDescription>
                    </CardHeader>
                    <CardContent>{user && <OrganizationForm userId={user.uid} onOrgCreated={handleOrgCreated} />}</CardContent>
                </Card>
            );
        case 'create_project':
            return (
                <Card>
                    <CardHeader>
                         <CardTitle className="font-headline text-2xl flex items-center gap-2"><FolderPlus /> Step 2: Create a Project</CardTitle>
                        <CardDescription>Great! Now, let's create the first project for {organization?.name}. Actions belong to projects.</CardDescription>
                    </CardHeader>
                    <CardContent>{user && organization && <ProjectForm userId={user.uid} orgId={organization.id} onProjectCreated={handleProjectCreated} />}</CardContent>
                </Card>
            );
        case 'form':
             if (!organization || projects.length === 0) {
                 return (
                    <Card>
                        <CardHeader><CardTitle>Loading Your Data...</CardTitle></CardHeader>
                        <CardContent>
                             <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                        </CardContent>
                    </Card>
                 )
             }
            return (
                <Card>
                  <CardHeader><CardTitle>Step 3: Describe Your Action</CardTitle><CardDescription>You're all set! Fill in the details of the regenerative action you performed.</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                           <FormField
                              control={form.control} name="projectId" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={projects.length === 0}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select the project this action belongs to" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {projects.map(p => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>You can create more projects in your <Link href="/admin/organization" className="underline">organization dashboard</Link>.</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                           <FormField control={form.control} name="title" render={({ field }) => (
                              <FormItem><FormLabel>Name of the action</FormLabel><FormControl><Input placeholder="e.g., Community Tree Planting Day" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                          <FormField control={form.control} name="description" render={({ field }) => (
                              <FormItem><FormLabel>Brief description</FormLabel><FormControl><Textarea placeholder="Describe what you did and the outcome." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                          <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="Ecological">Ecological</SelectItem>
                                      <SelectItem value="Social">Social</SelectItem>
                                      <SelectItem value="Educational">Educational</SelectItem>
                                       <SelectItem value="Cultural">Cultural</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}/>
                            <FormField control={form.control} name="location" render={({ field }) => (
                              <FormItem><FormLabel>Location (City, Country)</FormLabel><FormControl><Input placeholder="e.g., Recife, Brazil" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold font-headline">Proof</h3>
                            <FormField control={form.control} name="mediaUrls" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Proof of Action (Link)</FormLabel>
                                <FormControl><Input placeholder="https://example.com/photo-or-video-of-action" {...field} /></FormControl>
                                <FormDescription>Link to a photo, video, blog post, or social media post.</FormDescription><FormMessage />
                              </FormItem>
                            )}/>
                         </div>
                        <Button type="submit" className="w-full" disabled={isSubmitPending}>
                          {isSubmitPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Action
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
            );
        default: 
            return (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
    }
  }

  return renderContent();
}
