export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient orbs */}
      <div
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 400, height: 400,
          background: 'radial-gradient(circle, #00d1ff18 0%, transparent 70%)',
          top: -100, left: -100,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 350, height: 350,
          background: 'radial-gradient(circle, #ff00e515 0%, transparent 70%)',
          bottom: -80, right: -80,
          filter: 'blur(60px)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}
