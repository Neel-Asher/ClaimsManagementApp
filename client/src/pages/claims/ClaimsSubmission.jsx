import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Send } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { claimService, policyService, fraudService } from '../../services/dataService';
import { formatCurrency, formatDate } from '../../utils/helpers';

export default function ClaimsSubmission() {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    policy_id: '',
    claim_type: '',
    incident_date: '',
    claim_amount: '',
    description: '',
  });
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [claimData, policyData] = await Promise.all([
          claimService.getAll(),
          policyService.getAll()
        ]);
        setClaims(claimData);
        setPolicies(policyData);
      } catch (error) {
        console.error("Failed to load claims submission data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const policy = policies.find(p => p.policy_id === form.policy_id);
      const payload = {
        ...form,
        claim_amount: Number(form.claim_amount),
        customer_id: policy?.customer_id || 1,
      };

      const newClaim = await claimService.create(payload);
      
      // Auto-trigger fraud prediction
      if (newClaim.claim_id) {
        fraudService.predict(newClaim.claim_id).catch(err => console.error("Fraud predict failed", err));
      }

      setClaims(prev => [newClaim, ...prev]);
      setSubmitted(true);
      setTimeout(() => { 
        setSubmitted(false); 
        setShowForm(false); 
        setForm({ policy_id: '', claim_type: '', incident_date: '', claim_amount: '', description: '' }); 
        setDocuments([]); 
      }, 2000);
    } catch (error) {
      console.error("Failed to submit claim", error);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files.map(f => f.name));
  };

  const columns = [
    { header: 'Claim ID', accessor: 'claim_id' },
    { header: 'Policy', accessor: 'policy_id' },
    { header: 'Type', accessor: 'claim_type' },
    { header: 'Amount', accessor: 'claim_amount', render: (row) => formatCurrency(row.claim_amount) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Filed', accessor: 'created_at', render: (row) => formatDate(row.created_at) },
  ];

  const inputClass = "w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Claims</h1>
          <p className="text-sm text-slate-400 mt-1">Submit and track insurance claims</p>
        </div>
        <button
          id="new-claim-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          <Send size={16} /> File New Claim
        </button>
      </div>

      {/* Claim form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">Claim Submitted Successfully!</h3>
              <p className="text-sm text-slate-400 mt-1">Your claim has been registered and is pending review.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-base font-semibold text-white">New Claim</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Policy</label>
                  <select value={form.policy_id} onChange={e => setForm({...form, policy_id: e.target.value})} required className={`${inputClass} cursor-pointer`}>
                    <option value="">Select policy</option>
                    {policies.filter(p => p.status === 'active').map(p => (
                      <option key={p.policy_id} value={p.policy_id}>{p.policy_id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Claim Type</label>
                  <select value={form.claim_type} onChange={e => setForm({...form, claim_type: e.target.value})} required className={`${inputClass} cursor-pointer`}>
                    <option value="">Select type</option>
                    <option value="Health">Health / Hospitalization</option>
                    <option value="Motor">Motor Accident</option>
                    <option value="Property">Property Damage</option>
                    <option value="Life">Life Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Incident Date</label>
                  <input type="date" value={form.incident_date} onChange={e => setForm({...form, incident_date: e.target.value})} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Claim Amount (₹)</label>
                  <input type="number" value={form.claim_amount} onChange={e => setForm({...form, claim_amount: e.target.value})} required min="1" className={inputClass} placeholder="Enter amount" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required className={`${inputClass} h-24 resize-none`} placeholder="Describe the incident..." />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Supporting Documents</label>
                <label className="flex items-center gap-3 px-4 py-4 border-2 border-dashed border-slate-700/50 rounded-xl cursor-pointer hover:border-blue-500/30 transition-colors">
                  <Upload size={20} className="text-slate-500" />
                  <div>
                    <p className="text-sm text-slate-400">Click to upload documents</p>
                    <p className="text-[10px] text-slate-600">PDF, JPG, PNG — Max 10MB each</p>
                  </div>
                  <input type="file" multiple onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                </label>
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {documents.map((doc, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-300">
                        <FileText size={12} /> {doc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all">
                  Submit Claim
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Claims table */}
      <DataTable
        title="All Claims"
        columns={columns}
        data={claims}
        searchPlaceholder="Search claims..."
      />
    </div>
  );
}
