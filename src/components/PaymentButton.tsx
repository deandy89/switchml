'use client';

import { useState } from 'react';

export default function PaymentButton({ transactionId }: { transactionId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePayment() {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();

      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        alert('Gagal membuat invoice: ' + (data.error || 'Terjadi kesalahan sistem.'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghubungi server pembayaran.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="neon-button-blue"
      style={{
        width: '100%',
        padding: '1rem',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: loading ? 'wait' : 'pointer',
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        background: loading ? 'rgba(0, 209, 255, 0.2)' : 'linear-gradient(135deg, #00d1ff, #007bff)',
        border: 'none',
        color: '#fff',
        boxShadow: '0 0 20px rgba(0, 209, 255, 0.4)',
        transition: 'all 0.2s',
      }}
    >
      {loading ? (
        <>
          <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }}></span>
          Sedang Mengalihkan...
        </>
      ) : (
        'Bayar Sekarang (Buka Invoice Xendit)'
      )}
    </button>
  );
}
