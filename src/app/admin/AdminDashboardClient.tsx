'use client';

import { useState } from 'react';
import { 
  deleteUserAction, 
  updateUserRoleAction, 
  deleteTransactionAction, 
  updateTransactionStatusAction,
  createUserAction,
  updateUserAction,
  createTransactionAction,
  updateTransactionAction
} from './actions';

export default function AdminDashboardClient({ initialUsers, initialTransactions }: { initialUsers: any[], initialTransactions: any[] }) {
  const [tab, setTab] = useState<'users' | 'transactions'>('users');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [userModal, setUserModal] = useState<{ open: boolean, data: any | null }>({ open: false, data: null });
  const [txModal, setTxModal] = useState<{ open: boolean, data: any | null }>({ open: false, data: null });

  // Filtering
  const filteredUsers = initialUsers.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = initialTransactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.buyer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // User Handlers
  async function handleUserSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Convert types
    const processedData = {
      ...data,
      balance: Number(data.balance),
      rating: Number(data.rating),
      kyc_status: data.kyc_status === 'true'
    };

    setLoadingId('modal');
    const res = userModal.data 
      ? await updateUserAction(userModal.data.id, processedData)
      : await createUserAction(processedData);
    
    if (res?.success) setUserModal({ open: false, data: null });
    else alert('Error: ' + res?.error);
    setLoadingId(null);
  }

  // Transaction Handlers
  async function handleTxSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    setLoadingId('modal');
    const res = txModal.data
      ? await updateTransactionAction(txModal.data.id, data)
      : await createTransactionAction(data);

    if (res?.success) setTxModal({ open: false, data: null });
    else alert('Error: ' + res?.error);
    setLoadingId(null);
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('DANGER: This will permanently delete the user profile. Proceed?')) return;
    setLoadingId(userId);
    const res = await deleteUserAction(userId);
    if (!res?.success) alert('Failed: ' + res?.error);
    setLoadingId(null);
  }

  async function handleDeleteTx(txId: string) {
    if (!confirm('DANGER: This will permanently eradicate the transaction record. Proceed?')) return;
    setLoadingId(txId);
    const res = await deleteTransactionAction(txId);
    if (!res?.success) alert('Failed: ' + res?.error);
    setLoadingId(null);
  }

  // Styles
  const thStyle: React.CSSProperties = { padding: '1rem', textAlign: 'left', borderBottom: '1px solid rgba(255,100,100,0.3)', color: '#ffaaaa', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' };
  const tdStyle: React.CSSProperties = { padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' };
  const selectStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.3rem', borderRadius: '0.3rem', fontSize: '0.75rem' };
  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem', borderRadius: '0.5rem', width: '100%', marginBottom: '1rem' };
  const btnPrimary: React.CSSProperties = { padding: '0.6rem 1.2rem', background: '#ff4d4d', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' };
  const btnGhost: React.CSSProperties = { padding: '0.4rem 0.8rem', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem' };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setTab('users')} style={{
            padding: '0.5rem 1.5rem', background: tab === 'users' ? 'rgba(255,50,50,0.2)' : 'transparent',
            color: tab === 'users' ? '#ff4d4d' : '#888', border: `1px solid ${tab === 'users' ? '#ff4d4d' : 'transparent'}`,
            borderRadius: '2rem', fontWeight: 800, cursor: 'pointer'
          }}> USERS </button>
          <button onClick={() => setTab('transactions')} style={{
            padding: '0.5rem 1.5rem', background: tab === 'transactions' ? 'rgba(255,50,50,0.2)' : 'transparent',
            color: tab === 'transactions' ? '#ff4d4d' : '#888', border: `1px solid ${tab === 'transactions' ? '#ff4d4d' : 'transparent'}`,
            borderRadius: '2rem', fontWeight: 800, cursor: 'pointer'
          }}> TRANSACTIONS </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder={`Search ${tab}...`} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0, width: 250 }}
          />
          <button 
            onClick={() => tab === 'users' ? setUserModal({ open: true, data: null }) : setTxModal({ open: true, data: null })}
            style={btnPrimary}
          >
            + ADD {tab === 'users' ? 'USER' : 'TX'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: 'rgba(20,0,5,0.6)', borderRadius: '1rem', border: '1px solid rgba(255,100,100,0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            {tab === 'users' ? (
              <tr>
                <th style={thStyle}>ID / DATE</th>
                <th style={thStyle}>USERNAME / BALANCE</th>
                <th style={thStyle}>ROLE / RATING</th>
                <th style={thStyle}>KYC STATUS</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            ) : (
              <tr>
                <th style={thStyle}>TX ID / DATE</th>
                <th style={thStyle}>BUYER / SELLER</th>
                <th style={thStyle}>EMAIL / OTP</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            )}
          </thead>
          <tbody>
            {tab === 'users' ? filteredUsers.map(u => (
              <tr key={u.id}>
                <td style={tdStyle}>
                  <div style={{ fontFamily: 'monospace', color: '#ff6666' }}>{u.id.split('-').pop()}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(u.created_at).toLocaleDateString()}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>@{u.username}</div>
                  <div style={{ color: '#00d1ff', fontSize: '0.75rem' }}>Rp. {u.balance.toLocaleString()}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '0.8rem', color: '#fff', textTransform: 'uppercase', fontWeight: 600 }}>{u.role}</div>
                  <div style={{ color: '#ffcc00', fontSize: '0.75rem' }}>⭐ {u.rating}</div>
                </td>
                <td style={tdStyle}>
                  {u.kyc_status ? <span style={{ color: '#00ff99' }}>Verified</span> : <span style={{ color: '#ff8080' }}>Unverified</span>}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setUserModal({ open: true, data: u })} style={btnGhost}>EDIT</button>
                    <button disabled={loadingId === u.id} onClick={() => handleDeleteUser(u.id)} style={{ ...btnGhost, color: '#ff4d4d', borderColor: 'rgba(255,0,0,0.2)' }}>
                      {loadingId === u.id ? '...' : 'DEL'}
                    </button>
                  </div>
                </td>
              </tr>
            )) : filteredTransactions.map(tx => (
              <tr key={tx.id}>
                <td style={tdStyle}>
                  <div style={{ fontFamily: 'monospace', color: '#ff6666' }}>{tx.id.split('-').pop()}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>{new Date(tx.created_at).toLocaleString()}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '0.8rem' }}>B: <span style={{ fontWeight: 700 }}>@{tx.buyer?.username || 'N/A'}</span></div>
                  <div style={{ fontSize: '0.8rem' }}>S: <span style={{ fontWeight: 700 }}>@{tx.seller?.username || 'N/A'}</span></div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>{tx.escrow_email}</div>
                  <div style={{ fontFamily: 'monospace', color: '#00ffcc' }}>OTP: {tx.otp_code || '---'}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontSize: '0.7rem', color: '#ff4d4d', fontWeight: 800 }}>{tx.status.toUpperCase()}</div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setTxModal({ open: true, data: tx })} style={btnGhost}>EDIT</button>
                    <button disabled={loadingId === tx.id} onClick={() => handleDeleteTx(tx.id)} style={{ ...btnGhost, color: '#ff4d4d', borderColor: 'rgba(255,0,0,0.2)' }}>
                      {loadingId === tx.id ? '...' : 'DEL'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {((tab === 'users' && filteredUsers.length === 0) || (tab === 'transactions' && filteredTransactions.length === 0)) && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>No records match your search.</div>
        )}
      </div>

      {/* Modals */}
      {(userModal.open || txModal.open) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: '#1a0005', border: '1px solid #ff4d4d', borderRadius: '1rem', width: '100%', maxWidth: 500, padding: '2rem', boxShadow: '0 0 50px rgba(255,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#ff4d4d', letterSpacing: '0.1em' }}>
              {userModal.open ? (userModal.data ? 'EDIT USER' : 'CREATE USER') : (txModal.data ? 'EDIT TRANSACTION' : 'CREATE TRANSACTION')}
            </h3>
            
            {userModal.open ? (
              <form onSubmit={handleUserSubmit}>
                <label style={{ fontSize: '0.7rem', color: '#888' }}>USERNAME</label>
                <input name="username" defaultValue={userModal.data?.username} style={inputStyle} required />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>ROLE</label>
                    <select name="role" defaultValue={userModal.data?.role || 'buyer'} style={inputStyle}>
                      <option value="buyer">buyer</option>
                      <option value="seller">seller</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>KYC STATUS</label>
                    <select name="kyc_status" defaultValue={String(!!userModal.data?.kyc_status)} style={inputStyle}>
                      <option value="false">Unverified</option>
                      <option value="true">Verified</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>BALANCE (IDR)</label>
                    <input type="number" name="balance" defaultValue={userModal.data?.balance || 0} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>RATING</label>
                    <input type="number" step="0.1" name="rating" defaultValue={userModal.data?.rating || 5} style={inputStyle} required />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setUserModal({ open: false, data: null })} style={btnGhost}>CANCEL</button>
                  <button type="submit" disabled={loadingId === 'modal'} style={btnPrimary}>{loadingId === 'modal' ? 'SAVING...' : 'SAVE CHANGES'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTxSubmit}>
                <label style={{ fontSize: '0.7rem', color: '#888' }}>ESCROW EMAIL</label>
                <input name="escrow_email" defaultValue={txModal.data?.escrow_email} style={inputStyle} required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>BUYER ID</label>
                    <input name="buyer_id" defaultValue={txModal.data?.buyer_id} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>SELLER ID</label>
                    <input name="seller_id" defaultValue={txModal.data?.seller_id} style={inputStyle} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>STATUS</label>
                    <select name="status" defaultValue={txModal.data?.status || 'waiting_payment'} style={inputStyle}>
                      <option value="waiting_payment">waiting_payment</option>
                      <option value="payment_confirmed">payment_confirmed</option>
                      <option value="waiting_otp">waiting_otp</option>
                      <option value="otp_received">otp_received</option>
                      <option value="ready_for_buyer">ready_for_buyer</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#888' }}>OTP CODE</label>
                    <input name="otp_code" defaultValue={txModal.data?.otp_code || ''} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setTxModal({ open: false, data: null })} style={btnGhost}>CANCEL</button>
                  <button type="submit" disabled={loadingId === 'modal'} style={btnPrimary}>{loadingId === 'modal' ? 'SAVING...' : 'SAVE CHANGES'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
