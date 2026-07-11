import * as googleTTS from 'google-tts-api';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) return NextResponse.json({ error: "Teks kosong" }, { status: 400 });

    // Pake getAllAudioBase64 biar kuat baca teks panjang berapapun
    const audioResults = await googleTTS.getAllAudioBase64(text, {
      lang: 'id',     
      slow: false,    
      host: 'https://translate.google.com',
      splitPunct: ',.?', // AI akan ngambil napas (jeda) tiap ada koma/titik
    });

    // Karena dipecah-pecah, kita gabungkan semua potongannya jadi 1 file utuh
    const buffers = audioResults.map(res => Buffer.from(res.base64, 'base64'));
    const finalAudioBuffer = Buffer.concat(buffers);
    
    return new NextResponse(finalAudioBuffer, {
      headers: { "Content-Type": "audio/mpeg" },
    });

  } catch (error) {
    console.error('🔴 TTS Error:', error);
    return NextResponse.json({ error: "Gagal membuat suara" }, { status: 500 });
  }
}