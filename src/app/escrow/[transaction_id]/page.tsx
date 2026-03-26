import OtpListener from '@/components/OtpListener';
import PaymentButton from '@/components/PaymentButton';
import SimulatorButton from '@/components/SimulatorButton';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { createClient } from '@/utils/supabase/server';
import type { Transaction } from '@/lib/types';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Escrow OTP — Switch ML',
  description: 'Halaman live OTP escrow untuk transaksi akun Mobile Legends.',
};

const STEPS = [
  { id: 1, label: 'Pembayaran Diterima',     statusKey: ['payment_confirmed', 'waiting_otp', 'otp_received', 'ready_for_buyer', 'completed'] },
  { id: 2, label: 'Fase 1: Seller Bind Akun',statusKey: ['waiting_otp', 'otp_received', 'ready_for_buyer', 'completed'] },
  { id: 3, label: 'Fase 2: Buyer Login',     statusKey: ['ready_for_buyer', 'completed'] },
  { id: 4, label: 'Selesai',                 statusKey: ['completed'] },
];

async function getTransaction(id: string): Promise<Transaction | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Transaction;
  } catch {
    return null;
  }
}

// Mock fallback for dev when no real transaction exists
function makeMockTransaction(id: string): Transaction {
  return {
    id,
    listing_id: 'mock-listing',
    buyer_id: 'buyer-1',
    seller_id: 'seller-1',
    escrow_email: `${id}@escrow.switchml.com`,
    status: 'waiting_otp',
    otp_code: null,
    created_at: new Date().toISOString(),
  };
}

export default async function EscrowPage({
  params,
}: {
  params: Promise<{ transaction_id: string }>;
}) {
  const { transaction_id } = await params;
  const transaction = (await getTransaction(transaction_id)) ?? makeMockTransaction(transaction_id);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const viewerRole = user?.id === transaction.seller_id ? 'seller' : user?.id === transaction.buyer_id ? 'buyer' : 'other';

  const formattedPrice = transaction.listing?.price
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(transaction.listing.price)
    : null;

  return (
    <main
      style={{
        flex: 1, minHeight: '100vh', background: '#2d004b',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '3rem 1rem',
      }}
    >
      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 500, height: 500,
        background: 'radial-gradient(circle, #00d1ff20 0%, transparent 70%)',
        top: -150, left: -150, filter: 'blur(80px)', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
        width: 350, height: 350,
        background: 'radial-gradient(circle, #ff00e515 0%, transparent 70%)',
        bottom: -80, right: -80, filter: 'blur(80px)', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem' }}>

        {/* Breadcrumb */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#505070' }}>
          <Link href="/" style={{ color: '#606080', textDecoration: 'none' }}>Marketplace</Link>
          <span>›</span>
          <span style={{ color: '#a0a0c0' }}>Escrow #{transaction_id.slice(-8)}</span>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="neon-text-blue" style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
            OTP Escrow Live
          </h1>
          <p style={{ color: '#606080', fontSize: '0.9rem', margin: 0 }}>
            Sistem siap menangkap kode OTP dari Moonton secara otomatis
          </p>
        </div>

        {/* Transaction details */}
        <div className="glass" style={{ padding: '1.5rem', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#505070', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
              Bind Akun ke Email Ini:
            </h2>
            <div style={{
              fontSize: '1.15rem', fontWeight: 700, color: '#00d1ff',
              fontFamily: 'var(--font-geist-mono)', wordBreak: 'break-all',
              padding: '1rem', background: 'rgba(0,209,255,0.05)', borderRadius: '0.5rem',
              border: '1px dashed rgba(0,209,255,0.4)',
              boxShadow: '0 0 15px rgba(0,209,255,0.1)',
            }}>
              {transaction.escrow_email}
            </div>
          </div>

          <h2 style={{ fontSize: '0.7rem', fontWeight: 600, color: '#505070', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
            Detail Pesanan
          </h2>
          <dl style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {[
              ['ID Transaksi', transaction.id],
              ['Status',        transaction.status.replace(/_/g, ' ')],
              ...(formattedPrice ? [['Harga', formattedPrice]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <dt style={{ fontSize: '0.8rem', color: '#505070', flexShrink: 0 }}>{k}</dt>
                <dd style={{
                  fontSize: '0.8rem', color: '#c0c0d0', textAlign: 'right', margin: 0,
                  fontFamily: k === 'Escrow Email' || k === 'ID Transaksi' ? 'var(--font-geist-mono)' : undefined,
                  wordBreak: 'break-all',
                }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Step tracker */}
        <div className="glass" style={{ padding: '1.5rem', width: '100%' }}>
          <h2 style={{ fontSize: '0.7rem', fontWeight: 600, color: '#505070', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
            Progress
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {STEPS.map((step, i) => {
              const done = step.statusKey.includes(transaction.status);
              const isActive = !done && STEPS.findIndex(s => !s.statusKey.includes(transaction.status)) === i;
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#00d1ff20' : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${done ? '#00d1ff' : isActive ? '#ff00e5' : 'rgba(255,255,255,0.15)'}`,
                    boxShadow: done ? '0 0 10px #00d1ff60' : isActive ? '0 0 10px #ff00e560' : 'none',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: done ? '#00d1ff' : isActive ? '#ff00e5' : '#404060',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: '0.875rem',
                    color: done ? '#e0e0e0' : isActive ? '#ff00e5' : '#505070',
                    fontWeight: done || isActive ? 500 : 400,
                  }}>
                    {step.label}
                  </span>
                  {isActive && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#ff00e5' }}>● aktif</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* OTP Listener */}
        <OtpListener transactionId={transaction.id} viewerRole={viewerRole} initialStatus={transaction.status} />

        {/* Payment Button for Buyer */}
        {transaction.status === 'waiting_payment' && viewerRole === 'buyer' && (
          <div style={{ width: '100%', marginTop: '0.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
              <p style={{ color: '#a0a0c0', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>Pesanan siap dibayar.</p>
              <p style={{ color: '#e0e0e0', fontSize: '0.75rem', margin: 0 }}>Klik tombol di bawah untuk membuka invoice aman dari Xendit.</p>
            </div>
            <PaymentButton transactionId={transaction.id} />
          </div>
        )}

        {/* Simulator */}
        <SimulatorButton escrowEmail={transaction.escrow_email} />
      </div>
    </main>
  );
}
