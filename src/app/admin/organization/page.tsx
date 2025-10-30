'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { Loader2, Building, AlertCircle, PlusCircle, FolderKanban } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { createOrganization, createProject } from '../actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

const orgFormSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters.'),
  slug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  bio: z.string().max(280, "Bio should not exceed 280 characters.").optional(),
});
type OrgFormValues = z.infer<typeof orgFormSchema>;

const projectFormSchema = z.object({
  title: z.string().min(3, 'Project title must be at least 3 characters.'),
  description: z.string().max(500, "Description should not exceed 500 characters.").optional(),
  impactCategory: z.string().nonempty({ message: "Please select a category."}),
  location: z.string().optional(),
});
type ProjectFormValues = z.infer<typeof projectFormSchema>;

type Organization = {
  id: string;
  name: string;
  bio: string;
  slug: string;
};
type Project = {
  id: string;
  title: string;
  impactCategory: string;
};


const NewProjectDialog = ({ orgId, userId, onProjectCreated }: { orgId: string, userId: string, onProjectCreated: (newProject: Project) => void }) => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { title: '', description: '', impactCategory: '', location: '' },
  });

  const onSubmit = (values: ProjectFormValues) => {
    startTransition(async () => {
      const result = await createProject(values, orgId, userId);
      if (result.success && result.projectId) {
        toast({ title: 'Success!', description: 'Your new project has been created.' });
        onProjectCreated({ id: result.projectId, ...values });
        form.reset();
        setIsOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not create project.' });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Project</DialogTitle>
          <DialogDescription>
            Projects are specific initiatives within your organization.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl><Input placeholder="e.g., Reforestation in the Atlantic Forest" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impactCategory"
              render={({ field }) => (
                    <FormItem>
                      <FormLabel>Impact Category</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Agroforestry">Agroforestry</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Waste Management">Waste Management</SelectItem>
                           <SelectItem value="Water">Water</SelectItem>
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
                  <FormLabel>Location</FormLabel>
                  <FormControl><Input placeholder="e.g., Recife, Brazil" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Briefly describe this project's goals." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};


const OrganizationPage = () => {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isFormPending, startFormTransition] = useTransition();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgForm = useForm<OrgFormValues>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: { name: '', slug: '', bio: '' },
  });

  const orgsCollectionRef = useMemoFirebase(() => collection(firestore, 'organizations'), [firestore]);
  const projectsCollectionRef = useMemoFirebase(() => collection(firestore, 'projects'), [firestore]);


  useEffect(() => {
    const fetchData = async () => {
      if (!user || !firestore || !orgsCollectionRef) return;
      setIsLoading(true);
      try {
        const orgQuery = query(orgsCollectionRef, where('createdBy', '==', user.uid));
        const orgSnapshot = await getDocs(orgQuery);
        
        if (!orgSnapshot.empty) {
          const orgDoc = orgSnapshot.docs[0];
          const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organization;
          setOrganization(orgData);

          if (projectsCollectionRef) {
            const projectsQuery = query(projectsCollectionRef, where('orgId', '==', orgData.id));
            const projectsSnapshot = await getDocs(projectsQuery);
            const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setProjects(projectsData);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your organization and project data.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
        fetchData();
    }
  }, [user, firestore, isUserLoading, orgsCollectionRef, projectsCollectionRef]);


  const onOrgSubmit = (values: OrgFormValues) => {
    if (!user) return;
    startFormTransition(async () => {
      const result = await createOrganization(values, user.uid);
      if (result.success && result.orgId) {
        toast({ title: 'Success!', description: 'Your organization has been created.' });
        setOrganization({ id: result.orgId, ...values, bio: values.bio || '' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not create organization.' });
      }
    });
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prevProjects => [...prevProjects, newProject]);
  }

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
        <div className="max-w-4xl mx-auto">
            {organization ? (
              <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl flex items-center gap-3"><Building /> {organization.name}</CardTitle>
                        <CardDescription>@{organization.slug}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{organization.bio || "No biography provided."}</p>
                    </CardContent>
                     <CardFooter>
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/org/${organization.slug}`}>View Public Profile</Link>
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-headline text-2xl">Projects</CardTitle>
                      <CardDescription>The initiatives your organization is running.</CardDescription>
                    </div>
                    <NewProjectDialog orgId={organization.id} userId={user.uid} onProjectCreated={handleProjectCreated} />
                  </CardHeader>
                  <CardContent>
                    {projects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projects.map(project => (
                          <Card key={project.id} className="flex flex-col">
                            <CardHeader>
                              <CardTitle className="text-lg flex items-center gap-2"><FolderKanban className="h-5 w-5 text-primary" />{project.title}</CardTitle>
                            </CardHeader>
                             <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{project.impactCategory}</p>
                            </CardContent>
                             <CardFooter>
                                <Button variant="outline" size="sm" className="w-full" disabled>View Details</Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">No projects created yet.</p>
                        <p className="text-sm text-muted-foreground">Click "Create New Project" to get started.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Create Your Organization</CardTitle>
                        <CardDescription>This will be the main entity that your projects and actions are linked to.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...orgForm}>
                            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-6">
                                <FormField
                                    control={orgForm.control}
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
                                    control={orgForm.control}
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
                                    control={orgForm.control}
                                    name="bio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Short Bio</FormLabel>
                                            <FormControl><Textarea placeholder="Describe your organization's mission in a few words." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isFormPending}>
                                    {isFormPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
