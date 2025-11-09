
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
          Integre suas aplicações com o ecossistema Regen Impact. Nossa API aberta permite que você submeta ações e recupere dados de impacto verificados.
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
              Submete uma nova ação regenerativa para a plataforma. A ação será criada com o status `submitted`, aguardando a pré-verificação da IA e a validação humana. Este endpoint dispara a verificação assíncrona por IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <h3 className="font-semibold text-lg">Autenticação</h3>
            <p className="text-sm text-muted-foreground">Requisições devem incluir um header `Authorization: Bearer &lt;FirebaseIdToken&gt;`. O token de ID do Firebase deve ser gerado no lado do cliente após o login do usuário.</p>

            <h3 className="font-semibold text-lg">Corpo da Requisição (Body)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parâmetro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 <TableRow>
                  <TableCell className="font-mono">title</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Sim</TableCell>
                  <TableCell>Um título conciso para a ação regenerativa.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">description</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Sim</TableCell>
                  <TableCell>Uma descrição detalhada da ação realizada.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">orgId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Sim</TableCell>
                  <TableCell>O ID da organização que está submetendo a ação.</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">projectId</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Sim</TableCell>
                  <TableCell>O ID do projeto ao qual esta ação pertence.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">category</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Não</TableCell>
                  <TableCell>Categoria da ação (ex: "Agrofloresta").</TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell className="font-mono">location</TableCell>
                  <TableCell>string</TableCell>
                  <TableCell>Não</TableCell>
                  <TableCell>Localização onde a ação ocorreu (ex: "Recife, Brasil").</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-mono">mediaUrls</TableCell>
                  <TableCell>array</TableCell>
                  <TableCell>Não</TableCell>
                  <TableCell>Um array de strings, onde cada string é uma URL para uma evidência (imagem, vídeo, documento, etc.).</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h3 className="font-semibold text-lg mt-4">Exemplo de Uso (cURL)</h3>
            <CodeBlock>
{`curl -X POST https://your-regenimpact-url.com/api/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <SEU_FIREBASE_ID_TOKEN>" \\
  -d '{
    "orgId": "org_12345",
    "projectId": "proj_67890",
    "title": "Mutirão de Limpeza na Praia de Boa Viagem",
    "description": "Nós organizamos um grupo de 30 voluntários e removemos mais de 100kg de lixo da faixa de areia e do mar na praia de Boa Viagem, Recife.",
    "category": "Waste Management",
    "location": "Recife, PE, Brazil",
    "mediaUrls": [
      "https://example.com/foto-do-mutirao.jpg"
    ]
  }'`}
            </CodeBlock>

             <h3 className="font-semibold text-lg mt-4">Resposta de Sucesso (200)</h3>
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
              Recupera o perfil público de uma organização e uma lista de todas as suas ações já verificadas (`status: "verified"`).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <h3 className="font-semibold text-lg">Parâmetros de URL</h3>
             <p className="text-sm text-muted-foreground">Substitua `[slug]` pelo slug único da organização (ex: `/api/org/coletivo-mulungu`).</p>

             <h3 className="font-semibold text-lg mt-4">Exemplo de Uso (JavaScript Fetch)</h3>
            <CodeBlock>
{`fetch('https://your-regenimpact-url.com/api/org/regensampa-coletivo')
  .then(response => response.json())
  .then(data => {
    console.log('Organization:', data.organization);
    console.log('Verified Actions:', data.actions);
    // Renderize o perfil e as ações na sua UI
  });`}
            </CodeBlock>

            <h3 className="font-semibold text-lg mt-4">Exemplo de Resposta (200)</h3>
            <CodeBlock>
{`{
  "organization": {
    "id": "org_12345",
    "name": "RegenSampa Coletivo",
    "slug": "regensampa-coletivo",
    "bio": "Um coletivo focado em regenerar espaços urbanos em São Paulo.",
    "isVerified": true,
    "createdAt": { "_seconds": 1729353000, "_nanoseconds": 0 }
  },
  "actions": [
    {
      "id": "actionId1",
      "orgId": "org_12345",
      "projectId": "projId_456",
      "title": "Horta Comunitária na Vila Madalena",
      "description": "Iniciamos uma horta comunitária com 15 famílias locais.",
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
              Endpoints para gerenciar o módulo de assessment LEAP para PMEs (Pequenas e Médias Empresas).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>A plataforma utiliza uma série de endpoints para conduzir o assessment LEAP (Locate, Evaluate, Assess, Prepare). Atualmente, eles são utilizados internamente pelo wizard da aplicação, mas estão sendo documentados aqui para futuras integrações B2B.</p>
            <ul className="list-disc pl-5 space-y-2">
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/start</code>: Inicia um novo assessment para a organização do usuário autenticado. Retorna um `assessmentId`.</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/l</code>: Salva os dados do passo "Locate".</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/e</code>: Salva os dados do passo "Evaluate".</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/a</code>: Salva os dados do passo "Assess".</li>
                <li><code className="font-mono bg-secondary px-1 py-0.5 rounded">POST /api/leap/assessment/[assessmentId]/p</code>: Salva os dados do passo "Prepare" e finaliza o assessment.</li>
            </ul>
             <p>Todas as requisições para estes endpoints requerem autenticação via `FirebaseIdToken`.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DevelopersPage;
