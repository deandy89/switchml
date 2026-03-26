'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

interface EditProfileProps {
  profile: {
    id: string;
    username: string;
    whatsapp_no: string;
    full_name: string | null;
    address: string | null;
    gender: string | null;
    birth_date: string | null;
    age: number | null;
  };
  email: string;
}

export default function EditProfileClient({ profile, email }: EditProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp_no || '');
  const [address, setAddress] = useState(profile.address || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleSave() {
    setMessage('');
    if (!username.trim() || !whatsapp.trim()) {
      setMessage('Username dan WhatsApp wajib diisi.');
      return;
    }

    setLoading(true);
    const client = createClient();

    const { error } = await client
      .from('users')
      .update({
        username: username.trim(),
        full_name: fullName.trim() || null,
        whatsapp_no: whatsapp.trim(),
        address: address.trim() || null,
      })
      .eq('id', profile.id);

    if (error) {
      setMessage('❌ ' + error.message);
      setLoading(false);
      return;
    }

    setMessage('✅ Profil berhasil diperbarui!');
    setLoading(false);
    setIsEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
    setWhatsapp(profile.whatsapp_no || '');
    setAddress(profile.address || '');
    setIsEditing(false);
    setMessage('');
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.55rem 0.8rem', borderRadius: '0.4rem',
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: '#e0e0e0', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem', fontWeight: 600, color: '#606080',
    letterSpacing: '0.05em', textTransform: 'uppercase' as const,
    marginBottom: '0.2rem', display: 'block',
  };

  const readonlyStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'transparent', border: '1px solid transparent',
    padding: '0.4rem 0', color: '#e0e0e0', fontWeight: 500,
  };

  const rows = [
    { label: 'Nama Lengkap', value: fullName, setter: setFullName, placeholder: 'Nama lengkap', type: 'text' },
    { label: 'Username', value: username, setter: setUsername, placeholder: '@username', type: 'text' },
    { label: 'WhatsApp', value: whatsapp, setter: setWhatsapp, placeholder: '08xxxxxxxxxx', type: 'tel' },
    { label: 'Alamat', value: address, setter: setAddress, placeholder: 'Alamat lengkap', type: 'text' },
  ];

  return (
    <div className="glass" style={{ padding: '1.25rem 1.5rem' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0e0', margin: 0 }}>
          ✏️ Profil
        </h3>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)}
            style={{
              padding: '0.3rem 0.8rem', borderRadius: '0.4rem',
              border: '1px solid rgba(0,209,255,0.3)', background: 'rgba(0,209,255,0.08)',
              color: '#00d1ff', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            }}>
            Edit Profil
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCancel} disabled={loading}
              style={{
                padding: '0.3rem 0.7rem', borderRadius: '0.4rem',
                border: '1px solid rgba(255,255,255,0.15)', background: 'transparent',
                color: '#808090', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}>
              Batal
            </button>
            <motion.button onClick={handleSave} disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              style={{
                padding: '0.3rem 0.8rem', borderRadius: '0.4rem', border: 'none',
                background: loading ? 'rgba(0,209,255,0.15)' : 'linear-gradient(135deg, #00d1ff, #00a8cc)',
                color: loading ? '#00d1ff50' : '#001a26',
                fontSize: '0.75rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? '...' : '💾 Simpan'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Email (read-only always) */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Email</label>
        <div style={{ ...readonlyStyle, color: '#606080' }}>{email}</div>
      </div>

      {/* Editable fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {rows.map(row => (
          <div key={row.label}>
            <label style={labelStyle}>{row.label}</label>
            {isEditing ? (
              <input type={row.type} value={row.value} onChange={e => row.setter(e.target.value)}
                placeholder={row.placeholder} disabled={loading} style={inputStyle} />
            ) : (
              <div style={readonlyStyle}>{row.value || <span style={{ color: '#404050' }}>—</span>}</div>
            )}
          </div>
        ))}
      </div>

      {/* Gender, Birth Date, Age (read-only info) */}
      {(profile.gender || profile.birth_date) && (
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {profile.gender && (
            <div>
              <label style={labelStyle}>Jenis Kelamin</label>
              <div style={readonlyStyle}>{profile.gender === 'Laki-laki' ? '♂️' : '♀️'} {profile.gender}</div>
            </div>
          )}
          {profile.birth_date && (
            <div>
              <label style={labelStyle}>Tanggal Lahir</label>
              <div style={readonlyStyle}>
                {new Date(profile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          )}
          {profile.age && (
            <div>
              <label style={labelStyle}>Umur</label>
              <div style={readonlyStyle}>{profile.age} tahun</div>
            </div>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '0.4rem',
          background: message.startsWith('✅') ? 'rgba(0,255,153,0.08)' : 'rgba(255,80,80,0.08)',
          border: `1px solid ${message.startsWith('✅') ? 'rgba(0,255,153,0.3)' : 'rgba(255,80,80,0.3)'}`,
          color: message.startsWith('✅') ? '#00ff99' : '#ff8080',
          fontSize: '0.8rem',
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
