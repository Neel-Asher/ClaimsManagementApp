import { useState, useEffect } from 'react';
import { FileText, Users, ShieldAlert, ClipboardList, TrendingUp, IndianRupee, AlertTriangle, Clock } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { LineChartCard, PieChartCard, BarChartCard } from '../../components/charts/Charts';
import { analyticsService, claimService } from '../../services/dataService';
import { formatCurrency, formatDate, getFraudColor } from '../../utils/helpers';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [claimsTrendData, setClaimsTrendData] = useState([]);
  const [fraudDistributionData, setFraudDistributionData] = useState([]);
  const [policyByTypeData, setPolicyByTypeData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          summary,
          claims,
          trend,
          fraudDist,
          policyByType
        ] = await Promise.all([
          analyticsService.getDashboardSummary(),
          claimService.getAll(),
          analyticsService.getClaimsTrend(),
          analyticsService.getFraudDistribution(),
          analyticsService.getPolicyByType()
        ]);
        
        setStats({
          totalPolicies: summary.total_policies,
          activePolicies: summary.active_policies,
          totalClaims: summary.total_claims,
          pendingClaims: summary.pending_claims,
          totalPremium: summary.total_premium,
          fraudAlerts: summary.fraud_alerts,
        });

        setRecentClaims(claims);
        setClaimsTrendData(trend);
        setFraudDistributionData(fraudDist);
        setPolicyByTypeData(policyByType);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    
    fetchData();
  }, []);

  const recentClaimsCols = [
    { header: 'Claim ID', accessor: 'claim_id' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Type', accessor: 'claim_type' },
    { header: 'Amount', accessor: 'claim_amount', render: (row) => formatCurrency(row.claim_amount) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Fraud', render: (row) => (
      <span className={`text-sm font-bold ${getFraudColor(row.fraud_score)}`}>{row.fraud_score}%</span>
    )},
    { header: 'Date', accessor: 'created_at', render: (row) => formatDate(row.created_at) },
  ];

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Overview of insurance operations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Policies" value={stats.totalPolicies} icon={FileText} color="blue" trend="up" trendValue="+12%" />
        <StatCard title="Active Policies" value={stats.activePolicies} icon={TrendingUp} color="green" trend="up" trendValue="+8%" />
        <StatCard title="Total Claims" value={stats.totalClaims} icon={ClipboardList} color="amber" />
        <StatCard title="Pending Claims" value={stats.pendingClaims} icon={Clock} color="violet" />
        <StatCard title="Total Premium" value={formatCurrency(stats.totalPremium)} icon={IndianRupee} color="cyan" trend="up" trendValue="+15%" />
        <StatCard title="Fraud Alerts" value={stats.fraudAlerts} icon={AlertTriangle} color="red" trend="down" trendValue="-3%" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LineChartCard data={claimsTrendData} dataKeys={['filed', 'approved', 'rejected']} title="Claims Trend" colors={['#3b82f6', '#10b981', '#ef4444']} />
        </div>
        <PieChartCard data={fraudDistributionData} title="Fraud Risk Distribution" />
      </div>

      {/* Policy by type */}
      <BarChartCard data={policyByTypeData} dataKeys={['count', 'premium']} xKey="type" title="Policies by Insurance Type" colors={['#3b82f6', '#8b5cf6']} />

      {/* Recent claims table */}
      <DataTable
        title="Recent Claims"
        columns={recentClaimsCols}
        data={recentClaims}
        searchPlaceholder="Search claims..."
        pageSize={5}
      />
    </div>
  );
}
