
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle, Users, Map, Calendar, Hash } from "lucide-react";

const mockTagData = {
    tag: 'coletivo-mulungu',
    stats: {
        actions: 4,
        participants: 38,
        trees: 26,
        trashKg: 74,
    },
    actions: [
        { id: 1, title: 'Planted 26 Native Trees', date: '2025-10-15', location: 'Recife, Brazil' },
        { id: 6, title: 'Seed Sovereignty Talk', date: '2025-10-22', location: 'Recife, Brazil' },
        { id: 8, title: 'Compost System Build', date: '2025-11-05', location: 'Olinda, Brazil' },
        { id: 9, title: 'River Margin Cleanup', date: '2025-11-12', location: 'Recife, Brazil' },
    ]
};

const StatCard = ({ icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const TagPage = ({ params }: { params: { tag: string } }) => {
    return (
        <div className="container py-12">
            <header className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <p className="text-sm font-medium text-accent">Impact Dashboard</p>
                    <h1 className="font-headline text-4xl font-bold text-primary">
                        @{params.tag}
                    </h1>
                </div>
                <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report (PDF)
                </Button>
            </header>

            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Hash/>} label="Actions Registered" value={mockTagData.stats.actions} />
                <StatCard icon={<Users/>} label="Total Participants" value={mockTagData.stats.participants} />
                <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 4a8 8 0 0 1 8 7.8c0 7.3-8 11.8-8 11.8z"/><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>} label="Trees Planted" value={mockTagData.stats.trees} />
                <StatCard icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5.59C12 3.61 10.39 2 8.41 2s-3.59 1.61-3.59 3.59c0 2.21 2.3 3.92 3.59 5.38.9 1.08 1.41 2.34 1.41 3.53v2.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2.5c0-1.19.51-2.45 1.41-3.53C17.7 9.51 20 7.8 20 5.59 20 3.61 18.39 2 16.41 2s-3.59 1.61-3.59 3.59z"/></svg>} label="Trash Removed (Kg)" value={mockTagData.stats.trashKg} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Actions Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Action Title</TableHead>
                                <TableHead><Calendar className="inline-block h-4 w-4 mr-1"/>Date</TableHead>
                                <TableHead><Map className="inline-block h-4 w-4 mr-1"/>Location</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockTagData.actions.map(action => (
                                <TableRow key={action.id}>
                                    <TableCell className="font-medium">{action.title}</TableCell>
                                    <TableCell>{action.date}</TableCell>
                                    <TableCell>{action.location}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-primary">
                                            <CheckCircle className="h-4 w-4"/>
                                            <span>Verified</span>
                                        </div>
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

export default TagPage;
