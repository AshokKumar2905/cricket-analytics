export function Skeleton({ width = "100%", height = 20, radius = 8, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: "linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
      ...style
    }} />
  );
}

export function CardSkeleton() {
  return (
    <div style={{ background:"linear-gradient(145deg,#1e293b,#020617)", padding:20, borderRadius:16, marginBottom:16 }}>
      <Skeleton height={24} width="40%" style={{ marginBottom: 16 }} />
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        {[1,2,3].map(i => <Skeleton key={i} height={60} radius={10} style={{ flex:1 }} />)}
      </div>
      <Skeleton height={14} style={{ marginBottom:8 }} />
      <Skeleton height={14} width="80%" style={{ marginBottom:8 }} />
      <Skeleton height={14} width="60%" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ background:"linear-gradient(145deg,#1e293b,#020617)", padding:20, borderRadius:16 }}>
      <Skeleton height={20} width="30%" style={{ marginBottom:20 }} />
      {Array.from({length:rows}).map((_,i) => (
        <Skeleton key={i} height={44} radius={6} style={{ marginBottom:8 }} />
      ))}
    </div>
  );
}