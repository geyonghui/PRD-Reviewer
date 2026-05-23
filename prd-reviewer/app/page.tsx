export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">PRD Reviewer</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400">
        AI-powered PRD document review tool
      </p>
      <a href="/upload" className="mt-8 px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition">
        Start Review
      </a>
    </main>
  );
}
