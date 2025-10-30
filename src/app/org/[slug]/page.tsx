'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle, Users, Map, Calendar, Hash, Loader2, AlertCircle, Building } from "lucide-react";
import Link from 'next/link';

type Action = {
  id: string;
  title: string;
  createdAt: { _seconds: number; _nanoseconds: number; };
  location: string;
  status: string;
};

type Organization = {
  name: string;
  slug: string;
  bio: string;
};

type OrgProfileData = {
  organization: Organization;
  actions: Action[];
};


const StatCard = ({ icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const OrgProfilePage = ({ params }: { params: { slug: string } }) => {
    const [profileData, setProfileData] = useState<OrgProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!params.slug) return;
            setIsLoading(true);
            try {
                const response = await fetch(`/api/org/${params.slug}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Organization not found.');
                }
                const data: OrgProfileData = await response.json();
                setProfileData(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load organization profile.';
                setError(message);
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [params.slug]);


    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
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

    if (!profileData) {
        return <div className="container py-12 text-center">Organization not found.</div>;
    }

    const { organization, actions } = profileData;


    return (
        <div className="container py-12">
            <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <p className="text-sm font-medium text-accent flex items-center gap-2"><Building/> Organization Profile</p>
                    <h1 className="font-headline text-4xl font-bold text-primary">
                        {organization.name}
                    </h1>
                     <p className="mt-2 text-lg text-muted-foreground">{organization.bio}</p>
                </div>
                <Button disabled>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report (PDF)
                </Button>
            </header>

            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Hash/>} label="Actions Verified" value={actions.length} />
                {/* Other stats can be calculated and added here */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Verified Actions</CardTitle>
                </CardHeader>
                <CardContent>
                     {actions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action Title</TableHead>
                                    <TableHead><Calendar className="inline-block h-4 w-4 mr-1"/>Date</TableHead>
                                    <TableHead><Map className="inline-block h-4 w-4 mr-1"/>Location</TableHead>
                                    <TableHead className="text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {actions.map(action => (
                                    <TableRow key={action.id}>
                                        <TableCell className="font-medium">{action.title}</TableCell>
                                        <TableCell>{new Date(action.createdAt._seconds * 1000).toLocaleDateString()}</TableCell>
                                        <TableCell>{action.location || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/action/${action.id}`}>View Certificate</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No verified actions yet.</p>
                            <p className="text-sm text-muted-foreground">Once actions are submitted and approved, they will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrgProfilePage;
