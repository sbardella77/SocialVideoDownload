import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import InstagramDownloader from "@/pages/InstagramDownloader";
import TikTokDownloader from "@/pages/TikTokDownloader";
import YouTubeDownloader from "@/pages/YouTubeDownloader";
import TwitterDownloader from "@/pages/TwitterDownloader";
import FacebookDownloader from "@/pages/FacebookDownloader";

function App() {
  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/instagram-downloader" element={<InstagramDownloader />} />
            <Route path="/tiktok-downloader" element={<TikTokDownloader />} />
            <Route path="/youtube-downloader" element={<YouTubeDownloader />} />
            <Route path="/twitter-downloader" element={<TwitterDownloader />} />
            <Route path="/facebook-downloader" element={<FacebookDownloader />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-center" richColors closeButton />
    </div>
  );
}

export default App;
