'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function MarketplaceFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [seller, setSeller] = useState(searchParams.get('seller') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '');
  const [minHero, setMinHero] = useState(searchParams.get('min_hero') || '');
  const [minSkin, setMinSkin] = useState(searchParams.get('min_skin') || '');
  const [rank, setRank] = useState(searchParams.get('rank') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (seller) params.set('seller', seller);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (minRating) params.set('min_rating', minRating);
    if (minHero) params.set('min_hero', minHero);
    if (minSkin) params.set('min_skin', minSkin);
    if (rank) params.set('rank', rank);

    router.push(`/?${params.toString()}`);
  };

  const handleReset = () => {
    setQ('');
    setSeller('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setMinHero('');
    setMinSkin('');
    setRank('');
    router.push('/');
  };

  const inputStyle: React.CSSProperties = {
    padding: '0.6rem 0.85rem', borderRadius: '0.5rem',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: '#e0e0e0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
    width: '100%',
  };

  return (
    <div className="glass" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderRadius: '1rem' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Search Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto', gap: '0.5rem' }}>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Cari Hero, Skin, atau judul..."
            style={{ ...inputStyle, fontSize: '0.95rem' }}
          />
          <input
            type="text"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            placeholder="👤 Cari by Username Seller..."
            style={{ ...inputStyle, fontSize: '0.95rem' }}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            style={{
              padding: '0.6rem 2rem', borderRadius: '0.5rem', border: 'none',
              background: 'linear-gradient(135deg, #00d1ff, #00a8cc)',
              color: '#001a26', fontWeight: 800, cursor: 'pointer',
            }}
          >
            Cari
          </motion.button>
        </div>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#a0a0c0', fontWeight: 600 }}>Min Harga (Rp)</label>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#a0a0c0', fontWeight: 600 }}>Max Harga (Rp)</label>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#a0a0c0', fontWeight: 600 }}>Min Hero</label>
            <input type="number" value={minHero} onChange={e => setMinHero(e.target.value)} placeholder="0" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#a0a0c0', fontWeight: 600 }}>Min Skin</label>
            <input type="number" value={minSkin} onChange={e => setMinSkin(e.target.value)} placeholder="0" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#a0a0c0', fontWeight: 600 }}>Tier Valid</label>
            <select value={rank} onChange={e => setRank(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', padding: '0.55rem 0.5rem' }}>
              <option value="">Semua Rank</option>
              <option value="Epic">Epic</option>
              <option value="Legend">Legend</option>
              <option value="Mythic">Mythic</option>
              <option value="Mythic Glory">Mythic Glory</option>
              <option value="Immortal">Immortal</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', color: '#a0a0c0', fontWeight: 600 }}>Min Rating (⭐)</label>
            <select value={minRating} onChange={e => setMinRating(e.target.value)} style={{ ...inputStyle, cursor: 'pointer', padding: '0.55rem 0.5rem' }}>
              <option value="">Semua</option>
              <option value="4.0">⭐ 4.0+</option>
              <option value="4.5">⭐ 4.5+</option>
              <option value="4.8">⭐ 4.8+</option>
              <option value="5.0">⭐ 5.0</option>
            </select>
          </div>
          
          {(q || seller || minPrice || maxPrice || minRating || minHero || minSkin || rank) && (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,80,80,0.5)',
                background: 'rgba(255,80,80,0.1)', color: '#ff8080', fontWeight: 700, fontSize: '0.8rem',
                cursor: 'pointer', height: 'fit-content'
              }}
            >
              Reset ✕
            </button>
          )}
        </div>

      </form>
    </div>
  );
}
