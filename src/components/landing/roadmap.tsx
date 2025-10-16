import { Rocket } from "lucide-react";

const roadmapItems = [
    {
        date: "October–November 2025",
        title: "MVP Launch",
        details: [
            "Submission + public wall + verification",
            "First badges and certificates"
        ]
    },
    {
        date: "December 2025 – March 2026",
        title: "Personalization & Reporting",
        details: [
            "Personal dashboards per tag",
            "PDF impact reports",
            "Mobile-first optimization"
        ]
    },
    {
        date: "Mid-2026",
        title: "Ecosystem Integration",
        details: [
            "Gitcoin & ReFi integrations",
            "NFT minting for verified intents",
            "DAO partnerships and on-chain funding support"
        ]
    },
    {
        date: "Long-Term",
        title: "Public Infrastructure",
        details: [
            "Regen Hub as public infrastructure",
            "Verified Intents as reputational credentials",
            "Global data for open environmental research"
        ]
    }
];

const Roadmap = () => {
    return (
        <section className="py-16 lg:py-24">
            <div className="container max-w-4xl">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
                        The Roadmap
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Our journey towards building a global infrastructure for regenerative action.
                    </p>
                </div>

                <div className="relative mt-16 space-y-12">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
                    {roadmapItems.map((item, index) => (
                        <div key={item.date} className="relative flex items-start gap-6 md:gap-12">
                            <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary md:absolute md:left-1/2 md:top-0 md:h-8 md:w-8 md:-translate-x-1/2" />
                            <div className={`w-full space-y-2 md:w-1/2 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12 md:ml-auto'}`}>
                                <p className="font-bold text-accent">{item.date}</p>
                                <h3 className="text-xl font-bold font-headline text-primary">{item.title}</h3>
                                <ul className="list-disc list-inside text-muted-foreground">
                                    {item.details.map(detail => <li key={detail}>{detail}</li>)}
                                </ul>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-center pt-8">
                      <Rocket className="h-10 w-10 text-accent"/>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Roadmap;
