
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";


const WorkInProgressPage = () => {
    const wipImage = PlaceHolderImages.find(p => p.id === 'work-in-progress');

    return (
        <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Card className="max-w-2xl text-center shadow-lg">
                {wipImage && (
                     <CardContent className="p-0">
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                           <Image 
                                src={wipImage.imageUrl} 
                                alt={wipImage.description}
                                fill
                                className="object-cover"
                                data-ai-hint={wipImage.imageHint}
                           />
                        </div>
                    </CardContent>
                )}
                <CardHeader>
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                       <Wrench className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline text-3xl">Work In Progress</CardTitle>
                    <CardDescription className="text-lg">
                        This feature is currently under construction and will be available soon.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">We're working hard to bring this to you. Thank you for your patience!</p>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default WorkInProgressPage;
