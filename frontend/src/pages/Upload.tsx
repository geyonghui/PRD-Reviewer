import { useNavigate } from "react-router-dom";
import TextEditor from "../components/upload/TextEditor";
import FileDropZone from "../components/upload/FileDropZone";
import ExamplePicker from "../components/upload/ExamplePicker";

export default function Upload() {
  const navigate = useNavigate();

  const handleSubmit = (content: string, fileName: string) => {
    sessionStorage.setItem("prd-content", content);
    sessionStorage.setItem("prd-filename", fileName);
    navigate("/review");
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">PRD Reviewer</h1>
        <button
          onClick={() => navigate("/history")}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          审查历史
        </button>
      </div>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        上传或粘贴你的PRD文档，AI将帮你检查其中的问题
      </p>

      <div className="space-y-8">
        <FileDropZone onSubmit={handleSubmit} />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">或</span>
          </div>
        </div>
        <TextEditor onSubmit={handleSubmit} />
        <ExamplePicker onSelect={handleSubmit} />
      </div>
    </main>
  );
}
