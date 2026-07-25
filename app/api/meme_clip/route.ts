import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const campaignBrief = (formData.get('campaignBrief') as string) || '';

    if (!file) return NextResponse.json({ error: 'File video tidak ditemukan' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Kamu adalah editor clipper meme Indonesia berpengalaman, gayamu terinspirasi dari akun clipper seperti Windah Basudara / Windah Topup Store: santai, kocak, reaksi berlebihan, relate sama anak gaming/nongkrong.

Tonton video mentahan ini sampai habis. Cari momen yang PALING lucu, PALING kaget, atau PALING "quotable" untuk dijadikan clip pendek (motion clip campaign).

Konteks/brief campaign dari user (kalau ada, WAJIB diikuti soal tema/aturan): "${campaignBrief || 'Tidak ada brief khusus, bebas cari momen paling lucu/menarik.'}"

ATURAN KETAT:
1. Cari maksimal 3 momen terbaik dari video, kasih perkiraan rentang waktu (format mm:ss - mm:ss) berdasarkan apa yang kamu lihat/dengar.
2. Hook caption WAJIB nempel di 2 detik pertama, singkat, bikin orang gagal scroll (gaya kocak/santai, bukan formal).
3. Overlay text tiap momen itu teks pendek yang nempel di layar pas momen itu muncul (bukan narasi panjang).
4. Caption posting gunakan bahasa gaul santai/receh khas TikTok Indonesia, boleh pakai emoji secukupnya.
5. Saran sound effect/meme audio HARUS nama efek suara/meme yang umum dipakai di TikTok (misal: suara kaget, suara "anjay", dorama sound, dsb), bukan lagu berhak cipta spesifik.
6. Hashtag campur antara niche akun (meme/santai/galau) dan tema campaign kalau ada.

STRUKTUR JSON WAJIB (JANGAN ADA TEKS LAIN DI LUAR JSON):
{
  "hook_caption": "Teks hook buat 2 detik pertama...",
  "highlight_moments": [
    { "timestamp": "0:00 - 0:00", "why": "Alasan kenapa momen ini worth diclip", "overlay_text": "Teks overlay singkat buat momen ini" }
  ],
  "meme_caption": "Caption buat posting di TikTok...",
  "sound_effect_suggestion": "Nama efek suara/meme yang cocok",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: file.type } }
    ]);

    const rawText = result.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini gagal mengembalikan JSON.");

    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("Meme Clip Error:", error);
    return NextResponse.json({ error: 'Gagal menganalisa clip meme.' }, { status: 500 });
  }
}