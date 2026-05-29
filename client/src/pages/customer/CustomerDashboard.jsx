import { useState, useEffect } from 'react';
import { FileText, ClipboardList, IndianRupee, CalendarClock } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { policyService, claimService, paymentService } from '../../services/dataService';
import { authService } from '../../services/authService';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function CustomerDashboard() {
  const [myPolicies, setMyPolicies] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentUser();
  const customerName = currentUser ? currentUser.name : 'Amit Patel';
  // For demo purposes, assuming customer_id is 1
  const custId = 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [policies, claims, payments] = await Promise.all([
          policyService.getAll(),
          claimService.getAll(),
          paymentService.getAll()
        ]);
        
        const filteredPolicies = policies.filter(p => p.customer_id === custId);
        setMyPolicies(filteredPolicies);
        setMyClaims(claims.filter(c => c.customer_id === custId));
        setMyPayments(payments.filter(p => filteredPolicies.some(pol => pol.policy_id === p.policy_id)));
      } catch (error) {
        console.error("Failed to fetch customer dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [custId]);

  const activePolicies = myPolicies.filter(p => p.status === 'active');

  const policyCols = [
    { header: 'Policy ID', accessor: 'policy_id' },
    { header: 'Product', accessor: 'product_name' },
    { header: 'Premium', accessor: 'premium_amount', render: (row) => formatCurrency(row.premium_amount) },
    { header: 'Start', accessor: 'start_date', render: (row) => formatDate(row.start_date) },
    { header: 'End', accessor: 'end_date', render: (row) => formatDate(row.end_date) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const claimCols = [
    { header: 'Claim ID', accessor: 'claim_id' },
    { header: 'Type', accessor: 'claim_type' },
    { header: 'Amount', accessor: 'claim_amount', render: (row) => formatCurrency(row.claim_amount) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Filed', accessor: 'created_at', render: (row) => formatDate(row.created_at) },
  ];

  const paymentCols = [
    { header: 'Policy', accessor: 'policy_id' },
    { header: 'Amount', accessor: 'amount', render: (row) => formatCurrency(row.amount) },
    { header: 'Type', accessor: 'type', render: (row) => (
      <span className={`capitalize ${row.type === 'claim_settlement' ? 'text-emerald-400' : 'text-blue-400'}`}>
        {row.type.replace('_', ' ')}
      </span>
    )},
    { header: 'Date', accessor: 'payment_date', render: (row) => formatDate(row.payment_date) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">My Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, {customerName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Policies" value={activePolicies.length} icon={FileText} color="blue" />
        <StatCard title="Total Claims" value={myClaims.length} icon={ClipboardList} color="amber" />
        <StatCard title="Total Paid" value={formatCurrency(myPayments.filter(p => p.type === 'premium').reduce((s, p) => s + p.amount, 0))} icon={IndianRupee} color="green" />
        <StatCard title="Renewal Due" value={myPolicies.filter(p => p.status === 'renewal_due').length} icon={CalendarClock} color="violet" />
      </div>

      {/* Renewal alert */}
      {myPolicies.some(p => p.status === 'renewal_due') && (
        <div className="glass-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <CalendarClock size={20} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-400">Renewal Required</p>
              <p className="text-xs text-slate-400">You have policies due for renewal. Please contact your agent.</p>
            </div>
            <button className="ml-auto px-4 py-2 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg hover:bg-amber-500/30 transition-colors">
              Request Renewal
            </button>
          </div>
        </div>
      )}

      <DataTable title="My Policies" columns={policyCols} data={myPolicies} searchPlaceholder="Search policies..." />
      <DataTable title="Claim History" columns={claimCols} data={myClaims} searchPlaceholder="Search claims..." />
      <DataTable title="Payment History" columns={paymentCols} data={myPayments} searchPlaceholder="Search payments..." />
    </div>
  );
}
