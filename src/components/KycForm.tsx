'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

// ────────────────────────────────────────────────────────────────
// NIK Parser Logic
// ────────────────────────────────────────────────────────────────
function parseNIK(nik: string) {
  if (nik.length !== 16) return null;

  const dd = parseInt(nik.substring(6, 8), 10);
  const mm = parseInt(nik.substring(8, 10), 10);
  const yy = parseInt(nik.substring(10, 12), 10);

  const gender = dd > 40 ? 'Perempuan' : 'Laki-laki';
  const realDay = dd > 40 ? dd - 40 : dd;
  const fullYear = yy > 30 ? 1900 + yy : 2000 + yy;

  const now = new Date();
  const birthDate = new Date(fullYear, mm - 1, realDay);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  const birthDateStr = `${fullYear}-${String(mm).padStart(2, '0')}-${String(realDay).padStart(2, '0')}`;
  return { gender, birthDate: birthDateStr, age };
}

// ────────────────────────────────────────────────────────────────
// OCR Text Extractors
// ────────────────────────────────────────────────────────────────
function extractNIK(text: string): string | null {
  const match = text.match(/\b(\d{16})\b/);
  return match ? match[1] : null;
}

function extractName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (/nama/i.test(lines[i])) {
      const afterColon = lines[i].split(/[:\s]{2,}/).slice(1).join(' ').trim();
      if (afterColon && afterColon.length > 2) return afterColon;
      if (lines[i + 1]) return lines[i + 1].trim();
    }
  }
  return null;
}

function extractAddress(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const parts: string[] = [];
  let capturing = false;
  let linesCaptured = 0;

  // Stop words — fields that come AFTER alamat on a KTP
  const STOP = /^(agama|status|pekerjaan|kewarganegaraan|berlaku|gol\s*darah)/i;

  for (const line of lines) {
    if (/alamat/i.test(line) && !capturing) {
      capturing = true;
      // Grab text after "Alamat :" on the same line
      const afterColon = line.replace(/^.*?alamat\s*[:\-]?\s*/i, '').trim();
      if (afterColon && afterColon.length > 2) parts.push(afterColon);
      continue;
    }
    if (capturing) {
      // Stop if we hit another KTP field or captured 10 lines
      if (STOP.test(line) || linesCaptured >= 10) break;
      parts.push(line);
      linesCaptured++;
    }
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

function extractBirthDate(text: string): { birthDate: string; age: number } | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to find a date near "lahir" keyword — check same line AND next line
  for (let i = 0; i < lines.length; i++) {
    if (/lahir/i.test(lines[i])) {
      // Search this line + up to 2 lines below for a date pattern
      const searchBlock = [lines[i], lines[i + 1] || '', lines[i + 2] || ''].join(' ');
      const match = searchBlock.match(/(\d{2})\s*[\-\/\.]\s*(\d{2})\s*[\-\/\.]\s*(\d{4})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900) {
          const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const now = new Date();
          let age = now.getFullYear() - year;
          const md = now.getMonth() + 1 - month;
          if (md < 0 || (md === 0 && now.getDate() < day)) age--;
          return { birthDate, age };
        }
      }
    }
  }
  return null;
}

// ────────────────────────────────────────────────────────────────
// Scan Phases
// ────────────────────────────────────────────────────────────────
type ScanPhase = 'idle' | 'uploading' | 'analyzing' | 'parsing' | 'done' | 'error';

const PHASE_LABELS: Record<ScanPhase, string> = {
  idle: '',
  uploading: '📤 Mengirim gambar ke OCR Server...',
  analyzing: '🔍 Menganalisis KTP via API Server...',
  parsing: '🧬 Mengekstrak data NIK...',
  done: '✅ Scan selesai!',
  error: '❌ Gagal memindai',
};

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
interface KycFormProps {
  userId: string;
  username: string;
  whatsappNo: string;
}

