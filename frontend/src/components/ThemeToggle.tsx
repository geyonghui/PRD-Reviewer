import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(next);
  };

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "💻";
  const label = theme === "dark" ? "深色模式" : theme === "light" ? "浅色模式" : "跟随系统";

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      aria-label={`当前：${label}，点击切换`}
      title={label}
    >
      {icon}
    </button>
  );
}
