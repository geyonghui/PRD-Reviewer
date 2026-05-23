import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import TechStack from "@/components/landing/TechStack";
export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <TechStack />
      <footer className="py-8 text-center text-sm text-slate-500">
        Built with AI • Open Source
      </footer>
    </main>
  );
}
