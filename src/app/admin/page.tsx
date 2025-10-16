import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const mockSubmissions = [
  { id: 1, actionName: 'Community Tree Planting Day', submitterName: 'Jane Doe', date: '2024-05-20', status: 'pending' as const },
  { id: 2, actionName: 'River Cleanup Drive', submitterName: 'John Smith', date: '2024-05-18', status: 'approved' as const },
  { id: 3, actionName: 'School Composting Workshop', submitterName: 'Alice Johnson', date: '2024-05-15', status: 'rejected' as const },
  { id: 4, actionName: 'Beach Cleanup', submitterName: 'Bob Brown', date: '2024-05-12', status: 'approved' as const },
];

const statusStyles = {
  pending: "default",
  approved: "secondary",
  rejected: "destructive",
};

const AdminPage = () => {
  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="font-headline text-4xl font-bold text-primary">
          Admin Panel
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Review and approve intent submissions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Name</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubmissions.map(submission => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.actionName}</TableCell>
                  <TableCell>{submission.submitterName}</TableCell>
                  <TableCell>{submission.date}</TableCell>
                  <TableCell>
                    <Badge variant={statusStyles[submission.status]}>{submission.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {submission.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPage;
