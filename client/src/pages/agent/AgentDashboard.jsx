import { useState, useEffect } from 'react';
import { Users, FileText, IndianRupee, CalendarClock, TrendingUp, Award } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { AreaChartCard } from '../../components/charts/Charts';
import { customerService, policyService, analyticsService } from '../../services/dataService';
import { authService } from '../../services/authService';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function AgentDashboard() {
  const [agentCustomers, setAgentCustomers] = useState([]);
  const [agentPolicies, setAgentPolicies] = useState([]);
  const [commissionData, setCommissionData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();
  const agentName = currentUser ? currentUser.name : 'Priya Sharma';
  // For demo purposes, assuming agent_id is 1. In real app, fetch from user profile.
  const agentId = 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customers, policies, commissions] = await Promise.all([
          customerService.getAll(),
          policyService.getAll(),
          analyticsService.getCommissionData()
        ]);
        
        setAgentCustomers(customers.filter(c => c.agent_id === agentId));
        setAgentPolicies(policies.filter(p => p.agent_id === agentId));
        setCommissionData(commissions);
      } catch (error) {
        console.error("Failed to fetch agent data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [agentId]);

  const renewalsDue = agentPolicies.filter(p => p.status === 'renewal_due' || p.status === 'expired');
  const totalPremium = agentPolicies.reduce((s, p) => s + (p.premium_amount || 0), 0);
  const commission = Math.round(totalPremium * 0.12);

  const customerCols = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'KYC', render: (row) => <StatusBadge status={row.kyc_status} /> },
    { header: 'Joined', accessor: 'created_at', render: (row) => formatDate(row.created_at) },
  ];

  const policyCols = [
    { header: 'Policy ID', accessor: 'policy_id' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Product', accessor: 'product_name' },
    { header: 'Premium', accessor: 'premium_amount', render: (row) => formatCurrency(row.premium_amount) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'End Date', accessor: 'end_date', render: (row) => formatDate(row.end_date) },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, {agentName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Customers" value={agentCustomers.length} icon={Users} color="blue" trend="up" trendValue="+3" />
        <StatCard title="Policies Sold" value={agentPolicies.length} icon={FileText} color="green" trend="up" trendValue="+5" />
        <StatCard title="Commission Earned" value={formatCurrency(commission)} icon={IndianRupee} color="violet" trend="up" trendValue="+12%" />
        <StatCard title="Renewals Due" value={renewalsDue.length} icon={CalendarClock} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaChartCard data={commissionData} dataKeys={['earned', 'pending']} title="Commission Summary" colors={['#10b981', '#f59e0b']} />
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Performance Highlights</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
              <div className="p-2 bg-blue-500/15 rounded-lg"><TrendingUp size={20} className="text-blue-400" /></div>
              <div>
                <p className="text-sm font-medium text-white">Conversion Rate</p>
                <p className="text-xs text-slate-400">78% of leads converted to policies</p>
              </div>
              <span className="ml-auto text-lg font-bold text-blue-400">78%</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
              <div className="p-2 bg-emerald-500/15 rounded-lg"><Award size={20} className="text-emerald-400" /></div>
              <div>
                <p className="text-sm font-medium text-white">Customer Satisfaction</p>
                <p className="text-xs text-slate-400">Average rating from customers</p>
              </div>
              <span className="ml-auto text-lg font-bold text-emerald-400">4.6★</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-xl">
              <div className="p-2 bg-violet-500/15 rounded-lg"><IndianRupee size={20} className="text-violet-400" /></div>
              <div>
                <p className="text-sm font-medium text-white">Total Premium Collected</p>
                <p className="text-xs text-slate-400">This fiscal year</p>
              </div>
              <span className="ml-auto text-lg font-bold text-violet-400">{formatCurrency(totalPremium)}</span>
            </div>
          </div>
        </div>
      </div>

      <DataTable title="Assigned Customers" columns={customerCols} data={agentCustomers} searchPlaceholder="Search customers..." />
      <DataTable title="Policies Sold" columns={policyCols} data={agentPolicies} searchPlaceholder="Search policies..." />
    </div>
  );
}
