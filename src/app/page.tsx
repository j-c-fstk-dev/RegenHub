
import Hero from '@/components/landing/hero';
import Intro from '@/components/landing/intro';
import Concept from '@/components/landing/concept';
import HowItWorks from '@/components/landing/how-it-works';
import PassportCta from '@/components/landing/passport-cta';
import Examples from '@/components/landing/examples';
import Roadmap from '@/components/landing/roadmap';
import Value from '@/components/landing/value';
import LeapCta from '@/components/landing/leap-cta';
import JoinUs from '@/components/landing/join-us';

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <Concept />
      <HowItWorks />
      <PassportCta />
      <Examples />
      <Roadmap />
      <Value />
      <LeapCta />
      <JoinUs />
    </>
  );
}
