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
import { useState, useTransition, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


const formSchema = z.object({
  projectId: z.string().nonempty({ message: "Please select a project." }),
  title: z.string().min(5, { message: 'Action name must be at least 5 characters.' }),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(500),
  category: z.string().nonempty({ message: "Please select a category."}),
  location: z.string().optional(),
  mediaUrls: z.string().url({ message: 'Please enter a valid URL for your proof.' }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

type Project = { id: string; title: string; };
type Organization = { id: string; name: string; };

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine current step
  const getStep = () => {
    if (isUserLoading || isLoading) return 'loading';
    if (!user) return 'login';
    if (!organization) return 'no_org';
    if (projects.length === 0) return 'no_project';
    return 'form';
  }
  const currentStep = getStep();


  const userOrgsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'organizations'), where('createdBy', '==', user.uid));
  }, [user, firestore]);
  
  useEffect(() => {
    const fetchUserAndProjectData = async () => {
      if (user && firestore && userOrgsQuery) {
        setIsLoading(true);
        try {
            const orgSnapshot = await getDocs(userOrgsQuery);
            if (!orgSnapshot.empty) {
                const orgDoc = orgSnapshot.docs[0];
                const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
                setOrganization(orgData);

                const projectsQuery = query(collection(firestore, 'projects'), where('orgId', '==', orgData.id));
                const projectsSnapshot = await getDocs(projectsQuery);
                const fetchedProjects = projectsSnapshot.docs.map(p => ({ id: p.id, title: p.data().title }));
                setProjects(fetchedProjects);
            } else {
                setOrganization(null);
                setProjects([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your organization and project data.' });
        } finally {
            setIsLoading(false);
        }
      } else if (!isUserLoading) {
        setIsLoading(false);
      }
    };
    fetchUserAndProjectData();
  }, [user, firestore, toast, isUserLoading, userOrgsQuery]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: '',
      title: '',
      description: '',
      category: '',
      location: '',
      mediaUrls: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!user || !organization) {
        toast({ variant: 'destructive', title: 'Error', description: 'User or organization not found.' });
        return;
    }

    startTransition(async () => {
      const payload = {
        orgId: organization.id,
        intentId: "mock-intent-id", // Still mocking intent for now
        ...values,
        mediaUrls: values.mediaUrls ? [values.mediaUrls] : [],
      };

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'An unknown error occurred.');
        }

        toast({
          title: 'Action Submitted!',
          description: 'Your action is now pending verification. Thank you!',
        });
        form.reset();
        router.push('/admin');

      } catch (error) {
        console.error("Submission error:", error);
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error instanceof Error ? error.message : 'Please try again.',
        });
      }
    });
  }

  const renderContent = () => {
    switch (currentStep) {
        case 'loading':
            return (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )
        case 'login':
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 1: Log In</CardTitle>
                        <CardDescription>To register an action, you first need an account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Please log in or sign up to continue. Your actions will be linked to your profile.</p>
                        <Button asChild className="w-full">
                           <Link href="/login?redirect=/register">Log In or Sign Up</Link>
                        </Button>
                    </CardContent>
                </Card>
            )
        case 'no_org':
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 2: Create an Organization</CardTitle>
                        <CardDescription>Actions are submitted on behalf of an organization or collective.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">It looks like you're not part of an organization yet. Please create one from your admin panel.</p>
                        <Button asChild className="w-full">
                           <Link href="/admin/organization">Create Your Organization</Link>
                        </Button>
                    </CardContent>
                </Card>
            )
        case 'no_project':
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Create a Project</CardTitle>
                        <CardDescription>Every action must be linked to a specific project.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-muted-foreground mb-4">You need at least one project to submit an action. Let's create one now.</p>
                        <Button asChild className="w-full">
                           <Link href="/admin/organization">Create Your First Project</Link>
                        </Button>
                    </CardContent>
                </Card>
            )
        case 'form':
            return (
                <Card>
                  <CardContent className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold font-headline">Register Your Action</h3>

                           <FormField
                              control={form.control}
                              name="projectId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={projects.length === 0}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select the project this action belongs to" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {projects.map(p => (
                                         <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormDescription>
                                    You can create new projects in your <Link href="/admin/organization" className="underline">organization panel</Link>.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                           <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name of the action</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Community Tree Planting Day" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Brief description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe what you did and the outcome." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                    </FormControl>
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
                              )}
                            />

                            <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location (City, Country)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Recife, Brazil" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                         <div className="space-y-4">
                            <h3 className="text-lg font-semibold font-headline">Proof</h3>
                            <FormField
                            control={form.control}
                            name="mediaUrls"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Proof of Action (Link)</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.com/photo-or-video-of-action" {...field} />
                                </FormControl>
                                <FormDescription>Link to a photo, video, blog post, or social media post.</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                         </div>

                        <Button type="submit" className="w-full" disabled={isPending}>
                          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Action
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
            )
        default:
            return null;
    }
  }

  return renderContent();
}
