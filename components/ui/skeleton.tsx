import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('skeleton rounded-xl', className)}
      {...props}
    />
  );
}

/** Stat card skeleton — matches glass stat card layout */
function StatCardSkeleton() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      border: '1px solid rgba(255,255,255,0.4)',
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top bar */}
      <div className="skeleton" style={{ height: 3, borderRadius: 0, animationDelay: '0ms' }} />
      <div style={{ padding: '20px 20px 16px' }}>
        {/* Icon row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <Skeleton style={{ width: 36, height: 36, borderRadius: 10, animationDelay: '50ms' }} />
          <Skeleton style={{ width: 72, height: 30, borderRadius: 8, animationDelay: '80ms' }} />
        </div>
        {/* Number */}
        <Skeleton style={{ width: '45%', height: 28, borderRadius: 8, marginBottom: 8, animationDelay: '100ms' }} />
        {/* Label */}
        <Skeleton style={{ width: '65%', height: 11, borderRadius: 6, marginBottom: 6, animationDelay: '150ms' }} />
        {/* Sub */}
        <Skeleton style={{ width: '40%', height: 9, borderRadius: 6, animationDelay: '200ms' }} />
      </div>
    </div>
  );
}

/** Row skeleton — for list items */
function RowSkeleton({ lines = 2, delay = 0 }: { lines?: number; delay?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
      <Skeleton style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, animationDelay: `${delay}ms` }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton style={{ width: '55%', height: 12, animationDelay: `${delay + 50}ms` }} />
        {lines > 1 && <Skeleton style={{ width: '35%', height: 10, animationDelay: `${delay + 100}ms` }} />}
      </div>
    </div>
  );
}

export { Skeleton, StatCardSkeleton, RowSkeleton };
