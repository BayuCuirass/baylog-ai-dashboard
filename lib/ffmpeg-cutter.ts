// lib/ffmpeg-cutter.ts
// Potong video di browser pakai ffmpeg.wasm (no server needed)

export type CutResult = {
  ok: boolean;
  label: string;
  overlayText: string;
  url: string;
  error?: string;
};

type HighlightMoment = {
  timestamp: string;  // format: "00:10 - 00:45" atau "0:10-0:45"
  why: string;
  overlay_text: string;
};

// Parse timestamp string jadi detik
// Support format: "00:10 - 00:45", "1:23-2:34", "01:10:00 - 01:12:00"
function parseTimestamp(raw: string): { start: number; end: number } | null {
  const cleaned = raw.replace(/\s/g, "");
  const parts = cleaned.split("-");
  if (parts.length < 2) return null;

  const toSeconds = (t: string): number => {
    const segs = t.split(":").map(Number);
    if (segs.length === 3) return segs[0] * 3600 + segs[1] * 60 + segs[2];
    if (segs.length === 2) return segs[0] * 60 + segs[1];
    return segs[0];
  };

  const start = toSeconds(parts[0]);
  const end = toSeconds(parts[parts.length - 1]);
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  return { start, end };
}

// Load ffmpeg.wasm secara lazy (baru load pas dipake)
async function loadFFmpeg() {
  if (typeof window === "undefined") throw new Error("ffmpeg hanya bisa jalan di browser");

  // @ts-ignore
  if (window.__ffmpegLoaded && window.__ffmpegInstance) {
    // @ts-ignore
    return window.__ffmpegInstance as { ffmpeg: any; fetchFile: any };
  }

  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();

  if (!ffmpeg.loaded) {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
  }

  // @ts-ignore
  window.__ffmpegLoaded = true;
  // @ts-ignore
  window.__ffmpegInstance = { ffmpeg, fetchFile };

  return { ffmpeg, fetchFile } as { ffmpeg: any; fetchFile: any };
}

export async function cutVideoClips(
  file: File,
  moments: HighlightMoment[],
  onProgress: (msg: string) => void
): Promise<CutResult[]> {
  const results: CutResult[] = [];

  onProgress("Memuat engine FFmpeg...");

  let ffmpegCtx: { ffmpeg: any; fetchFile: any };
  try {
    ffmpegCtx = await loadFFmpeg();
  } catch (err) {
    throw new Error(
      "Gagal load FFmpeg. Pastikan sudah install: npm i @ffmpeg/ffmpeg @ffmpeg/util"
    );
  }

  const { ffmpeg, fetchFile } = ffmpegCtx;

  onProgress("Membaca file video...");
  const inputName = "input_video.mp4";
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  for (let i = 0; i < moments.length; i++) {
    const moment = moments[i];
    const label = `Clip ${i + 1}: ${moment.timestamp}`;
    onProgress(`Memotong ${label}...`);

    const parsed = parseTimestamp(moment.timestamp);
    if (!parsed) {
      results.push({
        ok: false,
        label,
        overlayText: moment.overlay_text,
        url: "",
        error: `Format timestamp tidak valid: "${moment.timestamp}"`,
      });
      continue;
    }

    const { start, end } = parsed;
    const duration = end - start;
    const outputName = `clip_${i + 1}.mp4`;

    try {
      await ffmpeg.exec([
        "-ss", String(start),
        "-i", inputName,
        "-t", String(duration),
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        outputName,
      ]);

      // Fix error 2322: ffmpeg.readFile bisa return Uint8Array dengan .buffer
      // yang bertipe SharedArrayBuffer di beberapa environment (Node/WASM).
      // SharedArrayBuffer tidak bisa langsung masuk Blob — harus di-copy dulu
      // ke ArrayBuffer biasa dengan .slice(0).
      const raw: Uint8Array = await ffmpeg.readFile(outputName);
      const safeBuffer: ArrayBuffer = raw.buffer.slice(
        raw.byteOffset,
        raw.byteOffset + raw.byteLength
      ) as ArrayBuffer;

      const blob = new Blob([safeBuffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      results.push({
        ok: true,
        label,
        overlayText: moment.overlay_text,
        url,
      });

      await ffmpeg.deleteFile(outputName);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({
        ok: false,
        label,
        overlayText: moment.overlay_text,
        url: "",
        error: errMsg,
      });
    }
  }

  try { await ffmpeg.deleteFile(inputName); } catch (_) {}

  onProgress("Selesai!");
  return results;
}