import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { prompt, page, index } = await req.json();
    
    // 1. Tentukan target folder di laptopmu
    const targetFolder = 'D:\\bahan capcut';

    // 2. Kalau folder 'bahan capcut' belum ada di D:, otomatis dibikinin!
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // 3. Ambil link video asli dari Pexels
    const pexelsApiUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(prompt)}&per_page=1&page=${page}`;
    const apiResponse = await fetch(pexelsApiUrl, {
      headers: { Authorization: process.env.PEXELS_API_KEY! },
    });
    
    const data = await apiResponse.json();
    let videoLink = data.videos?.[0]?.video_files?.find(
      (f: any) => f.quality === 'hd' || f.width >= 1280
    )?.link || data.videos?.[0]?.video_files?.[0]?.link;

    if (!videoLink) {
        videoLink = "https://videos.pexels.com/video-files/3195398/3195398-hd_1920_1080_25fps.mp4"; // Fallback
    }

    // 4. Server mendownload data videonya PAKAI TOPENG PENYAMARAN CHROME
    const videoData = await fetch(videoLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.pexels.com/'
      }
    });

    if (!videoData.ok) {
      throw new Error(`Pexels marah nih! Status: ${videoData.status}`);
    }

    // 5. Server menulis file tersebut secara diam-diam langsung ke D:
    const timestamp = Math.floor(Date.now() / 1000); 
    const fileName = `Mentahan_Scene_${index}_${timestamp}.mp4`;
    const filePath = path.join(targetFolder, fileName);

    const arrayBuffer = await videoData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Cek keamanan terakhir: Kalau file terlalu kecil (di bawah 50 KB), jangan disave!
    if (buffer.length < 50000) {
      throw new Error("Yang didownload bukan video, tapi pesan error Cloudflare!");
    }

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, message: `Aman! Masuk ke D:\\bahan capcut` });

  } catch (error) {
    console.error("Save Local Error:", error);
    return NextResponse.json({ error: 'Gagal simpan ke drive D:' }, { status: 500 });
  }
}