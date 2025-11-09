
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Leaf, HandHeart, Code2, Heart, Users, Globe, Building, GitBranch, ShieldCheck } from "lucide-react";
import Link from "next/link";

const SectionCard = ({ title, description, children, icon: Icon }: { title: string, description?: string, children: React.ReactNode, icon?: React.ElementType }) => (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-3">
                {Icon && <Icon className="h-6 w-6 text-primary" />}
                {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/80">
            {children}
        </CardContent>
    </Card>
);

const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <li className="flex items-start gap-3">
        <CheckCircle className="mt-1 h-4 w-4 shrink-0 text-primary" />
        <span className="text-foreground/90">{children}</span>
    </li>
);

const AboutPage = () => {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="mb-8 text-center">
          <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
            About RegenHub
          </h1>
        </header>

        <SectionCard title="Our Mission">
            <p className="text-lg">
                RegenHub exists to make regenerative work visible, verifiable, and fundable. We help people and organizations transform everyday positive actions—planting, teaching, coding, caring—into credible, public proof of impact.
            </p>
        </SectionCard>

        <SectionCard title="What is RegenHub?">
            <p>
                RegenHub is an open-source platform that records, validates, and showcases regenerative actions at any scale. It gives grassroots groups, SMEs, DAOs, and communities a way to:
            </p>
            <ul className="space-y-3">
                <BulletPoint>register actions with clear evidence,</BulletPoint>
                <BulletPoint>get an AI-assisted review and human verification,</BulletPoint>
                <BulletPoint>publish results on a public profile and impact wall,</BulletPoint>
                <BulletPoint>(optionally) certify reports on-chain for transparency and long-term integrity.</BulletPoint>
            </ul>
        </SectionCard>

        <SectionCard title="Who it’s for">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1"><strong className="flex items-center gap-2"><Leaf/> Grassroots & NGOs:</strong> show the real work behind climate, biodiversity, food, and social projects.</div>
                <div className="space-y-1"><strong className="flex items-center gap-2"><Building/> SMEs & Cooperatives:</strong> measure and communicate environmental and social practices.</div>
                <div className="space-y-1"><strong className="flex items-center gap-2"><Users/> Civic groups & educators:</strong> document community learning, culture, care, and local resilience.</div>
                <div className="space-y-1"><strong className="flex items-center gap-2"><Code2/> Builders (tech, Web3, open source):</strong> turn digital contributions into recognized impact.</div>
            </div>
        </SectionCard>
        
        <SectionCard title="How RegenHub works (in three steps)">
             <ol className="space-y-4">
                <li><strong>1. Register</strong> — Use our Submit Impact Wizard to log a new action. Describe what happened, where, when, who participated, and attach evidence (photos, links, files).</li>
                <li><strong>2. Validate</strong> — An AI “pre-check” organizes and scores the submission for clarity and likely impact; a human reviewer can then approve and publish it.</li>
                <li><strong>3. Show & share</strong> — Verified actions appear on the organization’s public page and the global Impact Wall. For businesses, the LEAP Assessment generates an AI-assisted diagnostic report you can share with partners, funders, and your community.</li>
             </ol>
        </SectionCard>

        <SectionCard title="LEAP Assessment (Locate, Evaluate, Assess, Prepare)">
            <p>LEAP is a simple, guided self-assessment that helps organizations understand how they depend on and affect nature—and what to do next.</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Locate:</strong> sector, biome, geography, critical resources.</li>
                <li><strong>Evaluate:</strong> dependencies and potential positive/negative impacts.</li>
                <li><strong>Assess:</strong> maturity across five dimensions (awareness, actions, monitoring, partnerships, communication).</li>
                <li><strong>Prepare:</strong> a short action plan (priorities, timeframe, responsible).</li>
            </ul>
            <p>At the end, RegenHub generates a concise LEAP Regenerative Diagnostic Report with scores, an AI narrative summary, and practical recommendations. You can export as PDF or publish a public link.</p>
        </SectionCard>

        <SectionCard title="What counts as “impact”">
            <p>Regeneration is broader than carbon. RegenHub recognizes four primary domains:</p>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                <div><strong className="flex items-center gap-2"><Leaf className="text-primary"/> Ecological:</strong> cultivation, reforestation, soil health, water systems, waste reduction, biodiversity.</div>
                <div><strong className="flex items-center gap-2"><HandHeart className="text-primary"/> Social:</strong> education, mutual aid, community events, solidarity, listening and care.</div>
                <div><strong className="flex items-center gap-2"><GitBranch className="text-primary"/> Digital / Systemic:</strong> open-source tools, protocols, datasets, dashboards, communities, games.</div>
                <div><strong className="flex items-center gap-2"><Heart className="text-primary"/> Individual / Inner:</strong> meditation, therapy, learning, gratitude, embodied practices.</div>
            </div>
             <p className="pt-2">Each action type has a base score. Final scores factor in impact depth, duration/recurrence, and evidence quality to reflect meaningful, verifiable work.</p>
        </SectionCard>
        
        <SectionCard title="Key Features">
             <ul className="space-y-3">
                <BulletPoint><strong>Submit Impact Wizard:</strong> clean, step-by-step flow with autosave, resume, geolocation, and media evidence.</BulletPoint>
                <BulletPoint><strong>Action Type Selector:</strong> grouped by domains, with search, tags, and community-proposed types.</BulletPoint>
                <BulletPoint><strong>AI-assisted validation:</strong> structured pre-check for clarity, consistency, risk flags, and recommended scores.</BulletPoint>
                <BulletPoint><strong>LEAP Wizard:</strong> simple self-assessment with instant scoring and an AI-generated diagnostic.</BulletPoint>
                <BulletPoint><strong>Public pages:</strong> organization profile, verified actions, and shareable LEAP reports.</BulletPoint>
                <BulletPoint><strong>Optional on-chain proof:</strong> publish report hashes and metadata on low-cost EVM networks (e.g., Celo) and mint a Hypercert (ERC-1155) linking to IPFS artifacts for long-term integrity and wider interoperability in the ReFi ecosystem.</BulletPoint>
            </ul>
        </SectionCard>

        <SectionCard title="Technology">
            <ul className="space-y-3">
                <li><strong>Frontend:</strong> Next.js + TypeScript, Tailwind, shadcn/ui.</li>
                <li><strong>Auth & database:</strong> Firebase Authentication + Firestore with rule-based, owner-first permissions.</li>
                <li><strong>AI:</strong> Genkit + Google AI (Gemini) for pre-validation and LEAP narrative generation.</li>
                <li><strong>Storage:</strong> Firebase Storage for uploads; IPFS (via pinning services) for public reports.</li>
                <li><strong>On-chain (optional):</strong> ProofRegistry (event-based anchoring) + Hypercerts (ERC-1155) for interoperable certification.</li>
            </ul>
        </SectionCard>

        <SectionCard title="Principles we stand by">
            <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg"><strong>Real work, real people.</strong> Make the invisible visible without gatekeeping.</div>
                <div className="p-4 bg-secondary/50 rounded-lg"><strong>Evidence over hype.</strong> Small steps count when they are concrete and repeatable.</div>
                <div className="p-4 bg-secondary/50 rounded-lg"><strong>Local first, global later.</strong> Design for communities and biomes; scale through interoperability.</div>
                <div className="p-4 bg-secondary/50 rounded-lg"><strong>Open foundations.</strong> Open standards, open data models, and portable proofs.</div>
                <div className="p-4 bg-secondary/50 rounded-lg"><strong>Care for humans.</strong> Social and inner regeneration are first-class impact domains.</div>
            </div>
        </SectionCard>

        <div className="text-center">
            <h2 className="font-headline text-3xl font-bold text-primary">RegenHub is for the doers.</h2>
            <p className="mt-2 text-lg text-muted-foreground">The gardeners, coders, teachers, healers, organizers—who move us from extraction to regeneration. If that’s you: welcome in.</p>
             <Button asChild size="lg" className="mt-6">
              <Link href="/register">Submit Your Action</Link>
            </Button>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