export default function KycForm({ userId, username, whatsappNo }: KycFormProps) {
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState(username);
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [whatsapp, setWhatsapp] = useState(whatsappNo);
  const [agreed, setAgreed] = useState(false);

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [ocrRawText, setOcrRawText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ── Handle file selection ──
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKtpFile(file);
    setScanPhase('idle');
    setOcrRawText('');

    const reader = new FileReader();
    reader.onload = (ev) => setKtpPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // ── OCR via OCR.space API ──
  async function handleScan() {
    if (!ktpFile) return;

    try {
      setScanPhase('uploading');

      // Resize image to stay under OCR.space 1MB limit
      const resizedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1600;
          let { width, height } = img;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas not supported')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Blob conversion failed')),
            'image/jpeg',
            0.7 // quality — keeps file well under 1MB
          );
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = ktpPreview!;
      });

      // Build FormData for OCR.space
      const formData = new FormData();
      formData.append('file', resizedBlob, 'ktp.jpg');
      formData.append('apikey', 'K82787968488957');
      formData.append('language', 'eng');
      formData.append('OCREngine', '2');

      setScanPhase('analyzing');

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.ParsedResults || result.ParsedResults.length === 0 || result.IsErroredOnProcessing) {
        console.error('OCR.space error:', result);
        setScanPhase('error');
        return;
      }

      const text = result.ParsedResults[0].ParsedText || '';
      setOcrRawText(text);
      setScanPhase('parsing');

      // Extract fields using existing logic
      const foundNIK = extractNIK(text);
      const foundName = extractName(text);
      const foundAddress = extractAddress(text);

      if (foundNIK) {
        setNik(foundNIK);
        const parsed = parseNIK(foundNIK);
        if (parsed) {
          setGender(parsed.gender);
          // NIK-based date is fallback
          setBirthDate(parsed.birthDate);
          setAge(String(parsed.age));
        }
      }

      // Try to get actual birth date from OCR text (more accurate than NIK parser)
      const ocrBirth = extractBirthDate(text);
      if (ocrBirth) {
        setBirthDate(ocrBirth.birthDate);
        setAge(String(ocrBirth.age));
      }

      if (foundName) setFullName(foundName);
      if (foundAddress) setAddress(foundAddress);

      setScanPhase('done');
    } catch (err) {
      console.error('OCR error:', err);
      setScanPhase('error');
    }
  }

  // ── Submit KYC ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!nik || nik.replace(/\D/g, '').length !== 16) {
      setError('NIK harus 16 digit.');
      return;
    }
    if (!fullName.trim() || !whatsapp.trim()) {
      setError('Nama dan WhatsApp wajib diisi.');
      return;
    }
    if (!ktpFile) {
      setError('Upload foto KTP terlebih dahulu.');
      return;
    }
    if (!agreed) {
      setError('Kamu harus menyetujui syarat dan ketentuan.');
      return;
    }

    setLoading(true);
    const client = createClient();

    // Try to upload KTP image (non-blocking — if bucket doesn't exist, skip)
    let kycImageUrl: string | null = null;
    if (ktpFile) {
      const ext = ktpFile.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/ktp-${Date.now()}.${ext}`;

      const { error: uploadError } = await client.storage
        .from('kyc-documents')
        .upload(filePath, ktpFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.warn('KTP upload skipped:', uploadError.message);
        // Don't block — continue without image
      } else {
        const { data: urlData } = await client.storage
          .from('kyc-documents')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        kycImageUrl = urlData?.signedUrl || filePath;
      }
    }

    const { error: updateError } = await client
      .from('users')
      .update({
        nik: nik.trim(),
        full_name: fullName.trim(),
        address: address.trim() || null,
        gender: gender || null,
        birth_date: birthDate || null,
        age: age ? parseInt(age, 10) : null,
        whatsapp_no: whatsapp.trim(),
        kyc_status: true,
        kyc_img_url: kycImageUrl,
      })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.6rem 0.85rem', borderRadius: '0.5rem',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: '#e0e0e0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: 600, color: '#a0a0c0',
    letterSpacing: '0.05em', textTransform: 'uppercase' as const,
    marginBottom: '0.25rem', display: 'block',
  };

  const isScanning = scanPhase !== 'idle' && scanPhase !== 'done' && scanPhase !== 'error';

  return (
    <div className="glass" style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e0e0e0', margin: '0 0 0.35rem' }}>
          Verifikasi KYC
        </h2>
        <p style={{ color: '#606080', fontSize: '0.85rem', margin: 0 }}>
          Upload foto KTP — AI akan memindai dan mengisi data secara otomatis
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ─── KTP Upload & Scan ─── */}
        <div style={{
          padding: '1.25rem', borderRadius: '0.75rem',
          border: '1px dashed rgba(0,209,255,0.3)', background: 'rgba(0,209,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <label style={{ ...labelStyle, margin: 0 }}>📷 Foto KTP</label>
            {ktpPreview && (scanPhase === 'idle' || scanPhase === 'done' || scanPhase === 'error') && (
              <motion.button type="button" onClick={handleScan}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '0.4rem', border: 'none',
                  background: 'linear-gradient(135deg, #00d1ff, #00a8cc)',
                  color: '#001a26', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(0,209,255,0.3)',
                }}>
                🔍 {scanPhase === 'done' ? 'Scan Ulang' : 'Scan KTP'}
              </motion.button>
            )}
          </div>

          {ktpPreview ? (
            <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <img src={ktpPreview} alt="KTP Preview"
                style={{ width: '100%', borderRadius: '0.5rem', display: 'block' }} />

              {/* Scanning Overlay */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '1rem',
                    }}>
                    {/* Scan line animation */}
                    <motion.div
                      animate={{ top: ['5%', '90%', '5%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute', left: '5%', right: '5%', height: 2,
                        background: 'linear-gradient(90deg, transparent, #00d1ff, transparent)',
                        boxShadow: '0 0 15px #00d1ff, 0 0 30px #00d1ff50',
                      }} />

                    {/* Corner brackets */}
                    {[
                      { top: '8%', left: '8%', borderTop: '3px solid #00d1ff', borderLeft: '3px solid #00d1ff' },
                      { top: '8%', right: '8%', borderTop: '3px solid #00d1ff', borderRight: '3px solid #00d1ff' },
                      { bottom: '8%', left: '8%', borderBottom: '3px solid #00d1ff', borderLeft: '3px solid #00d1ff' },
                      { bottom: '8%', right: '8%', borderBottom: '3px solid #00d1ff', borderRight: '3px solid #00d1ff' },
                    ].map((style, i) => (
                      <motion.div key={i}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        style={{ position: 'absolute', width: 30, height: 30, ...style }} />
                    ))}

                    {/* Phase indicator */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        padding: '0.6rem 1.2rem', borderRadius: '0.5rem',
                        background: 'rgba(0,209,255,0.15)', border: '1px solid rgba(0,209,255,0.4)',
                        color: '#00d1ff', fontWeight: 600, fontSize: '0.85rem',
                        backdropFilter: 'blur(8px)',
                      }}>
                      {PHASE_LABELS[scanPhase]}
                    </motion.div>

                    {/* Pulsing dots */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                          style={{
                            width: 8, height: 8, borderRadius: '50%', background: '#00d1ff',
                          }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Done/Error overlay */}
              <AnimatePresence>
                {(scanPhase === 'done' || scanPhase === 'error') && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      position: 'absolute', bottom: 10, left: 10, right: 10,
                      padding: '0.5rem 0.75rem', borderRadius: '0.4rem',
                      background: scanPhase === 'done' ? 'rgba(0,255,153,0.15)' : 'rgba(255,80,80,0.15)',
                      border: `1px solid ${scanPhase === 'done' ? 'rgba(0,255,153,0.4)' : 'rgba(255,80,80,0.4)'}`,
                      color: scanPhase === 'done' ? '#00ff99' : '#ff8080',
                      fontSize: '0.8rem', fontWeight: 600,
                      backdropFilter: 'blur(8px)',
                    }}>
                    {PHASE_LABELS[scanPhase]}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Change image button */}
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '0.3rem 0.6rem', borderRadius: '0.3rem',
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#e0e0e0', fontSize: '0.7rem', cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}>
                🔄 Ganti
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                padding: '2.5rem 1rem', borderRadius: '0.5rem',
                border: '2px dashed rgba(0,209,255,0.2)', background: 'rgba(0,209,255,0.02)',
                cursor: 'pointer', textAlign: 'center',
              }}>
              <span style={{ fontSize: '2.5rem' }}>📷</span>
              <span style={{ color: '#00d1ff', fontWeight: 600, fontSize: '0.9rem' }}>Klik untuk upload foto KTP</span>
              <span style={{ color: '#505070', fontSize: '0.75rem' }}>JPG, PNG — max 5MB</span>
            </div>
          )}

          {/* Hidden file input — always rendered */}
          <input ref={fileInputRef} type="file" accept="image/*"
            onChange={handleFileSelect} style={{ display: 'none' }} />
        </div>

        {/* ─── Extracted Data Form ─── */}
        <div style={{
          padding: '1.25rem', borderRadius: '0.75rem',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1rem' }}>🧬</span>
            <span style={{ ...labelStyle, margin: 0, fontSize: '0.8rem' }}>Data KTP</span>
            {scanPhase === 'done' && (
              <span style={{
                fontSize: '0.6rem', padding: '1px 6px', borderRadius: 9999,
                background: 'rgba(0,255,153,0.1)', border: '1px solid rgba(0,255,153,0.3)',
                color: '#00ff99',
              }}>AUTO-FILLED</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* NIK */}
            <div>
              <label style={labelStyle}>NIK (16 digit) *</label>
              <input type="text" value={nik} maxLength={16}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                  setNik(val);
                  if (val.length === 16) {
                    const parsed = parseNIK(val);
                    if (parsed) {
                      setGender(parsed.gender);
                      setBirthDate(parsed.birthDate);
                      setAge(String(parsed.age));
                    }
                  }
                }}
                placeholder="3xxxxxxxxxxxxxxx" disabled={loading}
                style={{ ...inputStyle, color: '#00d1ff', fontWeight: 700, fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '0.15em', fontSize: '1rem' }} required />
            </div>

            {/* Name + WhatsApp */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Nama Lengkap *</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Sesuai KTP" disabled={loading} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp *</label>
                <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                  placeholder="08xxxxxxxxxx" disabled={loading} style={inputStyle} required />
              </div>
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>Alamat</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Alamat sesuai KTP" disabled={loading} style={inputStyle} />
            </div>

            {/* Gender, Birth Date, Age */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.6fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Jenis Kelamin</label>
                <select value={gender} onChange={e => setGender(e.target.value)} disabled={loading}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Pilih —</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tanggal Lahir</label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                  disabled={loading} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Umur</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)}
                  placeholder="—" disabled={loading} min={0} style={{ ...inputStyle, textAlign: 'center' }} />
              </div>
            </div>
          </div>
        </div>


        {/* ─── Agreement ─── */}
        <label style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
          padding: '0.75rem', borderRadius: '0.5rem',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
        }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            disabled={loading} style={{ marginTop: 3, accentColor: '#00d1ff' }} />
          <span style={{ color: '#909090', fontSize: '0.8rem', lineHeight: 1.5 }}>
            Saya menyatakan data di atas benar dan setuju dengan{' '}
            <strong style={{ color: '#00d1ff' }}>Syarat & Ketentuan</strong> serta{' '}
            <strong style={{ color: '#00d1ff' }}>Kebijakan Privasi</strong> Switch ML.
          </span>
        </label>

        {/* ─── Error ─── */}
        {error && (
          <div style={{
            padding: '0.5rem 0.75rem', borderRadius: '0.4rem',
            background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)',
            color: '#ff8080', fontSize: '0.8rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ─── Submit ─── */}
        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          style={{
            padding: '0.85rem', borderRadius: '0.6rem', border: 'none',
            background: loading ? 'rgba(0,209,255,0.15)' : 'linear-gradient(135deg, #00d1ff, #00a8cc)',
            color: loading ? '#00d1ff50' : '#001a26',
            fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 20px rgba(0,209,255,0.35)',
          }}>
          {loading ? '📤 Mengirim verifikasi...' : '✅ Submit KYC'}
        </motion.button>
      </form>
    </div>
  );
}
