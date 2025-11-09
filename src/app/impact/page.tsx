'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, CheckCircle, Loader2, Award, Building, Calendar, MoreHorizontal, AlertCircle, Eye, Image as ImageIcon, Link as LinkIcon, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { ImpactMap } from "@/components/impact-map";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type Action = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  createdAt: { toDate: () => Date };
  validationScore?: number;
  orgId: string;
  org?: {
    name: string;
    slug: string;
    image?: string;
  }
  mediaUrls: (string | {url:string})[];
  dateOfAction?: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

const ActionPostCard = ({ action }: { action: Action }) => {
    const getInitials = (name: string) => (name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const isImageUrl = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);

    const firstMedia = action.mediaUrls?.[0];
    const coverMediaUrl = typeof firstMedia === 'string' ? firstMedia : firstMedia?.url;
    
    const isCoverImage = coverMediaUrl && isImageUrl(coverMediaUrl);
    
    const placeholderImage = PlaceHolderImages.find(p => p.id === 'action-placeholder');
    const coverImageSrc = isCoverImage ? coverMediaUrl : (placeholderImage?.imageUrl || `https://picsum.photos/seed/${action.id}/600`);
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="overflow-hidden transition-shadow duration-300 hover:shadow-lg flex flex-col cursor-pointer">
                    <CardHeader className="flex flex-row items-center gap-3 p-4">
                        <Avatar className="h-10 w-10 border">
                            <AvatarImage src={action.org?.image} alt={action.org?.name} />
                            <AvatarFallback>{getInitials(action.org?.name || '?')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Link href={`/org/${action.org?.slug}`} className="font-semibold hover:underline" onClick={e => e.stopPropagation()}>{action.org?.name}</Link>
                             <p className="text-xs text-muted-foreground">
                                {action.dateOfAction ? new Date(action.dateOfAction).toLocaleDateString() : (action.createdAt ? new Date(action.createdAt.toDate()).toLocaleDateString() : 'Date not set')}
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="relative aspect-square w-full">
                            <Image 
                                src={coverImageSrc}
                                alt={action.title} 
                                fill 
                                className="object-cover" 
                                data-ai-hint={!isCoverImage ? "regenerative action" : ""}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 flex flex-col items-start flex-grow">
                        <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <Award className="h-4 w-4" />
                            <span>Score: {action.validationScore || 'N/A'}</span>
                        </div>
                        <p className="w-full text-sm mt-2">
                            <Link href={`/org/${action.org?.slug}`} className="font-semibold hover:underline" onClick={e => e.stopPropagation()}>{action.org?.name}</Link>
                            <span className="text-muted-foreground"> {action.title}</span>
                        </p>
                        <div className="w-full mt-auto pt-4">
                            <Button variant="secondary" size="sm" className="w-full">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{action.title}</DialogTitle>
                    <div className="text-sm text-muted-foreground pt-2">
                        By <Link href={`/org/${action.org?.slug}`} className="font-semibold hover:underline">{action.org?.name}</Link> on {action.dateOfAction ? new Date(action.dateOfAction).toLocaleDateString() : 'date not set'}
                    </div>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    {action.mediaUrls && action.mediaUrls.length > 0 && (
                        <div className="space-y-4">
                             <h3 className="font-semibold flex items-center gap-2"><ImageIcon/> Evidence Gallery</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {action.mediaUrls.map((media, index) => {
                                    const mediaUrl = typeof media === 'string' ? media : media.url;
                                    return mediaUrl && <a key={index} href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-square w-full overflow-hidden rounded-md border">
                                        {isImageUrl(mediaUrl) ? (
                                            <Image src={mediaUrl} alt={`Evidence ${index+1}`} fill className="object-cover transition-transform hover:scale-105" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full bg-secondary hover:bg-secondary/80">
                                                <LinkIcon className="h-8 w-8 text-muted-foreground"/>
                                                <p className="text-xs text-muted-foreground mt-2 text-center p-2 break-all">{mediaUrl}</p>
                                            </div>
                                        )}
                                    </a>
                                })}
                            </div>
                        </div>
                    )}
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><FileText/> Description</h3>
                        <p className="text-muted-foreground mt-2">{action.description}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><MapPin/> Location</h3>
                        <p className="text-muted-foreground mt-2">{action.location}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><Award/> Final Score</h3>
                        <p className="text-2xl font-bold text-primary mt-2">{action.validationScore}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ImpactPage = () => {
  const firestore = useFirestore();
  const [organizations, setOrganizations] = useState<Record<string, Organization>>({});
  
  const actionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for verified actions. This is the single source of truth for public actions.
    return query(collection(firestore, 'actions'), where('status', '==', 'verified'));
  }, [firestore]);

  const { data: actionsData, isLoading, error } = useCollection<Action>(actionsQuery);
  
  const [filters, setFilters] = useState({
    location: '',
    category: '',
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!actionsData || actionsData.length === 0 || !firestore) return;
      
      const orgIds = [...new Set(actionsData.map(action => action.orgId).filter(Boolean))];
      if (orgIds.length === 0) return;

      const orgsToFetch = orgIds.filter(id => !organizations[id]);
      if (orgsToFetch.length === 0) return;

      try {
        // Firestore 'in' query is limited to 30 items. Batch if necessary.
        const batches = [];
        for (let i = 0; i < orgsToFetch.length; i += 30) {
            batches.push(orgsToFetch.slice(i, i + 30));
        }

        const orgsMap: Record<string, Organization> = {};
        for (const batch of batches) {
            const orgsRef = collection(firestore, 'organizations');
            const q = query(orgsRef, where(documentId(), 'in', batch));
            const orgsSnapshot = await getDocs(q);
            
            orgsSnapshot.forEach(doc => {
              const data = doc.data();
              orgsMap[doc.id] = {
                id: doc.id,
                name: data.name,
                slug: data.slug,
                image: data.image
              };
            });
        }

        setOrganizations(prev => ({...prev, ...orgsMap}));
      } catch (e) {
        console.error("Failed to fetch organizations", e);
      }
    };
    fetchOrganizations();
  }, [actionsData, firestore, organizations]);
  
  const actionsWithOrgData = useMemo(() => {
    if (!actionsData) return [];
    return actionsData.map(action => ({
      ...action,
      org: organizations[action.orgId]
    })).filter(action => action.org); // Only show actions where org data is loaded
  }, [actionsData, organizations]);

  const filteredActions = useMemo(() => {
    return actionsWithOrgData.filter(action => {
      const locationMatch = filters.location ? action.location?.toLowerCase().includes(filters.location.toLowerCase()) : true;
      const categoryMatch = filters.category ? action.category === filters.category : true;
      return locationMatch && categoryMatch;
    });
  }, [actionsWithOrgData, filters]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };
  
  const uniqueCategories = useMemo(() => {
    if (!actionsData) return [];
    const categories = new Set(actionsData.map(action => action.category));
    return Array.from(categories).filter(cat => !!cat);
  }, [actionsData]);

  const mapLocations = useMemo(() => {
    // Return an empty array to disable map pins temporarily
    return [];
  }, []);
  

  return (
    <div className="container py-12">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
          Public Impact Wall
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Explore the collective mural of regenerative actions from around the world.
        </p>
      </header>

      <div className="mb-8">
        <ImpactMap locations={mapLocations} />
      </div>

      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2">
            <Input placeholder="Filter by city..." onChange={e => handleFilterChange('location', e.target.value)} />
            <Select onValueChange={value => handleFilterChange('category', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
      )}

      {error && !isLoading && (
        <Card className="max-w-2xl mx-auto border-destructive/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle/> Could not load actions</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error.message}</p>
                <p className="text-sm text-muted-foreground mt-2">This may be due to a network issue or a security rule misconfiguration.</p>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && filteredActions.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
            <p>No verified actions to display yet.</p>
            <p>Be the first to submit one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredActions.map(action => (
          <ActionPostCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
};

export default ImpactPage;
