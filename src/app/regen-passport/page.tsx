
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';

const RegenPassportLanding = () => {
    return (
        <div>
            <section id="hero" className="py-24 text-center bg-gradient-to-b from-emerald-900 to-black text-white">
                <div className="container mx-auto px-6">
                    <h1 className="text-5xl font-bold mb-4 font-headline">Regen Passport</h1>
                    <p className="text-xl max-w-2xl mx-auto mb-6">The Identity of Regeneration — connecting who you are, what you do for the planet, and how your impact is recognized across the Web3 ecosystem.</p>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold transition" size="lg">Join the Beta</Button>
                    <p className="text-sm mt-4 opacity-70">⚙️ Currently in development · MVP version</p>
                </div>
            </section>

            <section id="vision" className="py-20 bg-neutral-50 text-gray-800">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-3xl font-bold mb-4 text-center font-headline">🌱 Vision</h2>
                    <p className="text-lg text-center mb-8">
                        Regen Passport is a decentralized identity protocol for the regenerative era — a digital layer that connects people, projects, and communities through verified impact. It’s not just an ID. It’s a living mirror of regenerative action, verified by both humans and ecosystems.
                    </p>
                </div>
            </section>

            <section id="how-it-works" className="py-20 bg-white text-gray-900">
                <div className="container mx-auto px-6 max-w-5xl">
                    <h2 className="text-3xl font-bold mb-8 text-center font-headline">🧬 How It Works</h2>
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <ol className="space-y-6 text-lg">
                                <li><strong>1. Create your Regen Identity</strong><br />Connect your wallet, BrightID or Proof of Humanity to build your verified profile.</li>
                                <li><strong>2. Submit your regenerative actions</strong><br />Upload your project, images, and proof of impact. AI validates metadata and coherence.</li>
                                <li><strong>3. Community Validation</strong><br />Peers and DAO curators verify authenticity, building your trust network.</li>
                                <li><strong>4. Receive your Regen Credentials</strong><br />Get verifiable certificates or hypercerts stored on Ceramic.</li>
                                <li><strong>5. Build your RegenScore</strong><br />Your impact, collaborations, and consistency form your unique regenerative identity.</li>
                            </ol>
                        </div>
                        <div className="bg-emerald-50 rounded-2xl p-6 flex flex-col justify-center">
                            <h3 className="text-2xl font-semibold mb-3">🪙 Proof of Regeneration</h3>
                            <p>Combines human verification (BrightID, PoH) + impact validation (RegenHub AI + DAO). Your RegenScore becomes your digital proof of contribution.</p>
                            <div className="mt-6">
                                <Image src="https://picsum.photos/seed/regen-diagram/800/600" alt="Regen Passport diagram" width={800} height={600} className="rounded-xl shadow-md" data-ai-hint="network diagram" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="ecosystem" className="py-20 bg-neutral-900 text-white">
                <div className="container mx-auto px-6 max-w-5xl">
                    <h2 className="text-3xl font-bold mb-8 text-center font-headline">🌍 Ecosystem Integration</h2>
                    <p className="text-lg text-center mb-12">Regen Passport complements the existing Web3 identity stack, connecting the human layer with real-world impact.</p>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div><h4 className="text-xl font-semibold">BrightID</h4><p>Decentralized proof of uniqueness.</p></div>
                        <div><h4 className="text-xl font-semibold">Proof of Humanity</h4><p>Verified human registry.</p></div>
                        <div><h4 className="text-xl font-semibold">Gitcoin Passport</h4><p>Decentralized reputation layer.</p></div>
                        <div><h4 className="text-xl font-semibold">Ceramic Network</h4><p>Decentralized data streams for your credentials.</p></div>
                        <div><h4 className="text-xl font-semibold">IDriss</h4><p>Cross-chain reputation and social verification.</p></div>
                        <div><h4 className="text-xl font-semibold">RegenHub</h4><p>The impact verification engine connecting them all.</p></div>
                    </div>
                </div>
            </section>

            <section id="impact" className="py-20 bg-white text-gray-900">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-4 font-headline">🌿 Impact, Proven.</h2>
                    <p className="text-lg mb-8">
                        Regen Passport bridges digital identity and ecological action, empowering builders, educators, and communities to receive recognition and opportunities based on verifiable impact.
                    </p>
                    <blockquote className="italic text-emerald-700 font-semibold">
                        “If Gitcoin Passport measures digital credibility, Regen Passport measures impact in the real world.”
                    </blockquote>
                </div>
            </section>

            <section id="cta" className="py-24 bg-gradient-to-b from-emerald-800 to-emerald-600 text-white text-center">
                <h2 className="text-4xl font-bold mb-4 font-headline">Join the Regen Passport Beta</h2>
                <p className="text-lg mb-8 max-w-xl mx-auto">Be one of the first to test the Impact Identity Layer and help shape the next phase of regenerative technology.</p>
                <Button className="bg-white text-emerald-800 px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition" size="lg">Request Early Access</Button>
                <p className="text-sm mt-6 opacity-70">💫 Your contribution helps co-create the future of verified impact.</p>
            </section>
        </div>
    );
};

export default RegenPassportLanding;
