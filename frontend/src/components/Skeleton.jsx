import React from 'react';

/**
 * Global Skeleton base component with shimmer animation.
 * The 'shimmer' keyframes should be defined in your index.css.
 */
export function Skeleton({ width = "100%", height = 20, radius = 8, style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite linear",
      ...style
    }} />
  );
}

/**
 * Card Skeleton: Designed for Dashboard highlights and Match cards.
 */
export function CardSkeleton() {
  return (
    <div style={{ 
      background: "linear-gradient(145deg, #1e293b, #020617)", 
      padding: 20, 
      borderRadius: 16, 
      marginBottom: 16,
      border: "1px solid #1e293b" 
    }}>
      <Skeleton height={24} width="40%" style={{ marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} height={60} radius={10} style={{ flex: 1 }} />
        ))}
      </div>
      <Skeleton height={14} style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="80%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="60%" />
    </div>
  );
}

/**
 * Table Skeleton: Designed for Points Table and Bowling Stats views.
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ 
      background: "linear-gradient(145deg, #1e293b, #020617)", 
      padding: 20, 
      borderRadius: 16,
      border: "1px solid #1e293b" 
    }}>
      <Skeleton height={20} width="30%" style={{ marginBottom: 20 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={44} radius={6} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}