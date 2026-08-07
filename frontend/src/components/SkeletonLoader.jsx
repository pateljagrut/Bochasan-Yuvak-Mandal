import React from 'react';

/**
 * Shimmer Pulse Skeleton Loaders for table rows, cards, and stat blocks.
 */
export function StatSkeleton() {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px' }}></div>
        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '10px' }}></div>
      </div>
      <div className="skeleton" style={{ width: '80px', height: '32px' }}></div>
      <div className="skeleton" style={{ width: '140px', height: '14px' }}></div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td><div className="skeleton" style={{ width: '70px', height: '24px' }}></div></td>
      <td><div className="skeleton" style={{ width: '120px', height: '18px' }}></div></td>
      <td><div className="skeleton" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton" style={{ width: '90px', height: '16px' }}></div></td>
      <td><div className="skeleton" style={{ width: '50px', height: '18px' }}></div></td>
      <td><div className="skeleton" style={{ width: '80px', height: '30px', borderRadius: '6px' }}></div></td>
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ width: '60%', height: '22px' }}></div>
      <div className="skeleton" style={{ width: '100%', height: '14px' }}></div>
      <div className="skeleton" style={{ width: '80%', height: '14px' }}></div>
      <div className="skeleton" style={{ width: '40%', height: '12px' }}></div>
    </div>
  );
}
