"use client";
export default function PositiveFeedback({ feedback }: { feedback: string[] }) {
  if (!feedback || feedback.length === 0) return null;
  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg mb-6">
      <p className="font-medium text-green-800 dark:text-green-300 mb-2">✅ 写得好的部分</p>
      <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
        {feedback.map((f, i) => <li key={i}>- {f}</li>)}
      </ul>
    </div>
  );
}
