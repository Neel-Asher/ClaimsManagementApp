import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, FileSearch, TrendingDown } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import { PieChartCard, BarChartCard } from '../../components/charts/Charts';
import { fraudService, claimService, analyticsService } from '../../services/dataService';
import { formatDate, getFraudColor, getFraudBg } from '../../utils/helpers';

export default function FraudDetectionReport() {
  const [predictions, setPredictions] = useState([]);
  const [fraudDistribution, setFraudDistribution] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [preds, dist, claimData] = await Promise.all([
          fraudService.getAllPredictions(),
          analyticsService.getFraudDistribution(),
          claimService.getAll()
        ]);
        setPredictions(preds);
        setFraudDistribution(dist);
        setClaims(claimData);
      } catch (error) {
        console.error("Failed to load fraud data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const highRisk = predictions.filter(f => f.fraud_probability >= 70);
  const mediumRisk = predictions.filter(f => f.fraud_probability >= 40 && f.fraud_probability < 70);
  const lowRisk = predictions.filter(f => f.fraud_probability < 40);

  // Dynamically calculate fraud by type based on predictions + claims
  const fraudByTypeMap = {};
  predictions.forEach(p => {
    const claim = claims.find(c => c.claim_id === p.claim_id);
    if (claim) {
      const type = claim.claim_type;
      if (!fraudByTypeMap[type]) fraudByTypeMap[type] = { type, count: 0, total_score: 0 };
      fraudByTypeMap[type].count += 1;
      fraudByTypeMap[type].total_score += p.fraud_probability;
    }
  });
  
  const fraudByTypeData = Object.values(fraudByTypeMap).map(d => ({
    type: d.type,
    count: d.count,
    avg_score: Math.round(d.total_score / d.count)
  }));

  const columns = [
    { header: 'Claim ID', accessor: 'claim_id' },
    {
      header: 'Fraud Probability',
      accessor: 'fraud_probability',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                row.fraud_probability >= 70 ? 'bg-red-500' :
                row.fraud_probability >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${row.fraud_probability}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${getFraudColor(row.fraud_probability)}`}>{row.fraud_probability}%</span>
        </div>
      ),
    },
    {
      header: 'Risk Level',
      accessor: 'risk_status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getFraudBg(row.fraud_probability)} ${getFraudColor(row.fraud_probability)}`}>
          {row.fraud_probability >= 70 && <AlertTriangle size={12} />}
          {row.risk_status || (row.fraud_probability >= 70 ? 'High Risk' : row.fraud_probability >= 40 ? 'Medium Risk' : 'Low Risk')}
        </span>
      ),
    },
    { header: 'Recommendation', accessor: 'recommendation', render: (row) => (
      <span className="text-xs text-slate-400">{row.recommendation || 'N/A'}</span>
    )},
    { header: 'Generated', accessor: 'generated_at', render: (row) => formatDate(row.generated_at || new Date().toISOString()) },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Fraud Detection Report</h1>
        <p className="text-sm text-slate-400 mt-1">AI-powered fraud analysis and risk scoring</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Predictions" value={predictions.length} icon={FileSearch} color="blue" />
        <StatCard title="High Risk" value={highRisk.length} icon={AlertTriangle} color="red" />
        <StatCard title="Medium Risk" value={mediumRisk.length} icon={ShieldAlert} color="amber" />
        <StatCard title="Low Risk" value={lowRisk.length} icon={TrendingDown} color="green" />
      </div>

      {/* Sample prediction card */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4">Latest High-Risk Prediction</h3>
        {highRisk.length > 0 ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-red-400">{highRisk[0].fraud_probability}%</span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">{highRisk[0].risk_status || 'High Risk'}</span>
                </div>
                <p className="text-sm text-slate-300 mb-1"><strong>Claim:</strong> {highRisk[0].claim_id}</p>
                <p className="text-sm text-slate-400"><strong>Recommendation:</strong> {highRisk[0].recommendation || 'Review manually'}</p>
                <div className="mt-3 w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full" style={{ width: `${highRisk[0].fraud_probability}%` }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-emerald-500">Low Risk</span>
                  <span className="text-[10px] text-amber-500">Medium</span>
                  <span className="text-[10px] text-red-500">High Risk</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No high-risk predictions found.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard data={fraudDistribution} title="Fraud Risk Distribution" />
        <BarChartCard data={fraudByTypeData} dataKeys={['count', 'avg_score']} xKey="type" title="Fraud by Claim Type" colors={['#ef4444', '#f59e0b']} />
      </div>

      <DataTable
        title="All Fraud Predictions"
        columns={columns}
        data={predictions}
        searchPlaceholder="Search predictions..."
      />
    </div>
  );
}
