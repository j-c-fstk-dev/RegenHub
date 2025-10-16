'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Users, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { useState, useMemo } from "react";

type RegenerativeIntent = {
  id: string;
  customTag?: string;
  actionName: string;
  location: string;
  numberOfParticipants: number;
  mediaUrls: string[];
  status: 'pending' | 'verified' | 'rejected';
  visibleOnWall?: boolean;
  actionType: string;
  actionDate: string;
};

const ImpactPage = () => {
  const firestore = useFirestore();
  const [filters, setFilters] = useState({
    location: '',
    actionType: '',
    date: '',
    tag: ''
  });

  const intentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q = query(
      collection(firestore, 'regenerative_intents'),
      where('status', '==', 'verified'),
      where('visibleOnWall', '!=', false), 
      orderBy('visibleOnWall', 'desc'), 
      orderBy('actionDate', 'desc')
    );

    if (filters.location) {
      q = query(q, where('location', '>=', filters.location), where('location', '<=', filters.location + '\uf8ff'));
    }
    if (filters.actionType) {
      q = query(q, where('actionType', '==', filters.actionType));
    }
    if (filters.date) {
      const startDate = new Date(filters.date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
      q = query(q, where('actionDate', '>=', filters.date), where('actionDate', '<', endDate.toISOString().split('T')[0]));
    }
    if (filters.tag) {
      q = query(q, where('customTag', '==', filters.tag));
    }
    
    return q;
  }, [firestore, filters]);

  const { data: intents, isLoading } = useCollection<RegenerativeIntent>(intentsQuery);

  const handleFilterChange = (filterName: keyof typeof filters, value: string) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };
  
  const uniqueActionTypes = useMemo(() => {
    if (!intents) {
        return [];
    }
    const types = new Set<string>();
    intents.forEach(intent => {
        if (intent.actionType && typeof intent.actionType === 'string' && intent.actionType.trim() !== '') {
            types.add(intent.actionType.trim());
        }
    });
    return Array.from(types).sort();
  }, [intents]);


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

      <Card className="mb-8">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Input placeholder="Filter by city..." onChange={e => handleFilterChange('location', e.target.value)} />
            <Select onValueChange={value => handleFilterChange('actionType', value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueActionTypes.map(type => (
                    type && <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" placeholder="Filter by date..." onChange={e => handleFilterChange('date', e.target.value)} />
            <Input placeholder="Filter by tag or project..." onChange={e => handleFilterChange('tag', e.target.value)} />
          </div>
        </CardContent>
      </Card>
      
      {isLoading && (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
         </div>
      )}

      {!isLoading && (!intents || intents.length === 0) && (
        <div className="text-center text-muted-foreground py-16">
            <p>No verified actions to display yet.</p>
            <p>Be the first to submit one!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {intents && intents.map(intent => (
          <Card key={intent.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="p-0">
              <div className="relative h-48 w-full">
                <Image 
                  src={intent.mediaUrls && intent.mediaUrls.length > 0 ? intent.mediaUrls[0] : 'https://picsum.photos/seed/placeholder/400/300'} 
                  alt={intent.actionName} 
                  fill 
                  className="object-cover" 
                  data-ai-hint="regenerative action"
                />
                {intent.status === 'verified' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                    </div>
                )}
              </div>
              <div className="p-4">
                {intent.customTag && (
                  <Link href={`/impact/${intent.customTag}`} className="text-sm font-medium text-accent hover:underline">{`@${intent.customTag}`}</Link>
                )}
                <CardTitle className="mt-1 font-headline text-xl">{intent.actionName}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Map className="h-4 w-4" />
                    <span>{intent.location}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{intent.numberOfParticipants} participants</span>
                </div>
            </CardContent>
            <CardFooter className="px-4 pb-4">
                <Button variant="outline" className="w-full">View Details</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ImpactPage;
