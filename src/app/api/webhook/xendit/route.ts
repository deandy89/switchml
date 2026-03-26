import { NextResponse } from 'next/server';

// Wajib di Next.js App Router agar POST tidak di-cache
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log("=== WEBHOOK XENDIT BERHASIL MASUK ===");
    
    // Tangkap data dari Xendit
    const body = await req.json();
    console.log("Data Xendit:", body);

    // BALASAN SUKSES LANGSUNG TANPA CEK TOKEN (HANYA UNTUK TESTING)
    return NextResponse.json({ 
      success: true, 
      message: "HALO XENDIT! Pintu berhasil ditembus!" 
    }, { status: 200 });

  } catch (error) {
    console.error("Error Sistem Terparah:", error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: String(error) 
    }, { status: 500 });
  }
}
