import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const prompt = searchParams.get('prompt');
  const page = searchParams.get('page') || '1';

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt diperlukan' }, { status: 400 });
  }

  try {
    const pexelsApiUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(prompt)}&per_page=1&page=${page}`;
    const apiResponse = await fetch(pexelsApiUrl, {
      headers: { Authorization: process.env.PEXELS_API_KEY! },
    });

    const data = await apiResponse.json();
    let videoLink = data.videos?.[0]?.video_files?.find(
      (f: any) => f.quality === 'hd' || f.width >= 1280
    )?.link || data.videos?.[0]?.video_files?.[0]?.link;

    if (!videoLink) {
      videoLink = 'https://videos.pexels.com/video-files/3195398/3195398-hd_1920_1080_25fps.mp4';
    }

    const videoResponse = await fetch(videoLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.pexels.com/',
      },
    });

    if (!videoResponse.ok) {
      throw new Error(`Gagal ambil video preview: ${videoResponse.status}`);
    }

    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    return new NextResponse(videoResponse.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Image Proxy Error:', error);
    return NextResponse.json(
      { error: 'Gagal fetch video' },
      { status: 500 }
    );
  }
}
