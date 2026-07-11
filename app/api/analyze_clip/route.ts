import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'File video tidak ditemukan' }, { status: 400 });

    // Ubah video jadi format yang bisa ditonton Gemini
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Kamu adalah Asisten Editor Video Profesional.
Tonton dan dengarkan klip video ini. Fokus pada makna, emosi, dan kata-kata yang diucapkan.
Tugasmu: Berikan 4 rekomendasi kata kunci (keyword) visual Pexels dalam bahasa Inggris yang SANGAT COCOK dijadikan B-Roll (mentahan) untuk mengiringi omongan di video ini.
Ingat, visualnya harus sinematik dan mewakili perasaan dari omongan tersebut.

STRUKTUR KONTEN JSON (WAJIB SESUAI FORMAT INI):
{
  "keywords": [
    "keyword inggris 1",
    "keyword inggris 2",
    "keyword inggris 3",
    "keyword inggris 4"
  ]
}
`;

    // Kirim prompt dan file video sekaligus ke Gemini
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: file.type } }
    ]);

    const rawText = result.response.text();
    
    // Penangkap JSON anti-error
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini gagal mengembalikan JSON.");
    
    return NextResponse.json(JSON.parse(jsonMatch[0]));

  } catch (error) {
    console.error("Analyze Clip Error:", error);
    return NextResponse.json({ error: 'Gagal menganalisa klip' }, { status: 500 });
  }
}