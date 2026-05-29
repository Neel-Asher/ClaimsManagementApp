export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    verified: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    under_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    renewal_due: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return colors[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

export const getFraudColor = (score) => {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-emerald-400';
};

export const getFraudBg = (score) => {
  if (score >= 70) return 'bg-red-500/20';
  if (score >= 40) return 'bg-amber-500/20';
  return 'bg-emerald-500/20';
};

export const getRiskLabel = (score) => {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
};

export const roleRoutes = {
  admin: '/admin',
  agent: '/agent',
  customer: '/customer',
  claims_manager: '/claims-workflow',
};

export const formatStatus = (status) => {
  return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
};
