const tech = ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Anthropic SDK", "React Markdown", "Zeabur"];
export default function TechStack() {
  return (
    <section className="py-16 px-6 max-w-3xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8">技术架构</h2>
      <div className="flex flex-wrap justify-center gap-3">
        {tech.map((t) => (
          <span key={t} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">{t}</span>
        ))}
      </div>
    </section>
  );
}
