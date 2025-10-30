'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Users, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { ImpactMap } from "@/components/impact-map";

type Action = {
  id: string;
  actorId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  createdAt: { _seconds: number; _nanoseconds: number; };
  // Add proofs when that data is available
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
          // If data is not an array (e.g., an error object), set actions to an empty array
          setActions([]);
          console.error("API did not return an array of actions:", data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch actions:", err);
        setActions([]); // Ensure actions is an array on error
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
        // This is a mock position. In a real app, you'd get this from a geocoding service.
        lat: Math.random() * 180 - 90,
        lng: Math.random() * 360 - 180,
      }
    }));
  }, [filteredActions]);

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredActions.map(action => (
          <Card key={action.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="p-0">
              <div className="relative h-48 w-full">
                <Image 
                  src={'https://picsum.photos/seed/action/400/300'} 
                  alt={action.title} 
                  fill 
                  className="object-cover" 
                  data-ai-hint="regenerative action"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                </div>
              </div>
              <div className="p-4">
                <CardTitle className="mt-1 font-headline text-xl">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Map className="h-4 w-4" />
                    <span>{action.location}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{action.category}</span>
                </div>
            </CardContent>
            <CardFooter className="px-4 pb-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/action/${action.id}`}>View Details</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ImpactPage;
