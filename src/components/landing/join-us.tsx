
import { Button } from "@/components/ui/button";
import Link from "next/link";

const JoinUs = () => {
    return (
        <section className="py-16 lg:py-24">
            <div className="container text-center">
                <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
                Our Mission & How to Join
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-lg text-muted-foreground">
                To provide a simple, transparent, and decentralized tool for turning intention into trusted impact — and building a world where every regenerative act is seen, valued, and supported.
                </p>
                 <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground font-medium">
                 Whether you're an artist planting herbs, a teenager teaching compost, or a city school running a clean-up — your action matters. And now, it can be seen.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <Button asChild size="lg">
                        <Link href="/register">Register Your First Action</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary">
                        <Link href="/impact">See What Others Are Doing</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                        <Link href="#">Partner With Us</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default JoinUs;
