import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from 'lucide-react';

const CalendarPage = () => {
  return (
    <div className="container py-12">
      <header className="mb-12 text-center">
        <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
          Calendar of Global Actions
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Join a global movement. Find themes and suggestions for each month.
        </p>
      </header>

      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              <span>Upcoming Events</span>
            </CardTitle>
            <CardDescription>
              This is a placeholder for a Google Calendar embed or a custom visual layout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
              <p className="text-muted-foreground">Calendar component coming soon.</p>
            </div>
            <div className="mt-6 space-y-4">
                <h3 className="font-headline text-xl font-bold">Theme of the Month: Waterways Cleanup</h3>
                <p className="text-muted-foreground">
                    This month, we are focusing on cleaning local rivers, streams, and beaches. Any action related to removing trash from water sources is encouraged!
                </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
