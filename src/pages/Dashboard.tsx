import { useAuthStore } from '../store/authStore'
import { AccountSummary } from '../components/dashboard/AccountSummary'
import { PerformanceChart } from '../components/dashboard/PerformanceChart'
import { AllocationChart } from '../components/dashboard/AllocationChart'
import { PositionsTable } from '../components/dashboard/PositionsTable'
import { DocumentsCard } from '../components/dashboard/DocumentsCard'
import { SetupPanel } from '../components/docusign/SetupPanel'

export function Dashboard() {
  const { user, error } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">
          {user ? `Good morning, ${user.name.split(' ')[0]}.` : 'Client Portal'}
        </h1>
        <p className="text-sm text-secondary mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Auth error / setup hint */}
      {error && (
        <SetupPanel error={error} />
      )}

      {/* Account summary KPIs */}
      <AccountSummary />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PerformanceChart />
        </div>
        <div>
          <AllocationChart />
        </div>
      </div>

      {/* Positions + Documents */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <PositionsTable />
        </div>
        <div>
          <DocumentsCard />
        </div>
      </div>
    </div>
  )
}
