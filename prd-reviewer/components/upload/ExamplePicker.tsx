"use client";

const EXAMPLES = [
  { id: "ecommerce", name: "电商APP购物车优化PRD", file: "/examples/ecommerce-prd.md" },
  { id: "social", name: "陌生人社交产品PRD", file: "/examples/social-prd.md" },
  { id: "saas", name: "企业协作工具PRD", file: "/examples/saas-prd.md" },
];

interface ExamplePickerProps {
  onSelect: (content: string, fileName: string) => void;
}

export default function ExamplePicker({ onSelect }: ExamplePickerProps) {
  const handleSelect = async (example: (typeof EXAMPLES)[number]) => {
    try {
      const res = await fetch(example.file);
      const content = await res.text();
      onSelect(content, example.name);
    } catch {
      alert("加载示例失败，请重试");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        或选择示例PRD快速体验
      </label>
      <div className="flex gap-2 flex-wrap">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            onClick={() => handleSelect(example)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {example.name}
          </button>
        ))}
      </div>
    </div>
  );
}
