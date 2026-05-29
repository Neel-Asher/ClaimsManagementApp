import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/modals/Modal';
import { customerService } from '../../services/dataService';
import { formatDate } from '../../utils/helpers';

const emptyForm = { name: '', email: '', phone: '', dob: '', address: '', kyc_status: 'pending', agent_id: 1 };

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditId(c.customer_id); setForm(c); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        const updated = await customerService.update(editId, form);
        setCustomers(prev => prev.map(c => c.customer_id === editId ? updated : c));
      } else {
        const created = await customerService.create(form);
        setCustomers(prev => [...prev, created]);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save customer", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await customerService.delete(id);
        setCustomers(prev => prev.filter(c => c.customer_id !== id));
      } catch (error) {
        console.error("Failed to delete customer", error);
      }
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'KYC Status', render: (row) => <StatusBadge status={row.kyc_status} /> },
    { header: 'Joined', accessor: 'created_at', render: (row) => formatDate(row.created_at) },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"><Edit size={15} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.customer_id); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customer Management</h1>
          <p className="text-sm text-slate-400 mt-1">Manage customer profiles and KYC</p>
        </div>
      </div>

      <DataTable
        title="All Customers"
        columns={columns}
        data={customers}
        searchPlaceholder="Search by name, email..."
        actions={
          <button id="add-customer-btn" onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors">
            <Plus size={14} /> Add Customer
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className={inputClass} placeholder="Enter name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className={inputClass} placeholder="Enter email" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required className={inputClass} placeholder="+91-..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date of Birth</label>
              <input type="date" value={form.dob ? form.dob.substring(0, 10) : ''} onChange={e => setForm({...form, dob: e.target.value})} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Address</label>
            <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} required className={`${inputClass} h-20 resize-none`} placeholder="Enter address" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">KYC Status</label>
            <select value={form.kyc_status} onChange={e => setForm({...form, kyc_status: e.target.value})} className={`${inputClass} cursor-pointer`}>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">
              {editId ? 'Update' : 'Add'} Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
