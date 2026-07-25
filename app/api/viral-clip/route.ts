// app/api/viral-clip/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userMessage = body.messages?.find(
      (m: { role: string; content: string }) => m.role === "user"
    )?.content ?? "";

    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,          // naik dari 2048 — cegah JSON kepotong
          responseMimeType: "application/json", // paksa Gemini return pure JSON
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json({ error: err }, { status: geminiRes.status });
    }

    const geminiData = await geminiRes.json();

    let text: string =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Gemini kadang tetap wrap dengan ```json ... ``` walau sudah pakai responseMimeType
    // Strip fence kalau ada
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // Validasi JSON sebelum dikirim ke client
    // Kalau tidak valid, return error yang jelas
    try {
      JSON.parse(text);
    } catch {
      console.error("Gemini returned invalid JSON:", text.slice(0, 300));
      return NextResponse.json(
        { error: "Model return JSON tidak valid. Coba lagi." },
        { status: 502 }
      );
    }

    // Normalize ke format yang sama kayak Anthropic
    return NextResponse.json({
      content: [{ type: "text", text }],
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}