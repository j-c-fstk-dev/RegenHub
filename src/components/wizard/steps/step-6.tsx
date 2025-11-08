"use client";

import { useWizard } from "../wizard-context";
import { WizardLayout } from "../WizardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Building, Type, FileText, MapPin, Link as LinkIcon, User } from "lucide-react";

const Step6 = () => {
    const { setStep, draft, submitAction, isSubmitting } = useWizard();

    if (!draft) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4">Loading your draft...</p>
            </div>
        );
    }
    
    const handleEdit = (step: number) => {
        setStep(step);
    };

    const isIndividualAction = draft.orgId?.startsWith('user-org-');

    return (
        <WizardLayout
            title="Step 6: Review & Submit"
            description="Please review all the information before submitting. This action will be sent for validation."
            onNext={submitAction}
            onBack={() => setStep(5)}
            isNextDisabled={isSubmitting}
        >
            <div className="space-y-6">
                 {isIndividualAction ? (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-lg">
                               <span className="flex items-center gap-2"><User />Acting as Individual</span> 
                            </CardTitle>
                        </CardHeader>
                         <CardContent>
                             <p className="text-sm text-muted-foreground">This action will be registered to your personal profile.</p>
                         </CardContent>
                    </Card>
                 ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center text-lg">
                               <span className="flex items-center gap-2"><Building />Project</span> 
                               <Button variant="ghost" size="sm" onClick={() => handleEdit(1)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                           <p>This action will be added to the selected project within your organization.</p>
                        </CardContent>
                    </Card>
                 )}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-lg">
                           <span className="flex items-center gap-2"><Type />Action Details</span> 
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(2)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                       <div><strong className="text-muted-foreground w-24 inline-block">Title:</strong> {draft.title || 'Not set'}</div>
                       <div><strong className="text-muted-foreground w-24 inline-block">Type:</strong> {draft.actionTypeName || 'Not set'}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-lg">
                             <span className="flex items-center gap-2"><FileText />Description</span> 
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(3)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                       {draft.description || 'Not set'}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span className="flex items-center gap-2"><MapPin />Location</span> 
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(4)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                        </CardTitle>
                    </CardHeader>
                     <CardContent className="text-sm">
                       {draft.location || 'Not set'}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span className="flex items-center gap-2"><LinkIcon />Evidence</span> 
                           <Button variant="ghost" size="sm" onClick={() => handleEdit(5)}><Edit className="h-4 w-4 mr-2"/>Edit</Button>
                        </CardTitle>
                    </CardHeader>
                     <CardContent className="text-sm">
                       {draft.mediaUrls && draft.mediaUrls.length > 0 && draft.mediaUrls[0].url ? (
                           <ul className="list-disc pl-5 space-y-1">
                               {draft.mediaUrls.map((media, index) => media.url && <li key={index}><a href={media.url} target="_blank" rel="noopener noreferrer" className="underline break-all">{media.url}</a></li>)}
                           </ul>
                       ) : (
                           <p className="text-muted-foreground">No evidence provided.</p>
                       )}
                    </CardContent>
                </Card>
            </div>
        </WizardLayout>
    );
};

export default Step6;
