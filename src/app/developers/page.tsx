
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
          Integrate your applications with the RegenImpactHub ecosystem. Our open API allows you to submit actions and retrieve verified impact data.
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
              Submits a new regenerative action to the platform. The action will be created with the status `submitted`, awaiting AI pre-check and human validation. This endpoint triggers the asynchronous AI verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="font-semibold text-lg">Authentication</h3>
            <p className="text-sm text-muted-foreground">Requests must include an `Authorization: Bearer &lt;FirebaseIdToken&gt;` header. The Firebase ID token should be generated on the client-side after user login.</p>

            <h3 className="font-semibold text-lg">Request Body</h3>
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
                  <TableCell className="font-mono">category</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>Category of the action (e.g., "Agroforestry").</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">location</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>Location where the action took place (e.g., "Recife, Brazil").</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">mediaUrls</TableCell>
                  <TableCell>array</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>An array of strings, where each string is a URL to a piece of evidence (image, video, document, etc.).</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h3 className="font-semibold text-lg mt-4">Example Usage (cURL)</h3>
            <CodeBlock>
{`curl -X POST https://your-regenimpacthub-url.com/api/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \\
  -d '{
    "orgId": "org_12345",
    "projectId": "proj_67890",
    "title": "Cleanup Drive at Boa Viagem Beach",
    "description": "We organized a group of 30 volunteers and removed over 100kg of trash from the sand and sea at Boa Viagem beach, Recife.",
    "category": "Waste Management",
    "location": "Recife, PE, Brazil",
    "mediaUrls": [
      "https://example.com/cleanup-photo.jpg"
    ]
  }'`}
            </CodeBlock>

             <h3 className="font-semibold text-lg mt-4">Success Response (200)</h3>
            <CodeBlock>
{`{
  "success": true,
  "actionId": "aBcDeFgHiJkLmNoPqRsT"
}`}
            </CodeBlock>
          </CardContent>
        </Card>

        {/* GET ORG PROFILE ENDPOINT */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-4">
              <Badge>GET</Badge>
              <span>/api/org/[slug]</span>
            </CardTitle>
            <CardDescription>
              Retrieves the public profile of an organization and a list of all its verified actions (`status: "verified"`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <h3 className="font-semibold text-lg">URL Parameters</h3>
             <p className="text-sm text-muted-foreground">Replace `[slug]` with the organization's unique slug (e.g., `/api/org/coletivo-mulungu`).</p>

             <h3 className="font-semibold text-lg mt-4">Example Usage (JavaScript Fetch)</h3>
            <CodeBlock>
{`fetch('https://your-regenimpacthub-url.com/api/org/regensampa-coletivo')
  .then(response => response.json())
  .then(data => {
    console.log('Organization:', data.organization);
    console.log('Verified Actions:', data.actions);
    // Render the profile and actions in your UI
  });`}
            </CodeBlock>

            <h3 className="font-semibold text-lg mt-4">Example Response (200)</h3>
            <CodeBlock>
{`{
  "organization": {
    "id": "org_12345",
    "name": "RegenSampa Coletivo",
    "slug": "regensampa-coletivo",
    "bio": "A collective focused on regenerating urban spaces in São Paulo.",
    "isVerified": true,
    "createdAt": { "_seconds": 1729353000, "_nanoseconds": 0 }
  },
  "actions": [
    {
      "id": "actionId1",
      "orgId": "org_12345",
      "projectId": "projId_456",
      "title": "Community Garden in Vila Madalena",
      "description": "Started a community garden with 15 local families.",
      "status": "verified",
      "validationScore": 85,
      "isPublic": true,
      "createdAt": { "_seconds": 1729353921, "_nanoseconds": 123000000 },
      "validatedAt": { "_seconds": 1729353950, "_nanoseconds": 456000000 }
    }
  ]
}`}
            </CodeBlock>
          </CardContent>
        </Card>

         {/* LEAP APIs */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-4">
              <Badge variant="outline">LEAP APIs</Badge>
              <span>/api/leap/...</span>
            </CardTitle>
            <CardDescription>
              Endpoints to manage the LEAP assessment module for SMEs (Small and Medium-sized Enterprises).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>The platform uses a series of endpoints to conduct the LEAP assessment (Locate, Evaluate, Assess, Prepare). Currently, they are used internally by the application wizard, but they are documented here for future B2B integrations.</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/start</code>: Initiates a new assessment for the authenticated user's organization. Returns an `assessmentId`.</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/l</code>: Saves the data for the "Locate" step.</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/e</code>: Saves the data for the "Evaluate" step.</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/a</code>: Saves the data for the "Assess" step.</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/p</code>: Saves the data for the "Prepare" step and finalizes the assessment.</li>
            </ul>
             <p>All requests to these endpoints require authentication via `FirebaseIdToken`.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevelopersPage;
