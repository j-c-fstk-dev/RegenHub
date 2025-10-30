
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground overflow-x-auto">
    <code>{children}</code>
  </pre>
);

const DevelopersPage = () => {
  return (
    <div className="container py-12">
      <header className="mb-12 text-center">
        <div className="inline-block rounded-full bg-primary/10 p-4 mb-4">
            <Code2 className="h-8 w-8 text-primary"/>
        </div>
        <h1 className="font-headline text-4xl font-bold text-primary md:text-5xl">
          Developer API
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
          Integrate your applications with the Regen Impact ecosystem. Our open API allows you to submit actions and retrieve verified impact data.
        </p>
      </header>

      <div className="space-y-12">
        {/* SUBMIT ACTION ENDPOINT */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-4">
              <Badge variant="secondary">POST</Badge>
              <span>/api/submit</span>
            </CardTitle>
            <CardDescription>
              Submit a new regenerative action to the platform. The action will be created with a `submitted` status, awaiting AI pre-check and human verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="font-semibold text-lg">Authentication</h3>
            <p className="text-sm text-muted-foreground">Requests must include an `Authorization: Bearer &lt;FirebaseIdToken&gt;` header.</p>

            <h3 className="font-semibold text-lg">Body Parameters</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-mono">orgId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>The ID of the organization submitting the action.</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">projectId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>The ID of the project this action belongs to.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">title</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>A concise title for the regenerative action.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">description</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>A detailed description of the action performed.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">mediaUrls</TableCell>
                  <TableCell>array</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>An array of strings, where each string is a URL to a piece of evidence (image, video, etc.).</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h3 className="font-semibold text-lg mt-4">Example Usage (cURL)</h3>
            <CodeBlock>
{`curl -X POST https://your-regenimpact-url.com/api/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \\
  -d '{
    "orgId": "orgId_123",
    "projectId": "projId_456",
    "title": "Community Garden Setup",
    "description": "We started a new community garden in the local park, planting vegetables and herbs for everyone to share.",
    "mediaUrls": [
      "https://example.com/garden-photo.jpg"
    ]
  }'`}
            </CodeBlock>

             <h3 className="font-semibold text-lg mt-4">Success Response (200)</h3>
            <CodeBlock>
{`{
  "success": true,
  "actionId": "someActionIdGeneratedByFirestore"
}`}
            </CodeBlock>
          </CardContent>
        </Card>

        {/* GET WALL ENDPOINT */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-4">
              <Badge>GET</Badge>
              <span>/api/wall</span>
            </CardTitle>
            <CardDescription>
              Retrieve a list of the latest 100 verified actions to display on an impact wall or in your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <h3 className="font-semibold text-lg">Query Parameters</h3>
             <p className="text-sm text-muted-foreground">`?all=true` - (For Admin Use) Includes actions with all statuses, not just `verified`.</p>


             <h3 className="font-semibold text-lg mt-4">Example Usage (JavaScript Fetch)</h3>
            <CodeBlock>
{`fetch('https://your-regenimpact-url.com/api/wall')
  .then(response => response.json())
  .then(actions => {
    console.log(actions);
    // Render the actions in your UI
  });`}
            </CodeBlock>

            <h3 className="font-semibold text-lg mt-4">Example Response (200)</h3>
            <CodeBlock>
{`[
  {
    "id": "actionId1",
    "orgId": "orgId_123",
    "projectId": "projId_456",
    "title": "Beach Cleanup Day",
    "description": "Collected 50kg of plastic from the local beach.",
    "status": "verified",
    "validationScore": 85,
    "createdAt": { "_seconds": 1729353921, "_nanoseconds": 123000000 },
    "validatedAt": { "_seconds": 1729353950, "_nanoseconds": 456000000 }
  }
]`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevelopersPage;
