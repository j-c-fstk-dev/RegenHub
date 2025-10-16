import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Users, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const mockIntents = [
  { id: 1, tag: 'coletivo-mulungu', title: 'Planted 26 Native Trees', location: 'Recife, Brazil', participants: 15, imageUrl: 'https://picsum.photos/seed/impact1/400/300', imageHint: 'tree planting', verified: true },
  { id: 2, tag: 'baba-na-floresta', title: 'River Cleanup Drive', location: 'Olinda, Brazil', participants: 23, imageUrl: 'https://picsum.photos/seed/impact2/400/300', imageHint: 'river cleanup', verified: true },
  { id: 3, tag: 'escola-verde', title: 'School Composting Workshop', location: 'São Paulo, Brazil', participants: 40, imageUrl: 'https://picsum.photos/seed/impact3/400/300', imageHint: 'school workshop', verified: false },
  { id: 4, tag: 'cidade-limpa', title: 'Beach Cleanup', location: 'Rio de Janeiro, Brazil', participants: 50, imageUrl: 'https://picsum.photos/seed/impact4/400/300', imageHint: 'beach cleanup', verified: true },
  { id: 5, tag: 'INT-9823-XR7', title: 'Community Garden Setup', location: 'Belo Horizonte, Brazil', participants: 12, imageUrl: 'https://picsum.photos/seed/impact5/400/300', imageHint: 'community garden', verified: true },
  { id: 6, tag: 'coletivo-mulungu', title: 'Seed Sovereignty Talk', location: 'Recife, Brazil', participants: 8, imageUrl: 'https://picsum.photos/seed/impact6/400/300', imageHint: 'public speaking', verified: false },
];

const ImpactPage = () => {
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
            <Input placeholder="Filter by city..." />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planting">Planting</SelectItem>
                <SelectItem value="cleanup">Cleanup</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" placeholder="Filter by date..." />
            <Input placeholder="Filter by tag or project..." />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockIntents.map(intent => (
          <Card key={intent.id} className="overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardHeader className="p-0">
              <div className="relative h-48 w-full">
                <Image src={intent.imageUrl} alt={intent.title} fill className="object-cover" data-ai-hint={intent.imageHint}/>
                {intent.verified && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                    </div>
                )}
              </div>
              <div className="p-4">
                <Link href={`/impact/${intent.tag}`} className="text-sm font-medium text-accent hover:underline">{`@${intent.tag}`}</Link>
                <CardTitle className="mt-1 font-headline text-xl">{intent.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Map className="h-4 w-4" />
                    <span>{intent.location}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{intent.participants} participants</span>
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
