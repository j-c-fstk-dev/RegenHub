
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, Database, FileClock, WifiOff, Sprout } from "lucide-react";
import { SeedProtocolWizard } from '@/components/kernel/SeedProtocolWizard';
import { NewActionWizard } from '@/components/kernel/NewActionWizard';
import { getAllLocalActions } from '@/lib/localStore';

const KernelPage = () => {
    const [seedCompleted, setSeedCompleted] = useState<boolean | null>(null);
    const [showNewActionWizard, setShowNewActionWizard] = useState(false);
    const [localActions, setLocalActions] = useState<any[]>([]);

    const checkSeedStatus = useCallback(async () => {
        try {
            const flag = localStorage.getItem('seedCompleted') === 'true';
            setSeedCompleted(flag);
        } catch (e) {
            setSeedCompleted(false);
        }
    }, []);

    const fetchLocalActions = useCallback(async () => {
        if (seedCompleted) {
            const actions = await getAllLocalActions();
            setLocalActions(actions);
        }
    }, [seedCompleted]);
    
    useEffect(() => {
        checkSeedStatus();
    }, [checkSeedStatus]);

    useEffect(() => {
        fetchLocalActions();
    }, [fetchLocalActions]);

    const handleSeedComplete = () => {
        setSeedCompleted(true);
        fetchLocalActions();
    };

    const handleActionSaved = () => {
        setShowNewActionWizard(false);
        fetchLocalActions(); // Refresh the list
    };

    if (seedCompleted === null) {
        return <div className="flex h-[60vh] items-center justify-center">Loading Kernel...</div>;
    }

    if (!seedCompleted) {
        return <SeedProtocolWizard onComplete={handleSeedComplete} />;
    }
    
    if (showNewActionWizard) {
        return <NewActionWizard onDone={handleActionSaved} onBack={() => setShowNewActionWizard(false)} />;
    }

    return (
        <div className="container py-12">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-4xl font-bold text-primary flex items-center gap-3"><Sprout/> RegenKernel</h1>
                    <p className="mt-2 text-lg text-muted-foreground flex items-center gap-2">
                        <WifiOff className="h-5 w-5" /> Your offline-first hub for regenerative action.
                    </p>
                </div>
                 <Button size="lg" onClick={() => setShowNewActionWizard(true)}>
                    <PlusCircle className="mr-2 h-5 w-5"/> Register New Action
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database/> Locally Saved Actions</CardTitle>
                    <CardDescription>These actions are saved on your device and ready to be synced.</CardDescription>
                </CardHeader>
                <CardContent>
                   {localActions.length > 0 ? (
                       <div className="grid gap-4">
                           {localActions.map(action => (
                               <Card key={action.id} className="flex items-center justify-between p-4">
                                   <div>
                                       <p className="font-semibold">{action.title}</p>
                                       <p className="text-sm text-muted-foreground">
                                           Created on {new Date(action.timestamp).toLocaleDateString()}
                                       </p>
                                   </div>
                                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <FileClock className="h-4 w-4"/>
                                        <span>Ready to Sync</span>
                                   </div>
                               </Card>
                           ))}
                       </div>
                   ) : (
                       <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground font-medium">No actions saved locally yet.</p>
                            <p className="text-sm text-muted-foreground mt-2">Click "Register New Action" to start.</p>
                       </div>
                   )}
                </CardContent>
                 <CardFooter>
                    <Button disabled>
                        Sync All Actions
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default KernelPage;

    