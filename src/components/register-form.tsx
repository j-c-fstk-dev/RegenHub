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
import { Card, CardContent } from '@/components/ui/card';
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
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, DocumentData } from 'firebase/firestore';


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
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const fetchUserAndProjectData = async () => {
      if (user && firestore) {
        setIsLoading(true);
        try {
            // 1. Find user's organization
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.orgs && userData.orgs.length > 0) {
                    const orgId = userData.orgs[0];
                    setOrganization({ id: orgId, name: '...' }); // Temp name
                    
                    // 2. Fetch projects for that organization
                    const projectsQuery = query(collection(firestore, 'projects'), where('orgId', '==', orgId));
                    const projectsSnapshot = await getDocs(projectsQuery);
                    const fetchedProjects = projectsSnapshot.docs.map(p => ({ id: p.id, title: p.data().title }));
                    setProjects(fetchedProjects);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load your organization and project data.' });
        } finally {
            setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchUserAndProjectData();
  }, [user, firestore, toast]);

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
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to submit an action.' });
        return;
    }
    if (!organization) {
        toast({ variant: 'destructive', title: 'No Organization', description: 'You must belong to an organization to submit an action. Please create one in the admin panel.' });
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
        const fetchWithAuth = (window as any).fetchWithAuth;
        if (!fetchWithAuth) {
          throw new Error("Authentication fetch function not available.");
        }

        const response = await fetchWithAuth('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'An unknown error occurred.');
        }

        toast({
          title: 'Intent Submitted!',
          description: 'Your action is now pending verification. Thank you!',
        });
        form.reset();

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

  const getButtonStateText = () => {
      if(isPending) return 'Submitting...';
      if(!user) return 'Please log in to submit';
      if(isLoading) return 'Loading your data...';
      if(!organization) return 'Create an Organization First';
      if(projects.length === 0) return 'Create a Project First';
      return 'Submit Intent';
  }

  const isSubmitDisabled = isPending || !user || isLoading || !organization || projects.length === 0;

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-headline">About the Action</h3>

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
                        You can create new projects in your organization's admin panel.
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


            <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getButtonStateText()}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
