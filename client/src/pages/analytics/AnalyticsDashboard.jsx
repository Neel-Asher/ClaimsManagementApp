import { useState, useEffect } from 'react';
import { LineChartCard, BarChartCard, PieChartCard, AreaChartCard } from '../../components/charts/Charts';
import { analyticsService } from '../../services/dataService';

export default function AnalyticsDashboard() {
  const [claimsTrendData, setClaimsTrendData] = useState([]);
  const [fraudDistributionData, setFraudDistributionData] = useState([]);
  const [topAgentsData, setTopAgentsData] = useState([]);
  const [renewalTrendData, setRenewalTrendData] = useState([]);
  const [policyByTypeData, setPolicyByTypeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          claimsTrend,
          fraudDist,
          topAgents,
          renewalTrend,
          policyByType
        ] = await Promise.all([
          analyticsService.getClaimsTrend(),
          analyticsService.getFraudDistribution(),
          analyticsService.getTopAgents(),
          analyticsService.getRenewalTrend(),
          analyticsService.getPolicyByType()
        ]);
        
        setClaimsTrendData(claimsTrend);
        setFraudDistributionData(fraudDist);
        setTopAgentsData(topAgents);
        setRenewalTrendData(renewalTrend);
        setPolicyByTypeData(policyByType);
      } catch (error) {
        console.error("Failed to load analytics data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Comprehensive insurance operations analytics</p>
      </div>

      {/* Claims trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LineChartCard
          data={claimsTrendData}
          dataKeys={['filed', 'approved', 'rejected', 'settled']}
          title="Claims Trend — Filed vs Settled"
          colors={['#3b82f6', '#10b981', '#ef4444', '#8b5cf6']}
        />
        <PieChartCard
          data={fraudDistributionData}
          title="Fraud Risk Distribution"
        />
      </div>

      {/* Agent performance & renewal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartCard
          data={topAgentsData}
          dataKeys={['policies', 'premium']}
          xKey="name"
          title="Top Agents by Performance"
          colors={['#3b82f6', '#06b6d4']}
        />
        <AreaChartCard
          data={renewalTrendData}
          dataKeys={['renewed', 'lapsed', 'due']}
          title="Policy Renewal Trends"
          colors={['#10b981', '#ef4444', '#f59e0b']}
        />
      </div>

      {/* Policy by type */}
      <BarChartCard
        data={policyByTypeData}
        dataKeys={['count', 'premium']}
        xKey="type"
        title="Policies by Insurance Type — Count & Premium"
        colors={['#8b5cf6', '#06b6d4']}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Claims Settlement Rate</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold gradient-text">72%</span>
            <span className="text-xs text-emerald-400 mb-1">+5% from last quarter</span>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Average Claim Cycle Time</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold gradient-text">14</span>
            <span className="text-xs text-slate-400 mb-1">days average</span>
          </div>
          <p className="text-xs text-emerald-400 mt-2">-2 days improvement this month</p>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Loss Ratio</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold gradient-text">58%</span>
            <span className="text-xs text-amber-400 mb-1">within target range</span>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full" style={{ width: '58%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
