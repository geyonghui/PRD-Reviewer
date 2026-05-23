import Link from "next/link";
export default function Hero() {
  return (
    <section className="text-center py-20 px-6">
      <h1 className="text-5xl font-bold mb-4">
        PRD <span className="text-primary">Reviewer</span>
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
        AI帮你审查产品需求文档，平均每次检查发现8.5个问题，其中40%是人工容易遗漏的
      </p>
      <Link href="/upload" className="inline-block px-8 py-3 bg-primary text-white rounded-lg text-lg font-medium hover:bg-blue-600 transition">
        开始检查
      </Link>
    </section>
  );
}
