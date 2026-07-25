"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClipMoment {
  timestamp: string;
  title: string;
  viralScore: number;
  category: "reaction" | "highlight" | "funny" | "emotional" | "educational" | "plot-twist";
  why: string;
  capcutEdits: string[];
  hashtags: string[];
  estimatedViews: string;
}

interface AnalysisResult {
  videoTitle: string;
  platform: string;
  totalDuration: string;
  moments: ClipMoment[];
  overallStrategy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ClipMoment["category"], { label: string; color: string; emoji: string }> = {
  reaction:     { label: "Reaction",     color: "#FF6B6B", emoji: "😱" },
  highlight:    { label: "Highlight",    color: "#FFD93D", emoji: "⚡" },
  funny:        { label: "Lucu/Absurd",  color: "#6BCB77", emoji: "😂" },
  emotional:    { label: "Emosional",    color: "#4D96FF", emoji: "🥹" },
  educational:  { label: "Info Penting", color: "#C77DFF", emoji: "🧠" },
  "plot-twist": { label: "Plot Twist",   color: "#FF9F1C", emoji: "🤯" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectPlatform(url: string): string {
  if (url.includes("youtube") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("tiktok")) return "TikTok";
  if (url.includes("twitch")) return "Twitch";
  if (url.includes("instagram")) return "Instagram";
  return "Video Platform";
}

function buildPrompt(videoUrl: string, platform: string, context: string): string {
  return `Kamu adalah AI spesialis viral content creator TikTok Indonesia yang ahli di strategi MotionClip (clip video live/konten lalu diedit dengan CapCut buat monetisasi dari views).

Konteks creator: Baybo13 di TikTok, konten edukasi, target cuan dari MotionClip.

Video URL: ${videoUrl}
Platform: ${platform}
Context tambahan dari user: ${context || "tidak ada"}

Karena kamu tidak bisa akses video langsung, kamu perlu menganalisis berdasarkan URL dan konteks, lalu simulasikan 5-7 momen yang paling berpotensi viral berdasarkan pola umum konten ${platform} yang sering clip-able.

Respond HANYA dengan JSON valid ini (tanpa markdown, tanpa penjelasan diluar JSON):
{
  "videoTitle": "judul video/stream yang diprediksi dari URL",
  "platform": "${platform}",
  "totalDuration": "estimasi durasi",
  "overallStrategy": "strategi keseluruhan dalam 2-3 kalimat untuk konten edukasi di TikTok MotionClip",
  "moments": [
    {
      "timestamp": "00:00 - 00:30",
      "title": "Nama momen singkat",
      "viralScore": 87,
      "category": "reaction",
      "why": "Alasan kenapa momen ini berpotensi viral (spesifik, langsung ke poin)",
      "capcutEdits": [
        "Edit spesifik 1 di CapCut",
        "Edit spesifik 2 di CapCut",
        "Edit spesifik 3 di CapCut"
      ],
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
      "estimatedViews": "10K-50K"
    }
  ]
}

Category harus salah satu dari: reaction, highlight, funny, emotional, educational, plot-twist
viralScore antara 60-99
Fokus pada momen yang cocok untuk format 15-60 detik TikTok MotionClip.
Berikan edit CapCut yang SANGAT SPESIFIK: nama fitur, efek, text style, sound yang exact.`;
}

// ─── Sub Components ───────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "#FF6B6B" : score >= 75 ? "#FFD93D" : "#6BCB77";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function ClipCard({ moment, index }: { moment: ClipMoment; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[moment.category];

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${cat.color}30`,
        background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              #{index + 1}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
                <span className="text-xs text-white/40 font-mono">{moment.timestamp}</span>
              </div>
              <h3 className="font-bold text-white text-sm leading-tight">{moment.title}</h3>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-white/40 mb-1">est. views</div>
            <div className="text-sm font-bold text-white">{moment.estimatedViews}</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>Viral Score</span>
            <span>{moment.viralScore}/100</span>
          </div>
          <ScoreBar score={moment.viralScore} />
        </div>

        <p className="mt-3 text-sm text-white/70 leading-relaxed">{moment.why}</p>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium transition-colors border-t"
        style={{ borderColor: `${cat.color}20`, color: cat.color, backgroundColor: `${cat.color}08` }}
      >
        <span>🎬 Tutorial CapCut</span>
        <span className="text-lg">{expanded ? "↑" : "↓"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-2">
            {moment.capcutEdits.map((edit, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {i + 1}
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{edit}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-white/40 mb-2">Hashtag Rekomendasi</div>
            <div className="flex flex-wrap gap-1.5">
              {moment.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViralClipFinder() {
  const [videoUrl, setVideoUrl] = useState("");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const LOADING_STEPS = [
    "Membaca link video...",
    "Menganalisis pola konten viral...",
    "Mengidentifikasi momen clip-able...",
    "Menyusun tutorial CapCut...",
    "Hampir selesai...",
  ];

  async function analyze() {
    if (!videoUrl.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 1800);

    try {
      const platform = detectPlatform(videoUrl);
      const userPrompt = buildPrompt(videoUrl, platform, context);

      // ✅ Hit API route Next.js — bukan Anthropic langsung
      // Browser tidak bisa fetch api.anthropic.com (CORS + API key expose)
      const response = await fetch("/api/viral-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error ?? `Server error ${response.status}`);
      }

      const data = await response.json();

      // Kalau server return error (mis. JSON invalid dari Gemini)
      if (data.error) throw new Error(data.error);

      const rawText: string =
        data.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";

      if (!rawText) throw new Error("Response kosong dari model.");

      // Strip markdown fence kalau masih ada
      const clean = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let parsed: AnalysisResult;
      try {
        parsed = JSON.parse(clean);
      } catch {
        // Tampilkan 200 karakter pertama buat debug
        throw new Error(`JSON tidak valid dari model. Preview: ${clean.slice(0, 200)}...`);
      }

      if (!parsed.moments || !Array.isArray(parsed.moments)) {
        throw new Error("Format response tidak sesuai. Coba lagi.");
      }

      setResult(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi error tidak dikenal";
      setError(`Gagal menganalisis: ${msg}`);
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  }

  const sortedMoments = result?.moments
    ? [...result.moments].sort((a, b) => b.viralScore - a.viralScore)
    : [];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(135deg, #0D0D0F 0%, #111118 50%, #0D0D0F 100%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
              style={{ background: "linear-gradient(90deg, #FF6B6B, #FF9F1C)", color: "#fff" }}
            >
              BAYBO13 TOOLS
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none mb-2">
            Viral Clip
            <span style={{ color: "#FF6B6B" }}> Finder</span>
          </h1>
          <p className="text-white/50 text-sm">
            Paste link video live — AI cariin momen paling potensial buat MotionClip TikTok kamu
          </p>
        </div>

        {/* Input Form */}
        <div
          className="rounded-2xl p-5 mb-6 border"
          style={{ borderColor: "rgba(255,107,107,0.2)", backgroundColor: "rgba(255,255,255,0.03)" }}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                Link Video / Live
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... atau https://tiktok.com/..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-2">
                Konteks Tambahan <span className="text-white/30 normal-case font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="cth: video gaming, podcast berita, drama live, tutorial masak..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>

            <button
              onClick={analyze}
              disabled={isLoading || !videoUrl.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isLoading
                  ? "rgba(255,107,107,0.3)"
                  : "linear-gradient(135deg, #FF6B6B, #FF9F1C)",
                color: "#fff",
                boxShadow: isLoading ? "none" : "0 4px 24px rgba(255,107,107,0.3)",
              }}
            >
              {isLoading ? "⏳ Menganalisis..." : "🔍 Cari Momen Viral"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="rounded-2xl p-8 mb-6 text-center border" style={{ borderColor: "rgba(255,107,107,0.15)", backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div className="text-4xl mb-4 animate-bounce">🎬</div>
            <p className="text-white/70 font-medium mb-2">{LOADING_STEPS[loadingStep]}</p>
            <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                  background: "linear-gradient(90deg, #FF6B6B, #FF9F1C)",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl p-4 mb-6 text-sm border" style={{ borderColor: "rgba(255,107,107,0.3)", backgroundColor: "rgba(255,107,107,0.08)", color: "#FF6B6B" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4 border"
              style={{ borderColor: "rgba(255,159,28,0.2)", backgroundColor: "rgba(255,159,28,0.05)" }}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h2 className="font-bold text-white mb-1">{result.videoTitle}</h2>
                  <div className="flex gap-2 text-xs mb-2">
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{result.platform}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{result.totalDuration}</span>
                    <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>{result.moments.length} momen</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{result.overallStrategy}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <div className="text-sm font-bold text-white/40 uppercase tracking-wider">Momen Terpotensial</div>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {sortedMoments.map((moment, i) => (
              <ClipCard key={i} moment={moment} index={i} />
            ))}

            <div
              className="rounded-2xl p-4 text-center text-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)" }}
            >
              💡 Tips: Clip momen tertinggi dulu, upload 2-3x sehari buat maximize reach MotionClip
            </div>
          </div>
        )}

      </div>
    </div>
  );
}