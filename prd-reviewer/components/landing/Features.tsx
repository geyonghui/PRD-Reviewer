const features = [
  { title: "逻辑完整性", desc: "检查需求目标是否可衡量、用户故事是否完整、验收标准是否明确", icon: "🔍" },
  { title: "边界与异常", desc: "发现异常流程遗漏、并发场景缺失、数据边界未处理等问题", icon: "⚡" },
  { title: "术语一致性", desc: "检测文档中术语混用、缩写未解释、概念命名不统一", icon: "📝" },
  { title: "竞品与数据", desc: "提示竞品分析缺失、优先级无依据、KPI未定义等问题", icon: "📊" },
];
export default function Features() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">四大检查维度</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f.title} className="p-6 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-slate-600 dark:text-slate-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
