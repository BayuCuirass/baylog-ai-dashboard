import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, prompt, mode, commentText } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    let finalPrompt = "";

    // === LOGIKA 1: QUIZ ZAZQYA ===
    if (mode === 'quiz') {
      finalPrompt = `
Kamu adalah AI pembuat kuis lucu dan romantis. Buatkan 1 pertanyaan kuis pilihan ganda dadakan untuk Zazqya (pacar dari Bayu).
Topik Kuis: "${topic || 'Random tentang hubungan, hal lucu, atau tes seberapa kenal Bayu'}".

ATURAN KETAT:
1. Pertanyaan harus asik, lucu, atau *sweet*.
2. Buat 4 opsi jawaban (A, B, C, D). Cuma ada 1 yang benar. Opsi yang salah buat selucu atau se-absurd mungkin.
3. Berikan pesan romantis/lucu kalau dia berhasil menjawab.

STRUKTUR JSON WAJIB:
{
  "question": "Pertanyaannya...",
  "options": [ "A. ...", "B. ...", "C. ...", "D. ..." ],
  "correct_answer": "Huruf opsi yang benar (contoh: A)",
  "sweet_message": "Pesan singkat yang bikin baper atau ketawa setelah tahu jawabannya..."
}`;
    }
    // === LOGIKA 2: AUTO-REPLY ===
    else if (mode === 'reply') {
      finalPrompt = `
Kamu adalah kreator konten YouTube. Kamu baru saja mengunggah video dengan topik: "${topic || 'Konten YouTube'}".
Sekarang, balas komentar penonton ini: "${commentText}".

ATURAN KETAT: 
1. DILARANG KERAS menggunakan bahasa "alay", berlebihan, atau sok asik. 
2. Gunakan bahasa Indonesia yang profesional, sopan, namun tetap terasa santai, ramah, dan natural.
3. Pastikan balasanmu NYAMBUNG dengan topik video tersebut.

STRUKTUR JSON WAJIB:
{
  "edukatif": "Balasan yang informatif, terstruktur, dan elegan terkait topik.",
  "asik": "Balasan profesional yang santai, hangat, dan bersahabat.",
  "singkat": "Balasan pendek, padat, ramah (maksimal 5 kata)."
}`;
    } 
    // === LOGIKA 3: NASKAH SHORTS ===
    else if (mode === 'shorts') {
      finalPrompt = `
Kamu adalah Penulis Naskah untuk YouTube Shorts/TikTok/Reels bergaya dinamis dan viral (Durasi 60-90 detik).
TOPIK: "${topic}". Instruksi Tambahan: "${prompt || 'Tidak ada'}"

ATURAN KETAT:
1. Buatkan tepat 4 sampai 5 SCENE.
2. Voiceover tiap scene berisikan 3-4 kalimat padat.
3. Berikan keyword visual Pexels dalam Bahasa Inggris. 
4. KHUSUS VISUAL OUTRO: Gunakan keyword yang RELEVAN DENGAN TOPIK UTAMA. Dilarang keras menggunakan keyword 'subscribe', 'like', atau 'youtube'.

STRUKTUR JSON WAJIB:
{
  "youtube_title": "Judul Shorts Super Hook...",
  "youtube_description": "Buatkan KESIMPULAN atau RINGKASAN CERITA dari naskah di bawah.",
  "youtube_tags": "tag1, tag2, tag3, tag 4", 
  "hook": { "text": "Kalimat pembuka yang bikin penasaran!", "visual": "keyword inggris" },
  "scenes": [
    { "scene_number": 1, "visual": "keyword inggris", "voiceover": "3-4 kalimat cerita..." },
    { "scene_number": 2, "visual": "keyword inggris", "voiceover": "3-4 kalimat cerita..." }
  ],
  "outro": { "text": "Kalimat penutup yang WAJIB mengajak penonton untuk LIKE, KOMEN, dan SUBSCRIBE.", "visual": "keyword inggris sesuai TOPIK UTAMA (jangan keyword subscribe)" }, 
  "facebook_caption": "Caption singkat"
}`;
    } 
    // === LOGIKA 4: NASKAH LONG ===
    else {
      finalPrompt = `
Kamu adalah Penulis Naskah Dokumenter Profesional (Long Video 10 Menit).
TOPIK: "${topic}". Instruksi Tambahan: "${prompt || 'Tidak ada'}"

ATURAN: Buat naskah 8-10 Scene. Voiceover tiap scene WAJIB paragraf panjang.
ATURAN VISUAL OUTRO: Gunakan keyword visual Pexels yang MENGGAMBARKAN TOPIK UTAMA. DILARANG menggunakan keyword seperti 'subscribe', 'like', 'follow'.

STRUKTUR JSON WAJIB:
{
  "youtube_title": "Judul Long Video...",
  "youtube_description": "Buatkan KESIMPULAN atau RINGKASAN CERITA LENGKAP dari isi video dokumenter ini.",
  "youtube_tags": "dokumenter indonesia, fakta mengerikan, misteri, tag 4",
  "hook": { "text": "Kalimat pembuka (Maks 30 kata).", "visual": "keyword inggris" },
  "scenes": [
    { "scene_number": 1, "visual": "keyword inggris", "voiceover": "Paragraf panjang..." },
    { "scene_number": 2, "visual": "keyword inggris", "voiceover": "Paragraf panjang..." }
  ],
  "outro": { "text": "Kesimpulan penutup yang WAJIB mengajak penonton untuk LIKE, KOMEN, dan SUBSCRIBE.", "visual": "keyword inggris sesuai TOPIK UTAMA (jangan keyword subscribe)" },
  "facebook_caption": "Caption FB..."
}`;
    }

    const result = await model.generateContent(finalPrompt);
    const rawText = result.response.text();
    
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI gagal mengembalikan format JSON yang valid.");
    
    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    return NextResponse.json({ error: 'Server AI sedang sibuk atau error.' }, { status: 500 });
  }
}