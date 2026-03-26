'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

const RANKS = ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythic Glory', 'Immortal'];

export default function AddListingClient({ sellerId }: { sellerId: string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [rank, setRank] = useState('');
  const [heroCount, setHeroCount] = useState('');
  const [skinCount, setSkinCount] = useState('');
  const [diamonds, setDiamonds] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 5 - files.length);
    const newFiles = [...files, ...selected].slice(0, 5);
    setFiles(newFiles);

    // Generate previews
    const newPreviews: string[] = [];
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newPreviews.push(ev.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(f);
    });
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  }

  function handlePriceChange(raw: string) {
    const num = raw.replace(/\D/g, '');
    if (!num) { setPrice(''); return; }
    setPrice(new Intl.NumberFormat('id-ID').format(parseInt(num, 10)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const priceNum = parseInt(price.replace(/\D/g, ''), 10);
    if (!title.trim() || isNaN(priceNum) || priceNum < 10000) {
      setError('Judul dan harga (min Rp 10.000) wajib diisi.');
      return;
    }

    setLoading(true);
    const client = createClient();

    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress(`Mengupload foto ${i + 1}/${files.length}...`);
      const file = files[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${sellerId}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await client.storage
        .from('listing-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        setError(`Gagal upload foto ${i + 1}: ${uploadError.message}`);
        setLoading(false);
        setUploadProgress('');
        return;
      }

      const { data: urlData } = client.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      imageUrls.push(urlData.publicUrl);
    }

    setUploadProgress('Menyimpan listing...');

    const { error: insertError } = await client
      .from('listings')
      .insert([{
        seller_id: sellerId,
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        rank: rank || null,
        hero_count: heroCount ? parseInt(heroCount, 10) : null,
        skin_count: skinCount ? parseInt(skinCount, 10) : null,
        diamonds: diamonds ? parseInt(diamonds, 10) : null,
        images: imageUrls,
        status: 'available',
      }]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      setUploadProgress('');
      return;
    }

    // Reset form
    setTitle(''); setDescription(''); setPrice('');
    setRank(''); setHeroCount(''); setSkinCount(''); setDiamonds('');
    setFiles([]); setPreviews([]);
    setLoading(false);
    setUploadProgress('');
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
  };

  return (
    <div className="glass" style={{ padding: '1.5rem 2rem', marginBottom: '2.5rem' }}>
      <h2 className="neon-text-blue" style={{ margin: '0 0 1.25rem', fontSize: '1.2rem', fontWeight: 700 }}>
        ➕ Tambah Titipan Akun
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Row 1: Title + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={labelStyle}>Judul Akun *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Mythic Glory 150 Skins Full Emblem" disabled={loading}
              style={inputStyle} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={labelStyle}>Harga (Rp) *</label>
            <input type="text" value={price} onChange={e => handlePriceChange(e.target.value)}
              placeholder="1.500.000" disabled={loading}
              style={{ ...inputStyle, color: '#00d1ff', fontWeight: 700 }} required />
          </div>
        </div>

        {/* Row 2: Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={labelStyle}>Deskripsi (Opsional)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Ceritakan detail akun: emblem, winrate hero tertentu, info tambahan..."
            disabled={loading} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Row 3: Stats Grid */}
        <div>
          <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>📊 Statistik Akun</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#606080' }}>RANK</span>
              <select value={rank} onChange={e => setRank(e.target.value)} disabled={loading}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">— Pilih —</option>
                {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#606080' }}>JUMLAH HERO</span>
              <input type="number" value={heroCount} onChange={e => setHeroCount(e.target.value)}
                placeholder="0" disabled={loading} min={0} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#606080' }}>JUMLAH SKIN</span>
              <input type="number" value={skinCount} onChange={e => setSkinCount(e.target.value)}
                placeholder="0" disabled={loading} min={0} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#606080' }}>DIAMONDS</span>
              <input type="number" value={diamonds} onChange={e => setDiamonds(e.target.value)}
                placeholder="0" disabled={loading} min={0} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Row 4: Image Upload */}
        <div>
          <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>
            🖼️ Screenshot Akun (max 5 foto)
          </label>

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {previews.map((src, i) => (
                <div key={i} style={{ position: 'relative', width: 100, height: 75, borderRadius: '0.4rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <img src={src} alt={`Preview ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removeFile(i)}
                    style={{
                      position: 'absolute', top: 2, right: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(255,50,50,0.9)', border: 'none',
                      color: '#fff', fontSize: '0.65rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {files.length < 5 && (
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              border: '1px dashed rgba(0,209,255,0.4)', background: 'rgba(0,209,255,0.05)',
              color: '#00d1ff', fontSize: '0.8rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            }}>
              📷 Pilih Foto ({files.length}/5)
              <input ref={fileInputRef} type="file" accept="image/*" multiple
                onChange={handleFileSelect} disabled={loading}
                style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Submit */}
        <motion.button type="submit" disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.97 }}
          style={{
            padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
            background: loading ? 'rgba(0,209,255,0.15)' : 'linear-gradient(135deg, #00d1ff, #00a8cc)',
            color: loading ? '#00d1ff50' : '#001a26',
            fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 15px rgba(0,209,255,0.25)',
          }}>
          {loading ? (uploadProgress || 'Menyimpan...') : '🚀 Posting Ke Marketplace'}
        </motion.button>
      </form>

      {error && (
        <p style={{ margin: '1rem 0 0', color: '#ff8080', fontSize: '0.8rem' }}>⚠️ {error}</p>
      )}
    </div>
  );
}
