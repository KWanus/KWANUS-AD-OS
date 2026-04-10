"use client";

import { useState, useEffect } from "react";
import AppNav from "@/components/AppNav";
import {
  BookOpen, Plus, Loader2, Check, DollarSign, Users, ChevronRight, Trash2,
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  description: string;
  price: number;
  modules: { title: string; lessons: { title: string }[] }[];
  enrolledCount: number;
  published: boolean;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("97");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json() as Promise<{ ok: boolean; courses?: Course[] }>)
      .then((data) => { if (data.ok && data.courses) setCourses(data.courses); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function createCourse() {
    if (!newTitle.trim()) return;
    setCreating(true);

    // Generate course outline via AI
    let modules: Course["modules"] = [];
    try {
      setGenerating(true);
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a course outline for "${newTitle}". Return JSON array of 5 modules, each with 3-4 lessons:
[{"title":"Module 1: Getting Started","lessons":[{"title":"Lesson 1: Introduction"},{"title":"Lesson 2: Core Concepts"}]}]
No explanations. Just the JSON array.`,
        }),
      });
      const data = await res.json() as { ok: boolean; content?: string };
      if (data.ok && data.content) {
        const match = data.content.match(/\[[\s\S]*\]/);
        if (match) modules = JSON.parse(match[0]);
      }
    } catch { /* AI generation optional */ }
    finally { setGenerating(false); }

    // If AI failed, use default structure
    if (modules.length === 0) {
      modules = Array.from({ length: 5 }, (_, i) => ({
        title: `Module ${i + 1}`,
        lessons: [{ title: "Lesson 1" }, { title: "Lesson 2" }, { title: "Lesson 3" }],
      }));
    }

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        price: parseFloat(newPrice) || 97,
        modules,
      }),
    });
    const data = await res.json() as { ok: boolean; courseId?: string };
    if (data.ok) {
      setCourses([{
        id: data.courseId ?? "",
        title: newTitle,
        description: newDesc,
        price: parseFloat(newPrice) || 97,
        modules,
        enrolledCount: 0,
        published: false,
      }, ...courses]);
      setNewTitle("");
      setNewDesc("");
      setShowCreate(false);
    }
    setCreating(false);
  }

  if (loading) return <div className="min-h-screen bg-[#050a14] text-white"><AppNav /><main className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-white/20 animate-spin" /></main></div>;

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <AppNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Courses</h1>
              <p className="text-xs text-white/35">Create and sell digital courses</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> New Course
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 mb-6 space-y-4">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Course title (e.g. Facebook Ads Mastery)"
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-purple-500/50 transition font-bold" />
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Course description..." rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition resize-none" />
            <div className="flex gap-3">
              <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price"
                className="w-32 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition" />
              <button onClick={createCourse} disabled={creating || !newTitle.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-400 transition disabled:opacity-40">
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> AI generating outline...</> : creating ? "Creating..." : <><BookOpen className="w-4 h-4" /> Create Course</>}
              </button>
            </div>
          </div>
        )}

        {/* Course list */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-10 h-10 text-white/10 mx-auto mb-4" />
            <h2 className="text-lg font-black text-white mb-2">No courses yet</h2>
            <p className="text-sm text-white/30 max-w-sm mx-auto">Create your first course — AI generates the outline, you add the content.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 hover:border-purple-400/20 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">{course.title}</h3>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${course.published ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-white/25 border border-white/10"}`}>
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    {course.description && <p className="text-xs text-white/30 truncate">{course.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/20">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.modules.length} modules</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolledCount} enrolled</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${course.price}</span>
                    </div>
                  </div>
                </div>

                {/* Module preview */}
                {course.modules.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {course.modules.slice(0, 6).map((mod, i) => (
                        <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                          <span className="text-[9px] font-bold text-purple-400/40">{i + 1}</span>
                          <span className="text-[10px] text-white/40 truncate">{mod.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
