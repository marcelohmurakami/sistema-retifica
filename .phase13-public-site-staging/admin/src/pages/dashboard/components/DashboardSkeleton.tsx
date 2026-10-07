import { Skeleton, SkeletonLines } from '../../../components_shared'

export function DashboardSkeleton() {
  return (
    <div className="live-dashboard-skeleton" aria-label="Carregando dashboard">
      <section className="live-dashboard-metrics">
        {Array.from({ length: 4 }, (_, index) => <article className="live-metric-card" key={index}><Skeleton width="2.7rem" height="2.7rem" borderRadius=".8rem" /><Skeleton width="65%" height="2rem" /><SkeletonLines lines={2} /></article>)}
      </section>
      <div className="live-dashboard-primary-grid">
        <section className="card live-dashboard-card"><Skeleton width="40%" height="1.5rem" /><SkeletonLines lines={6} /></section>
        <section className="card live-dashboard-card"><Skeleton width="45%" height="1.5rem" /><Skeleton height="13rem" /></section>
      </div>
    </div>
  )
}
