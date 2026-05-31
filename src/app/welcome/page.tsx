import { MobileShell } from "@/components/layout/visitor/MobileShell";
import { PageTransition } from "@/components/layout/PageTransition";
import { WelcomeHero } from "@/components/visitor/WelcomeHero";

export default function WelcomePage() {
  return (
    <MobileShell>
      <PageTransition>
        <WelcomeHero />
      </PageTransition>
    </MobileShell>
  );
}
