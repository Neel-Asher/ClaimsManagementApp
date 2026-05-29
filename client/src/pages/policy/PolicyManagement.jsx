import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Filter } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/modals/Modal';
import { policyService, customerService, productService } from '../../services/dataService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const emptyForm = { customer_id: '', product_id: '', start_date: '', end_date: '', premium_amount: '', status: 'active' };

export default function PolicyManagement() {
  const [policies, setPolicies] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pols, custs, prods] = await Promise.all([
          policyService.getAll(),
          customerService.getAll(),
          productService.getAll()
        ]);
        setPolicies(pols);
        setCustomers(custs);
        setProducts(prods);
      } catch (error) {
        console.error("Failed to load policy data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const productTypes = ['all', 'Health', 'Motor', 'Life', 'Property'];

  const filteredPolicies = typeFilter === 'all'
    ? policies
    : policies.filter(p => {
        const product = products.find(pr => pr.product_id === p.product_id);
        return product?.type === typeFilter;
      });

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => {
    setEditId(p.policy_id);
    setForm({ ...p });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const product = products.find(pr => pr.product_id === Number(form.product_id));
      const customer = customers.find(c => c.customer_id === Number(form.customer_id));
      
      let payload = {
        ...form,
        premium_amount: form.premium_amount ? Number(form.premium_amount) : (product?.premium_rate || 0)
      };

      if (editId) {
        const updated = await policyService.update(editId, payload);
        // manually attach names for UI
        updated.product_name = product?.name;
        updated.customer_name = customer?.name;
        setPolicies(prev => prev.map(p => p.policy_id === editId ? updated : p));
      } else {
        payload.agent_id = 1; // Defaulting to Agent 1 for demo
        payload.fraud_risk_score = 0;
        const created = await policyService.create(payload);
        created.product_name = product?.name;
        created.customer_name = customer?.name;
        setPolicies(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save policy", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      try {
        await policyService.delete(id);
        setPolicies(prev => prev.filter(p => p.policy_id !== id));
      } catch (error) {
        console.error("Failed to delete policy", error);
      }
    }
  };

  const columns = [
    { header: 'Policy ID', accessor: 'policy_id' },
    { header: 'Customer', accessor: 'customer_name' },
    { header: 'Product', accessor: 'product_name' },
    { header: 'Premium', accessor: 'premium_amount', render: (row) => formatCurrency(row.premium_amount) },
    { header: 'Start', accessor: 'start_date', render: (row) => formatDate(row.start_date) },
    { header: 'End', accessor: 'end_date', render: (row) => formatDate(row.end_date) },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit size={15} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.policy_id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
        </div>
      ),
    },
  ];

  const inputClass = "w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Policy Management</h1>
          <p className="text-sm text-slate-400 mt-1">Create and manage insurance policies</p>
        </div>
      </div>

      {/* Product type filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-slate-500" />
        {productTypes.map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              typeFilter === type
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
            }`}
          >
            {type === 'all' ? 'All Types' : type}
          </button>
        ))}
      </div>

      <DataTable
        title={`Policies ${typeFilter !== 'all' ? `— ${typeFilter}` : ''}`}
        columns={columns}
        data={filteredPolicies}
        searchPlaceholder="Search policies..."
        actions={
          <button id="add-policy-btn" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors">
            <Plus size={14} /> Create Policy
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Policy' : 'Create Policy'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Customer</label>
              <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} required className={`${inputClass} cursor-pointer`}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Insurance Product</label>
              <select value={form.product_id} onChange={e => setForm({...form, product_id: e.target.value})} required className={`${inputClass} cursor-pointer`}>
                <option value="">Select product</option>
                {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name} ({p.type}) — {formatCurrency(p.premium_rate)}/yr</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
              <input type="date" value={form.start_date ? form.start_date.substring(0,10) : ''} onChange={e => setForm({...form, start_date: e.target.value})} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
              <input type="date" value={form.end_date ? form.end_date.substring(0,10) : ''} onChange={e => setForm({...form, end_date: e.target.value})} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={`${inputClass} cursor-pointer`}>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="renewal_due">Renewal Due</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              {editId ? 'Update' : 'Create'} Policy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
