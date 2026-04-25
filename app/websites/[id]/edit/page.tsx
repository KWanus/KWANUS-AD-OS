"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { InlineEditor } from "@/components/website/InlineEditor";
import { Loader2 } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function WebsiteEditPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useUser();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchSite = async () => {
      try {
        const res = await fetch(`/api/sites/${id}`);
        if (!res.ok) throw new Error("Failed to fetch site");

        const data = await res.json();
        setSite(data.site);

        // Parse blocks from site data
        const siteBlocks = data.site.blocks || [];
        setBlocks(siteBlocks);

      } catch (error) {
        console.error("Failed to load site:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [user, id]);

  const handleSave = async (updatedBlocks: any[]) => {
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: updatedBlocks }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      setSite(data.site);
      setBlocks(data.site.blocks || []);

    } catch (error) {
      console.error("Save failed:", error);
      throw error;
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/sites/${id}/publish`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to publish");

      const data = await res.json();
      setSite(data.site);

      // Redirect to live site
      if (data.site.slug) {
        window.open(`/s/${data.site.slug}`, "_blank");
      }

    } catch (error) {
      console.error("Publish failed:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0c0a08] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-bold">Loading editor...</p>
          <p className="text-sm text-t-text-faint mt-1">Preparing your 2060 editing experience ✨</p>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="fixed inset-0 bg-[#0c0a08] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white font-bold mb-2">Site not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-sm font-bold text-white hover:scale-105 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <InlineEditor
      siteId={id}
      blocks={blocks}
      theme={{
        primaryColor: site.theme?.primaryColor || "#f5a623",
        mode: site.theme?.mode || "light",
      }}
      onSave={handleSave}
      onPublish={handlePublish}
    />
  );
}
