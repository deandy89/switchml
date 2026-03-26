'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { cancelTransactionAction } from '@/app/escrow/actions';

interface OtpListenerProps {
  transactionId?: string;
  viewerRole?: string;
  initialStatus?: string;
}

// ── OTP digit card ──────────────────────────────────────────────
function OtpDigit({ digit, index }: { digit: string; index: number }) {
  return (
    <motion.div
      key={`${digit}-${index}`}
      initial={{ opacity: 0, y: -20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        background: 'rgba(0, 209, 255, 0.08)',
        border: '2px solid #00d1ff',
        boxShadow: '0 0 16px #00d1ff80, 0 0 40px #00d1ff30, inset 0 0 12px #00d1ff15',
        borderRadius: '0.75rem',
        width: '3.5rem',
        height: '4.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: '700',
        fontFamily: 'var(--font-geist-mono), monospace',
        color: '#00d1ff',
        textShadow: '0 0 10px #00d1ff, 0 0 30px #00d1ff80',
      }}
    >
      {digit}
    </motion.div>
  );
}

// ── Pulsing ring loader ─────────────────────────────────────────
function PulsingRing() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: '2px solid #00d1ff', width: 80, height: 80 }}
          animate={{ scale: [1, 1.6 + i * 0.3], opacity: [0.7, 0] }}
          transition={{ duration: 1.8, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      <div
        className="rounded-full"
        style={{
          width: 20, height: 20,
          background: '#00d1ff',
          boxShadow: '0 0 12px #00d1ff',
        }}
      />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export default function OtpListener({ transactionId, viewerRole, initialStatus }: OtpListenerProps) {
  const [otpCode, setOtpCode]   = useState<string | null>(null);
  const [status, setStatus]     = useState<string>(initialStatus || 'waiting_otp');
  const [connected, setConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  const isPhase1 = status === 'waiting_payment' || status === 'payment_confirmed' || status === 'waiting_otp' || status === 'process' || status === 'otp_received';
  const isPhase2 = status === 'ready_for_buyer';
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';

  const handleCancelBuyer = async () => {
    if (!transactionId || !confirm('Yakin ingin membatalkan transaksi ini? Saldo Anda akan dikembalikan dan penjual akan mendapat penalti.')) return;
    setIsCancelling(true);
    const res = await cancelTransactionAction(transactionId);
    if (!res?.success) {
      alert('Gagal membatalkan transaksi: ' + (res?.error || 'Unknown Error'));
    } else {
      setStatus('cancelled');
      setOtpCode(null);
      router.refresh();
    }
    setIsCancelling(false);
  };

  const handleConfirmSeller = async () => {
    if (!transactionId) return;
    setIsSubmitting(true);
    const client = createClient();
    const { error } = await client
      .from('transactions')
      .update({ status: 'ready_for_buyer', otp_code: null })
      .eq('id', transactionId);

    if (error) {
      alert('Gagal konfirmasi: ' + error.message);
    } else {
      setStatus('ready_for_buyer');
      setOtpCode(null);
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const handleConfirmBuyer = async () => {
    if (!transactionId) return;
    setIsSubmitting(true);
    const client = createClient();
    const { error } = await client
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);

    if (error) {
      alert('Gagal konfirmasi: ' + error.message);
    } else {
      setStatus('completed');
      router.refresh();
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    console.log('Menyiapkan koneksi Realtime...');

    const client = createClient();
    const filter = transactionId ? `id=eq.${transactionId}` : undefined;

    const channel = client
      .channel('tes-channel-semua')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', ...(filter ? { filter } : {}) },
        (payload: any) => {
          console.log('🔥 ADA PERGERAKAN DI DATABASE! Payload:', payload);
          if (payload.new) {
            if (payload.new.otp_code !== undefined) {
              setOtpCode(payload.new.otp_code as string | null);
            }
            if (payload.new.status) {
              setStatus(payload.new.status as string);
            }
          }
        }
      )
      .subscribe((st: string) => {
        console.log('📡 STATUS KONEKSI:', st);
        setConnected(st === 'SUBSCRIBED');
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [transactionId]);

  const digits = otpCode ? otpCode.split('') : [];

  // Conditional Rendering Logic
  let showOtpBox = false;
  let message = '';
  let buttonConfig: { onClick: () => void; label: string } | null = null;
  let statusBadgeLabel = '';
  let statusBadgeColor = '#e0e0e0';

  if (isCancelled) {
    message = '❌ Transaksi dibatalkan. Dana telah dikembalikan ke saldo Anda.';
    statusBadgeLabel = 'Dibatalkan';
    statusBadgeColor = '#ff5050';
  } else if (isCompleted) {
    message = '🎉 Transaksi Selesai. Akun telah diamankan oleh Pembeli.';
    statusBadgeLabel = 'Transaksi Selesai';
    statusBadgeColor = '#00ff99';
  } else if (isPhase1) {
    statusBadgeLabel = 'Fase 1: Binding Seller';
    statusBadgeColor = '#ff00e5';
    if (viewerRole === 'seller') {
      showOtpBox = true;
      buttonConfig = { onClick: handleConfirmSeller, label: '✅ Akun Berhasil Di-bind' };
      message = otpCode ? '🔓 OTP Fase 1 Diterima!' : '📡 Menunggu OTP binding dari Moonton...';
      if (otpCode) statusBadgeColor = '#00d1ff';
    } else if (viewerRole === 'buyer') {
      message = '⏳ Menunggu Penjual menautkan akun ke email escrow...';
    } else {
      message = 'Fase 1: Seller Binding';
    }
  } else if (isPhase2) {
    statusBadgeLabel = 'Fase 2: Securing Buyer';
    statusBadgeColor = '#00d1ff';
    if (viewerRole === 'buyer') {
      showOtpBox = true;
      buttonConfig = { onClick: handleConfirmBuyer, label: '✅ Akun Telah Saya Amankan (Selesai)' };
      message = otpCode ? '🔓 OTP Fase 2 Diterima!' : '📡 Menunggu OTP securing dari Moonton...';
      if (otpCode) statusBadgeColor = '#00ff99';
    } else if (viewerRole === 'seller') {
      message = '⏳ Menunggu Pembeli login dan mengamankan akun...';
    } else {
      message = 'Fase 2: Buyer Securing';
    }
  }

  return (
    <div className="glass" style={{ padding: '2rem', maxWidth: 480, width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#a0a0c0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Realtime Escrow Listener
        </h2>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '2px 10px',
            borderRadius: 9999,
            background: connected ? 'rgba(0, 209, 255, 0.15)' : 'rgba(255, 0, 229, 0.15)',
            color: connected ? '#00d1ff' : '#ff00e5',
            border: `1px solid ${connected ? '#00d1ff50' : '#ff00e550'}`,
            letterSpacing: '0.06em',
          }}
        >
          {connected ? '● LIVE' : '○ CONNECTING'}
        </span>
      </div>

      {/* Status badge */}
      <motion.div
        key={statusBadgeLabel}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          marginBottom: '1.75rem',
          padding: '0.6rem 1rem',
          borderRadius: '0.6rem',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${statusBadgeColor}40`,
          color: statusBadgeColor,
          fontSize: '0.9rem',
          fontWeight: 500,
        }}
      >
        {statusBadgeLabel}
      </motion.div>

      {/* Message and OTP Box */}
      <div style={{ minHeight: showOtpBox ? 140 : 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <AnimatePresence mode="wait">
          {!showOtpBox && message ? (
             <motion.p
               key="waiting-message"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               style={{ color: '#00d1ff', fontSize: '1.1rem', textAlign: 'center', margin: 0, fontWeight: 600 }}
             >
               {message}
             </motion.p>
          ) : otpCode && showOtpBox ? (
            <motion.div
              key="otp-digits"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {digits.map((d, i) => (
                <OtpDigit key={i} digit={d} index={i} />
              ))}
            </motion.div>
          ) : showOtpBox ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
            >
              <PulsingRing />
              <p style={{ color: '#606080', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
                {message}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Action Button */}
      {showOtpBox && buttonConfig && (
        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={buttonConfig.onClick}
            disabled={!otpCode || isSubmitting}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              background: (!otpCode || isSubmitting) ? '#404060' : 'linear-gradient(135deg, #00ff99, #00d1ff)',
              color: (!otpCode || isSubmitting) ? '#808090' : '#001a26',
              fontWeight: 800,
              fontSize: '1rem',
              border: 'none',
              cursor: (!otpCode || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              transform: (!otpCode || isSubmitting) ? 'scale(1)' : 'scale(1.05)',
              boxShadow: (!otpCode || isSubmitting) ? 'none' : '0 0 20px rgba(0,255,153,0.4)',
            }}
          >
            {isSubmitting ? 'Memproses...' : buttonConfig.label}
          </button>
        </div>
      )}

      {/* Cancel Button (Buyer Only) */}
      {!isCompleted && !isCancelled && viewerRole === 'buyer' && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
           <button
             onClick={handleCancelBuyer}
             disabled={isSubmitting || isCancelling}
             style={{
               background: 'transparent',
               border: '1px solid #ff5050',
               color: '#ff5050',
               padding: '0.6rem 1.5rem',
               borderRadius: '0.5rem',
               fontSize: '0.85rem',
               fontWeight: 600,
               cursor: (isSubmitting || isCancelling) ? 'not-allowed' : 'pointer',
               opacity: (isSubmitting || isCancelling) ? 0.5 : 1,
               transition: 'background 0.2s',
             }}
           >
             {isCancelling ? 'Membatalkan...' : '❌ Batalkan (Akun Tidak Sesuai)'}
           </button>
        </div>
      )}
    </div>
  );
}
