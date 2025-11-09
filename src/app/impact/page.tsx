'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Users, CheckCircle, Loader2, Award, Building, Calendar, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { ImpactMap } from "@/components/impact-map";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Action = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  createdAt: { _seconds: number; _nanoseconds: number; };
  validationScore?: number;
  org: {
    name: string;
    slug: string;
    image?: string;
  }
};

const ImpactPage = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    category: '',
  });

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/wall')
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setActions(data);
        } else {
          setActions([]);
          console.error("API did not return an array of actions:", data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch actions:", err);
        setActions([]);
        setIsLoading(false);
      });
  }, []);
  
  const filteredActions = useMemo(() => {
    if (!Array.isArray(actions)) return [];
    return actions.filter(action => {
      const locationMatch = filters.location ? action.location?.toLowerCase().includes(filters.location.toLowerCase()) : true;
      const categoryMatch = filters.category ? action.category === filters.category : true;
      return locationMatch && categoryMatch;
    });
  }, [actions, filters]);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };
  
  const uniqueCategories = useMemo(() => {
    if (!Array.isArray(actions)) return [];
    const categories = new Set(actions.map(action => action.category));
    return Array.from(categories).filter(cat => !!cat);
  }, [actions]);

  const mapLocations = useMemo(() => {
    if (!Array.isArray(filteredActions)) return [];
    return filteredActions.map(action => ({
      id: action.id,
      name: action.title,
      position: {
        lat: Math.random() * 180 - 90,
        lng: Math.random() * 360 - 180,
      }
    }));
  }, [filteredActions]);
  
  const getInitials = (name: string) => (name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

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

      {!isLoading && filteredActions.length === 0 && (
        <div className="text-center text-muted-foreground py-16">
            <p>No verified actions to display yet.</p>
            <p>Be the first to submit one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredActions.map(action => (
          <Card key={action.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg flex flex-col">
            <CardHeader className="flex flex-row items-center gap-3 p-4">
               <Avatar className="h-10 w-10 border">
                  <AvatarImage src={action.org.image} alt={action.org.name} />
                  <AvatarFallback>{getInitials(action.org.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Link href={`/org/${action.org.slug}`} className="font-semibold hover:underline">{action.org.name}</Link>
                  <p className="text-xs text-muted-foreground">{new Date(action.createdAt._seconds * 1000).toLocaleDateString()}</p>
                </div>
                 <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-square w-full">
                <Image 
                  src={`https://picsum.photos/seed/${action.id}/600`} 
                  alt={action.title} 
                  fill 
                  className="object-cover" 
                  data-ai-hint="regenerative action"
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 flex flex-col items-start flex-grow">
               <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Award className="h-4 w-4" />
                  <span>Score: {action.validationScore || 'N/A'}</span>
               </div>
               <p className="w-full text-sm mt-2">
                 <Link href={`/org/${action.org.slug}`} className="font-semibold hover:underline">{action.org.name}</Link>
                 <span className="text-muted-foreground"> {action.title}</span>
               </p>
               <div className="w-full mt-auto pt-4">
                <Button variant="secondary" size="sm" className="w-full" asChild>
                  <Link href={`/action/${action.id}`}>View Certificate</Link>
                </Button>
               </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ImpactPage;
