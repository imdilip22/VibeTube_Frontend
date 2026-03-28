import { useState, useEffect } from "react";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { VideoCard } from "../components/VideoCard";
import { getAllVideos } from "../service/video.service";
import { useNotification } from "../context/NotificationContext";
import { Search } from "lucide-react";

export const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await getAllVideos();
        if (result.success && result.data) {
          setVideos(result.data);
        }
      } catch (error) {
        console.log("SearchPage fetchVideos error", error);
        showNotification("Failed to load videos", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = query
    ? videos.filter((v: any) =>
        (v.title || "").toLowerCase().includes(query.toLowerCase()) ||
        (v.uploader?.name || "").toLowerCase().includes(query.toLowerCase())
      )
    : videos;

  return (
    <div className="min-h-dvh bg-[#0a0a12] pb-20">
      <TopBar />

      <main className="px-4 pt-4">
        {/* Search bar */}
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos or creators..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/10 transition-all"
          />
        </div>

        {/* Results */}
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {query ? `Results for "${query}"` : "All Videos"}
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          )}

          {!loading && filteredVideos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-gray-500">
                {query ? "No results found" : "No videos available"}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {query ? "Try a different search term" : "Upload a video to get started"}
              </p>
            </div>
          )}

          {!loading && filteredVideos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {filteredVideos.map((v: any) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title || "Untitled"}
                  uploaderName={v.uploader?.name ?? "Unknown"}
                  channelEmail={v.createdBy}
                  thumbnailPath={v.thumbnailPath}
                  uploadedAt={v.createdAt}
                  variant="small"
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};
