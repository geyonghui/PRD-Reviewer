import { BrowserRouter, Routes, Route } from "react-router-dom";
import ThemeProvider from "./components/ThemeProvider";
import ThemeToggle from "./components/ThemeToggle";
import Landing from "./pages/Landing";
import Upload from "./pages/Upload";
import Review from "./pages/Review";
import History from "./pages/History";

export default function App() {
  return (
    <ThemeProvider>
      <nav className="fixed top-0 right-0 p-4 z-50">
        <ThemeToggle />
      </nav>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/review" element={<Review />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
