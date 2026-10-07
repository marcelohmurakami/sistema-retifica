import type { CSSProperties } from 'react'

export type SkeletonProps = {
  width?: CSSProperties['width']
  height?: CSSProperties['height']
  borderRadius?: CSSProperties['borderRadius']
  className?: string
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius,
  className = '',
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  )
}

export type SkeletonLinesProps = {
  lines?: number
  lastLineWidth?: CSSProperties['width']
}

export function SkeletonLines({
  lines = 3,
  lastLineWidth = '65%',
}: SkeletonLinesProps) {
  return (
    <div className="skeleton-lines" aria-hidden="true">
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          key={index}
          height="0.8rem"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  )
}
