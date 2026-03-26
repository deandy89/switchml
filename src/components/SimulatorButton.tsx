'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulatorButtonProps {
  escrowEmail: string;
}

type SimState = 'idle' | 'loading' | 'success' | 'error';

export default function SimulatorButton({ escrowEmail }: SimulatorButtonProps) {
  const [state, setState]   = useState<SimState>('idle');
  const [result, setResult] = useState<string>('');

  async function handleSimulateEmail() {
    setState('loading');
    setResult('');

    try {
      // Build a FormData payload that mimics a real Mailgun inbound request
      const formData = new FormData();
      formData.append('recipient',     escrowEmail);
      formData.append('sender',        'noreply@moonton.com');
      formData.append('subject',       'Mobile Legends Login OTP');
      formData.append('stripped-text',
        'Halo Player, ini adalah email resmi dari Moonton. ' +
        'Kode OTP Anda untuk login adalah 777999. ' +
        'Jangan berikan kode ini kepada siapapun.'
      );
      // Flag to bypass HMAC check in development
      formData.append('x-simulator', 'true');
      // Dummy Mailgun signature fields (ignored in dev simulator mode)
      formData.append('timestamp', String(Math.floor(Date.now() / 1000)));
      formData.append('token',     'simulator-token');
      formData.append('signature', 'simulator-signature');

      console.log('[simulator] Mengirim payload ke /api/webhooks/mailgun...', {
        recipient: escrowEmail,
      });

      const res = await fetch('/api/webhooks/mailgun', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json().catch(() => ({ ok: false, error: res.statusText }));
      console.log('[simulator] Response dari API:', json);

      if (res.ok && json.ok) {
        setState('success');
        setResult(`✅ OTP 777999 berhasil dikirim! Transaction ID: ${json.transactionId}`);
      } else {
        setState('error');
        setResult(`❌ Gagal: ${JSON.stringify(json)}`);
      }
    } catch (err) {
      console.error('[simulator] Fetch error:', err);
      setState('error');
      setResult(`❌ Network error: ${String(err)}`);
    }

    // Reset to idle after 8 seconds
    setTimeout(() => setState('idle'), 8000);
  }

  const isLoading = state === 'loading';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#404060',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        Mode Testing
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Button */}
      <motion.button
        onClick={handleSimulateEmail}
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.97 }}
        style={{
          width: '100%',
          padding: '0.85rem 1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 0, 229, 0.4)',
          background: isLoading
            ? 'rgba(255, 0, 229, 0.05)'
            : 'rgba(255, 0, 229, 0.10)',
          color: isLoading ? '#804070' : '#ff00e5',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: isLoading
            ? 'none'
            : '0 0 16px rgba(255,0,229,0.25), 0 0 40px rgba(255,0,229,0.10)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontFamily: 'inherit',
        }}
      >
        {isLoading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block' }}
            >
              ⟳
            </motion.span>
            Mengirim simulasi...
          </>
        ) : (
          '🧪 Simulasi Email Moonton'
        )}
      </motion.button>

      {/* Result feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: '0.6rem',
              background:
                state === 'success'
                  ? 'rgba(0, 209, 255, 0.08)'
                  : 'rgba(255, 80, 80, 0.08)',
              border: `1px solid ${state === 'success' ? '#00d1ff40' : '#ff505040'}`,
              color: state === 'success' ? '#00d1ff' : '#ff8080',
              fontSize: '0.8rem',
              lineHeight: 1.5,
            }}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target info */}
      <p
        style={{
          color: '#404060',
          fontSize: '0.7rem',
          textAlign: 'center',
          margin: 0,
          fontFamily: 'var(--font-geist-mono)',
        }}
      >
        target: {escrowEmail}
      </p>
    </div>
  );
}
