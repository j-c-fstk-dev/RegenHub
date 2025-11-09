'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Award, Building, Sparkles, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Combined type for action and org
type ActionDetails = {
    id: string;
    title: string;
    description: string;
    status: string;
    validationScore: number;
    aiVerification?: {
        summary: string;
        finalScore: number;
        notes?: string;
    };
    orgId: string;
    org?: { // Org is now optional as it's fetched separately
        name: string;
        slug: string;
    };
};

const ActionDetailPage = ({ params }: { params: { actionId: string } }) => {
    const { actionId } = params;
    const firestore = useFirestore();

    const actionDocRef = useMemoFirebase(() => {
        if (!firestore || !actionId) return null;
        return doc(firestore, 'actions', actionId);
    }, [firestore, actionId]);
    
    const { data: actionData, isLoading: isActionLoading, error: actionError } = useDoc<ActionDetails>(actionDocRef);
    
    const [organization, setOrganization] = useState<{name: string, slug: string} | null>(null);
    const [isOrgLoading, setIsOrgLoading] = useState(true);

    useEffect(() => {
        const fetchOrg = async () => {
            if (!actionData?.orgId || !firestore) {
                setIsOrgLoading(false);
                return;
            }
            try {
                const orgRef = doc(firestore, 'organizations', actionData.orgId);
                const orgSnap = await getDoc(orgRef);
                if (orgSnap.exists()) {
                    const orgData = orgSnap.data();
                    setOrganization({ name: orgData.name, slug: orgData.slug });
                }
            } catch (e) {
                console.error("Failed to fetch organization:", e);
                // Handle org fetch error if needed
            } finally {
                setIsOrgLoading(false);
            }
        };

        if (actionData) {
            fetchOrg();
        } else {
            setIsOrgLoading(false);
        }
    }, [actionData, firestore]);
    
    const isLoading = isActionLoading || isOrgLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (actionError) {
        return (
            <div className="container py-12">
                <Card className="max-w-2xl mx-auto border-destructive/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle /> Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{actionError.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!actionData) {
        return notFound();
    }

    const action = { ...actionData, org: organization };
    const isVerified = action.status === 'verified';

    return (
        <div className="container py-12">
            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden">
                    <CardHeader className="bg-secondary/50 p-6">
                        <Badge variant={isVerified ? "default" : "destructive"} className="w-fit">
                            {isVerified ? (
                                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Verified</span>
                            ) : (
                                <span>Not Verified</span>
                            )}
                        </Badge>
                        <CardTitle className="font-headline text-3xl mt-2">{action.title}</CardTitle>
                        <CardDescription>Regenerative Impact Certificate</CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                               <h3 className="font-semibold text-lg border-b pb-2">Action Details</h3>
                               <p className="text-muted-foreground">{action.description}</p>
                                {action.org && (
                                    <div className="pt-4">
                                        <h4 className="font-semibold text-md flex items-center gap-2 text-primary"><Building className="h-5 w-5"/> Performed by</h4>
                                        <Button variant="link" asChild className="px-0 h-auto text-lg">
                                            <Link href={`/org/${action.org.slug}`}>{action.org.name}</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <Card className="bg-accent/10">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2"><Award className="text-accent"/> Final Score</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-5xl font-bold text-primary">{action.validationScore}</p>
                                        <p className="text-xs text-muted-foreground">Score assigned by human validator.</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                         {action.aiVerification && (
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent"/> AI Analysis</h3>
                                <div className="p-4 rounded-md bg-secondary space-y-3 text-sm">
                                    <div>
                                        <strong className="text-muted-foreground">Summary:</strong>
                                        <p>{action.aiVerification.summary}</p>
                                    </div>
                                    <div>
                                        <strong className="text-muted-foreground">Analysis Notes:</strong>
                                        <p>{action.aiVerification.notes || 'No additional notes.'}</p>
                                    </div>
                                    <div>
                                        <strong className="text-muted-foreground">AI Suggested Score:</strong>
                                        <p className="font-bold">{action.aiVerification.finalScore}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-secondary/50 p-4 flex justify-end">
                        <Button variant="outline">Share Certificate</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ActionDetailPage;
