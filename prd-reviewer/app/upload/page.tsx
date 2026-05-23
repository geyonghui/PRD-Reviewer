"use client";

import { useRouter } from "next/navigation";
import TextEditor from "@/components/upload/TextEditor";
import ExamplePicker from "@/components/upload/ExamplePicker";

export default function UploadPage() {
  const router = useRouter();

  const handleSubmit = (content: string, fileName: string) => {
    sessionStorage.setItem("prd-content", content);
    sessionStorage.setItem("prd-filename", fileName);
    router.push("/review");
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">PRD Reviewer</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        上传或粘贴你的PRD文档，AI将帮你检查其中的问题
      </p>

      <div className="space-y-8">
        <TextEditor onSubmit={handleSubmit} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">或</span>
          </div>
        </div>
        <ExamplePicker onSelect={handleSubmit} />
      </div>
    </main>
  );
}
