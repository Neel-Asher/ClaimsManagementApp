import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, AlertTriangle, ArrowRight } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/modals/Modal';
import { claimService, fraudService } from '../../services/dataService';
import { formatCurrency, formatDate, getFraudColor, getFraudBg, getRiskLabel } from '../../utils/helpers';

export default function ClaimsWorkflow() {
  const [claims, setClaims] = useState([]);
  const [fraudPredictions, setFraudPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [claimData, fraudData] = await Promise.all([
          claimService.getAll(),
          fraudService.getAllPredictions()
        ]);
        setClaims(claimData);
        setFraudPredictions(fraudData);
      } catch (error) {
        console.error("Failed to load claims workflow data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filters = [
    { key: 'all', label: 'All Claims', count: claims.length },
    { key: 'pending', label: 'Pending', count: claims.filter(c => c.status === 'pending').length },
    { key: 'under_review', label: 'Under Review', count: claims.filter(c => c.status === 'under_review').length },
    { key: 'approved', label: 'Approved', count: claims.filter(c => c.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: claims.filter(c => c.status === 'rejected').length },
  ];

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter);

  const updateStatus = async (claimId, newStatus) => {
    try {
      const updated = await claimService.update(claimId, { status: newStatus });
      setClaims(prev => prev.map(c => c.claim_id === claimId ? { ...c, status: newStatus } : c));
      setSelectedClaim(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error("Failed to update claim status", error);
    }
  };

  const getFraud = (claimId) => fraudPredictions.find(f => f.claim_id === claimId);

  const timelineSteps = [
    { label: 'Intake', status: 'completed' },
    { label: 'Registration', status: 'completed' },
    { label: 'Survey', status: 'current' },
    { label: 'Assessment', status: 'pending' },
    { label: 'Settlement', status: 'pending' },
    { label: 'Closure', status: 'pending' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Claims Workflow</h1>
        <p className="text-sm text-slate-400 mt-1">Manage, review, and process insurance claims</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex items-center gap-2 ${
              filter === f.key
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
            }`}
          >
            {f.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              filter === f.key ? 'bg-blue-500/30' : 'bg-slate-700'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Claims cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(claim => {
          return (
            <div
              key={claim.claim_id}
              onClick={() => setSelectedClaim(claim)}
              className="glass-card p-5 cursor-pointer hover:border-blue-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">{claim.claim_id}</p>
                  <p className="text-xs text-slate-500">{claim.customer_name || 'Unknown'}</p>
                </div>
                <StatusBadge status={claim.status} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-300">{claim.claim_type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Amount</span>
                  <span className="text-slate-300 font-medium">{formatCurrency(claim.claim_amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Filed</span>
                  <span className="text-slate-300">{formatDate(claim.created_at)}</span>
                </div>
              </div>

              {/* Fraud score bar */}
              <div className="pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Fraud Score</span>
                  <span className={`text-xs font-bold ${getFraudColor(claim.fraud_score || 0)}`}>{claim.fraud_score || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (claim.fraud_score || 0) >= 70 ? 'bg-red-500' :
                      (claim.fraud_score || 0) >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${claim.fraud_score || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                {claim.status === 'pending' || claim.status === 'under_review' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateStatus(claim.claim_id, 'approved'); }}
                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/30 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateStatus(claim.claim_id, 'rejected'); }}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : <div />}
                <button className="p-1.5 rounded-lg text-slate-500 group-hover:text-blue-400 transition-colors">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!selectedClaim} onClose={() => setSelectedClaim(null)} title={`Claim ${selectedClaim?.claim_id}`} size="lg">
        {selectedClaim && (
          <div className="space-y-5">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Customer</p>
                <p className="text-sm font-medium text-white mt-0.5">{selectedClaim.customer_name || 'Unknown'}</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Amount</p>
                <p className="text-sm font-medium text-white mt-0.5">{formatCurrency(selectedClaim.claim_amount)}</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Type</p>
                <p className="text-sm font-medium text-white mt-0.5">{selectedClaim.claim_type}</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                <div className="mt-1"><StatusBadge status={selectedClaim.status} /></div>
              </div>
            </div>

            <div className="p-3 bg-slate-700/30 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Description</p>
              <p className="text-sm text-slate-300 mt-1">{selectedClaim.description}</p>
            </div>

            {/* Fraud score section */}
            {(() => {
              const fraud = getFraud(selectedClaim.claim_id);
              if (!fraud && !selectedClaim.fraud_score) return null;
              
              const prob = fraud ? fraud.fraud_probability : selectedClaim.fraud_score;
              const status = fraud ? fraud.risk_status : (prob >= 70 ? 'High Risk' : prob >= 40 ? 'Medium Risk' : 'Low Risk');
              const recommendation = fraud ? fraud.recommendation : 'Auto-generated risk assessment.';
              
              return (
                <div className={`p-4 rounded-xl border ${getFraudBg(prob)} border-slate-700/50`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className={getFraudColor(prob)} />
                    <span className={`text-sm font-semibold ${getFraudColor(prob)}`}>
                      {status} — {prob}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{recommendation}</p>
                </div>
              );
            })()}

            {/* Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Claim Timeline</h4>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {timelineSteps.map((step, i) => (
                  <div key={i} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        step.status === 'current' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' :
                        'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                      }`}>
                        {step.status === 'completed' ? <CheckCircle size={16} /> : i + 1}
                      </div>
                      <p className={`text-[10px] mt-1 whitespace-nowrap ${
                        step.status === 'current' ? 'text-blue-400 font-medium' : 'text-slate-500'
                      }`}>{step.label}</p>
                    </div>
                    {i < timelineSteps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-1 mt-[-16px] ${
                        step.status === 'completed' ? 'bg-emerald-500/50' : 'bg-slate-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            {(selectedClaim.status === 'pending' || selectedClaim.status === 'under_review') && (
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => updateStatus(selectedClaim.claim_id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <CheckCircle size={16} /> Approve Claim
                </button>
                <button
                  onClick={() => updateStatus(selectedClaim.claim_id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <XCircle size={16} /> Reject Claim
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
