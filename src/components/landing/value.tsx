
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users, Globe } from "lucide-react";

const valueProps = [
  {
    icon: User,
    title: "For Individuals",
    points: [
      "Your ecological actions become visible, verified, and shareable.",
      "You build a story of contribution over time."
    ]
  },
  {
    icon: Users,
    title: "For Groups & Educators",
    points: [
      "You gain tools to showcase your impact and access support.",
      "You create a regenerative culture rooted in action."
    ]
  },
  {
    icon: Globe,
    title: "For the Ecosystem",
    points: [
      "We build a living archive of grassroots regeneration.",
      "We shift the narrative from extractive to restorative."
    ]
  }
];

const Value = () => {
  return (
    <section className="bg-secondary py-16 lg:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
            The Real Value
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Making every regenerative action count for everyone involved.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {valueProps.map((prop) => (
            <Card key={prop.title} className="text-center">
              <CardHeader className="items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <prop.icon className="h-6 w-6" />
                </div>
                <CardTitle className="font-headline text-2xl pt-4">{prop.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  {prop.points.map(point => <li key={point}>{point}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Value;
