'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import type { Listing } from '@/lib/types';

const RANKS = ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythic Glory', 'Immortal'];

export default function EditListingClient({ listing }: { listing: Listing }) {
  const [title, setTitle] = useState(listing.title || '');
  const [description, setDescription] = useState(listing.description || '');
  const [price, setPrice] = useState(listing.price ? new Intl.NumberFormat('id-ID').format(listing.price) : '');
  const [rank, setRank] = useState(listing.rank || '');
  const [heroCount, setHeroCount] = useState(listing.hero_count ? String(listing.hero_count) : '');
  const [skinCount, setSkinCount] = useState(listing.skin_count ? String(listing.skin_count) : '');
  const [diamonds, setDiamonds] = useState(listing.diamonds ? String(listing.diamonds) : '');
  
  // Image states
  const [existingImages, setExistingImages] = useState<string[]>(listing.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const router = useRouter();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const currentTotal = existingImages.length + newFiles.length;
    const allowed = 5 - currentTotal;
    if (allowed <= 0) return;

    const selected = Array.from(e.target.files).slice(0, allowed);
    const addedFiles = [...newFiles, ...selected].slice(0, 5 - existingImages.length);
    setNewFiles(addedFiles);

    const generatedPreviews: string[] = [];
    addedFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        generatedPreviews.push(ev.target?.result as string);
        if (generatedPreviews.length === addedFiles.length) {
          setNewPreviews([...generatedPreviews]);
        }
      };
      reader.readAsDataURL(f);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeExisting(index: number) {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  }

  function removeNew(index: number) {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
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

    if (existingImages.length + newFiles.length === 0) {
      setError('Harap sertakan minimal 1 foto/screenshot akun.');
      return;
    }

    setLoading(true);
    const client = createClient();
    
    // 1. Upload new files
    let finalImages = [...existingImages];
    const sellerId = listing.seller_id;

    for (let i = 0; i < newFiles.length; i++) {
        setUploadProgress(`Mengupload foto ${i + 1}/${newFiles.length}...`);
        const file = newFiles[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${sellerId}/${Date.now()}-${i}.${ext}`;
        
        const { error: uploadError } = await client.storage
          .from('listing-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          setError(`Gagal upload foto baru ${i + 1}: ${uploadError.message}`);
          setLoading(false);
          setUploadProgress('');
          return;
        }
        
        const { data: urlData } = client.storage.from('listing-images').getPublicUrl(filePath);
        finalImages.push(urlData.publicUrl);
    }

    setUploadProgress('Menyimpan perubahan listing...');

    // 2. Update DB
    const { error: updateError } = await client
      .from('listings')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        price: priceNum,
        rank: rank || null,
        hero_count: heroCount ? parseInt(heroCount, 10) : null,
        skin_count: skinCount ? parseInt(skinCount, 10) : null,
        diamonds: diamonds ? parseInt(diamonds, 10) : null,
        images: finalImages,
      })
      .eq('id', listing.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      setUploadProgress('');
      return;
    }

    setLoading(false);
    setUploadProgress('');
    router.push('/seller');
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

  const totalImagesCount = existingImages.length + newFiles.length;

  return (
    <div className="glass" style={{ padding: '1.5rem 2rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Row 1: Title + Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={labelStyle}>Judul Akun *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Mythic Glory 150 Skins" disabled={loading}
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
          <label style={labelStyle}>Deskripsi</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            disabled={loading} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Row 3: Stats Grid */}
        <div>
          <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>📊 Statistik Tambahan</label>
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
              <span style={{ fontSize: '0.65rem', color: '#606080' }}>HERO</span>
              <input type="number" value={heroCount} onChange={e => setHeroCount(e.target.value)}
                placeholder="0" disabled={loading} min={0} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#606080' }}>SKIN</span>
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

        {/* Row 4: Image Management */}
        <div>
          <label style={{ ...labelStyle, marginBottom: '0.5rem', display: 'block' }}>
            🖼️ Kelola Screenshot (max 5 foto)
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            
            {/* Existing Images */}
            {existingImages.map((src, i) => (
              <div key={`existing-${i}`} style={{ position: 'relative', width: 100, height: 75, borderRadius: '0.4rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)' }}>
                <img src={src} alt={`Lama ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeExisting(i)} disabled={loading}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(255,50,50,0.9)', border: 'none',
                    color: '#fff', fontSize: '0.65rem', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    fontSize: '0.55rem', textAlign: 'center', padding: '1px 0'
                  }}>Tersimpan</div>
              </div>
            ))}

            {/* New Image Previews */}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} style={{ position: 'relative', width: 100, height: 75, borderRadius: '0.4rem', overflow: 'hidden', border: '1px dashed #00d1ff' }}>
                <img src={src} alt={`Baru ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeNew(i)} disabled={loading}
                  style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(255,50,50,0.9)', border: 'none',
                    color: '#fff', fontSize: '0.65rem', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'rgba(0, 209, 255, 0.8)', color: '#001a26', fontWeight: 700,
                    fontSize: '0.55rem', textAlign: 'center', padding: '1px 0'
                  }}>Baru</div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {totalImagesCount < 5 && (
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '0.5rem',
              border: '1px dashed rgba(0,209,255,0.4)', background: 'rgba(0,209,255,0.05)',
              color: '#00d1ff', fontSize: '0.8rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            }}>
              📷 Tambah Foto ({totalImagesCount}/5)
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
            padding: '0.85rem', borderRadius: '0.5rem', border: 'none',
            background: loading ? 'rgba(0,209,255,0.15)' : 'linear-gradient(135deg, #00d1ff, #00a8cc)',
            color: loading ? '#00d1ff50' : '#001a26',
            fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 15px rgba(0,209,255,0.25)',
            marginTop: '0.5rem'
          }}>
          {loading ? (uploadProgress || 'Menyimpan...') : '💾 Simpan Perubahan'}
        </motion.button>
      </form>

      {error && <p style={{ margin: '1rem 0 0', color: '#ff8080', fontSize: '0.8rem' }}>⚠️ {error}</p>}
    </div>
  );
}
