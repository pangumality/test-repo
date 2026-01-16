import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, ArrowUp, ArrowDown, History, Trash2, Edit2 } from 'lucide-react';
import api from '../../utils/api';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/80 backdrop-blur-2xl rounded-2xl p-6 w-full max-w-md border border-white/40 shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-white/40 pb-3 -mx-6 px-6 pt-1 rounded-t-2xl"
             style={{ backgroundImage: 'linear-gradient(to right, var(--ui-accent-strong), transparent)' }}>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/80 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Forms
  const [itemForm, setItemForm] = useState({ name: '', category: '', quantity: 0, unit: 'pcs', minStock: 5, location: '' });
  const [transForm, setTransForm] = useState({ type: 'OUT', quantity: 1, notes: '' });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, itemForm);
      } else {
        await api.post('/inventory', itemForm);
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({ name: '', category: '', quantity: 0, unit: 'pcs', minStock: 5, location: '' });
      fetchItems();
    } catch (error) {
      alert('Operation failed');
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/transaction', {
        itemId: selectedItem.id,
        ...transForm
      });
      setShowTransactionModal(false);
      setSelectedItem(null);
      setTransForm({ type: 'OUT', quantity: 1, notes: '' });
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.error || 'Transaction failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      fetchItems();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category || '',
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      minStock: item.minStock,
      location: item.location || ''
    });
    setShowItemModal(true);
  };

  const openTransaction = (item, type) => {
    setSelectedItem(item);
    setTransForm({ type, quantity: 1, notes: '' });
    setShowTransactionModal(true);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-gradient">Inventory Management</h2>
          <p className="text-slate-500">Track stock levels and assets</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={() => { setEditingItem(null); setItemForm({ name: '', category: '', quantity: 0, unit: 'pcs', minStock: 5, location: '' }); setShowItemModal(true); }}
            className="flex items-center gap-2 btn-primary"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-soft border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-slate-600">Item Name</th>
                  <th className="p-4 font-semibold text-slate-600">Category</th>
                  <th className="p-4 font-semibold text-slate-600">Location</th>
                  <th className="p-4 font-semibold text-slate-600">Stock Level</th>
                  <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">Min: {item.minStock} {item.unit}</div>
                    </td>
                    <td className="p-4 text-slate-600">{item.category || '-'}</td>
                    <td className="p-4 text-slate-600">{item.location || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${item.quantity <= item.minStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-sm text-slate-500">{item.unit}</span>
                        {item.quantity <= item.minStock && (
                          <AlertTriangle size={16} className="text-rose-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openTransaction(item, 'IN')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Restock (In)"
                        >
                          <ArrowDown size={18} />
                        </button>
                        <button 
                          onClick={() => openTransaction(item, 'OUT')}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Distribute (Out)"
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button 
                          onClick={() => openEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No items found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title={editingItem ? "Edit Item" : "New Item"}>
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input type="text" required className="w-full border p-2 rounded" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input type="text" className="w-full border p-2 rounded" value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" className="w-full border p-2 rounded" value={itemForm.location} onChange={e => setItemForm({...itemForm, location: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input type="number" required className="w-full border p-2 rounded" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <input type="text" className="w-full border p-2 rounded" value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Stock</label>
              <input type="number" className="w-full border p-2 rounded" value={itemForm.minStock} onChange={e => setItemForm({...itemForm, minStock: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Save Item</button>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} title={`Record Transaction: ${selectedItem?.name}`}>
        <form onSubmit={handleTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Transaction Type</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setTransForm({...transForm, type: 'IN'})}
                className={`flex-1 py-2 rounded border ${transForm.type === 'IN' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-50'}`}
              >
                Stock In (+)
              </button>
              <button 
                type="button" 
                onClick={() => setTransForm({...transForm, type: 'OUT'})}
                className={`flex-1 py-2 rounded border ${transForm.type === 'OUT' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-gray-50'}`}
              >
                Stock Out (-)
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input 
              type="number" 
              min="1"
              required 
              className="w-full border p-2 rounded" 
              value={transForm.quantity} 
              onChange={e => setTransForm({...transForm, quantity: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea 
              className="w-full border p-2 rounded" 
              rows="3"
              value={transForm.notes} 
              onChange={e => setTransForm({...transForm, notes: e.target.value})} 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">Confirm Transaction</button>
        </form>
      </Modal>
    </div>
  );
}
