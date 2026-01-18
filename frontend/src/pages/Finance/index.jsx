import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { CreditCard, Search, Plus, ListChecks, Printer, Trash2 } from 'lucide-react';
import Select from '../../components/Select';

const FEE_AMOUNT = 1200;

export default function Finance() {
  const { formatCurrencyFromBase, convertAmountToBase, currencyConfig } = useOutletContext() || {};

  const formatCurrency = (amount) => {
    if (typeof formatCurrencyFromBase === 'function') {
      return formatCurrencyFromBase(amount);
    }
    const numeric = Number(amount || 0);
    return `ZMW ${numeric.toLocaleString()}`;
  };

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState({});
  const [query, setQuery] = useState('');
  const [klassFilter, setKlassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeStudent, setActiveStudent] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [term, setTerm] = useState(() => {
    const m = new Date().getMonth();
    return (m <= 3 ? 1 : m <= 7 ? 2 : 3).toString();
  });

  const fetchData = async () => {
    try {
      const [clsRes, finRes] = await Promise.all([
        api.get('/classes'),
        api.get('/finance/students')
      ]);
      setClasses(clsRes.data);
      
      const stds = finRes.data.map(s => ({
           id: s.id,
           name: s.name,
           section: s.section,
           klass: s.klass // Using ID from backend for filtering
      }));
      const pays = {};
      finRes.data.forEach(s => {
          pays[s.id] = s.payments;
      });
      
      setStudents(stds);
      setPayments(pays);
    } catch (error) {
      console.error('Failed to fetch finance data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const classesById = useMemo(() => {
    const map = {};
    for (const c of classes) map[c.id] = c;
    return map;
  }, [classes]);

  function totalPaidFor(studentId) {
    const list = payments[studentId] || [];
    return list.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }
  function lastPaymentDateFor(studentId) {
    const list = payments[studentId] || [];
    if (!list.length) return null;
    return list[0].date; // Sorted desc in backend
  }
  function statusFor(studentId) {
    const paid = totalPaidFor(studentId);
    if (paid === 0) return 'Not Paid';
    if (paid >= FEE_AMOUNT) return 'Paid';
    return 'Partial';
  }

  const filtered = useMemo(() => {
    return students
      .filter(s => {
        if (klassFilter !== 'all' && s.klass !== klassFilter) return false;
        if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
        const st = statusFor(s.id);
        if (statusFilter !== 'all' && st !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, query, klassFilter, statusFilter, payments]);

  const totals = useMemo(() => {
    const due = students.length * FEE_AMOUNT;
    let paid = 0;
    const label = selectedTermLabel();
    for (const s of students) paid += totalPaidForTerm(s.id, label);
    const balance = Math.max(due - paid, 0);
    return { due, paid, balance };
  }, [students, payments, year, term]);

  function klassLabel(id) {
    const c = classesById[id];
    return c ? c.name : '';
  }
  function initials(name) {
    const parts = (name || '').split(' ');
    return ((parts[0] || '').charAt(0) + (parts[1] || '').charAt(0)).toUpperCase();
  }
  function termLabelFromDate(d) {
    if (!d) return '';
    const date = new Date(d);
    const y = date.getFullYear();
    const m = date.getMonth();
    const t = m <= 3 ? 1 : m <= 7 ? 2 : 3;
    return `${y} Term ${t}`;
  }
  function selectedTermLabel() {
    return `${year} Term ${term}`;
  }
  function totalPaidForTerm(studentId, label) {
    const list = payments[studentId] || [];
    return list
      .filter(p => termLabelFromDate(p.date) === label)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }

  function openAddPayment(student) {
    setActiveStudent(student);
    setAmount('');
    setMethod('Cash');
    setDate(new Date().toISOString().slice(0, 10));
    setReference('');
    setAddOpen(true);
  }
  function openView(student) {
    setActiveStudent(student);
    setViewOpen(true);
  }
  
  async function savePayment() {
    if (!activeStudent) return;
    const amt = Number(amount || 0);
    if (!amt || amt <= 0) return;
    
    try {
      const baseAmount =
        typeof convertAmountToBase === 'function' ? convertAmountToBase(amt) : amt;
      await api.post('/finance/payments', {
        studentId: activeStudent.id,
        amount: baseAmount,
        method,
        date,
        reference
      });
      setAddOpen(false);
      fetchData(); 
    } catch (error) {
      alert('Failed to save payment');
    }
  }

  async function deletePayment(id) {
    if(!window.confirm('Are you sure you want to delete this payment?')) return;
    try {
      await api.delete(`/finance/payments/${id}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete payment');
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-700 uppercase">Finance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-gray-500" size={20} />
            <span className="text-sm text-gray-500">Total Due</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-800">
            {formatCurrency(totals.due)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-green-600" size={20} />
            <span className="text-sm text-gray-500">Total Paid</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-800">
            {formatCurrency(totals.paid)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-soft p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="text-red-600" size={20} />
            <span className="text-sm text-gray-500">Outstanding</span>
          </div>
          <div className="mt-2 text-2xl font-semibold text-gray-800">
            {formatCurrency(totals.balance)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pupil by name"
                className="pl-9 pr-3 py-2 border rounded-md bg-white text-gray-700 placeholder-gray-400 w-64"
              />
            </div>
            <div className="w-28">
              <Select
                value={year}
                onChange={setYear}
                options={Array.from({ length: 5 }).map((_, i) => {
                  const y = (new Date().getFullYear() - i).toString();
                  return { value: y, label: y };
                })}
              />
            </div>
            <div className="w-28">
              <Select
                value={term}
                onChange={setTerm}
                options={[
                  { value: '1', label: 'Term 1' },
                  { value: '2', label: 'Term 2' },
                  { value: '3', label: 'Term 3' },
                ]}
              />
            </div>
            <div className="w-40">
              <Select
                value={klassFilter}
                onChange={setKlassFilter}
                options={[
                  { value: 'all', label: 'All Classes' },
                  ...classes.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
            <div className="w-36">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Partial', label: 'Partial' },
                  { value: 'Not Paid', label: 'Not Paid' },
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 flex items-center gap-2"
              onClick={() => {
                const first = filtered[0] || students[0];
                if (first) openAddPayment(first);
              }}
            >
              <Plus size={18} /> Add Payment
            </button>
            <button
              className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                const first = filtered[0] || students[0];
                if (first) openView(first);
              }}
            >
              <ListChecks size={18} /> View History
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 border-b text-gray-600">Pupil</th>
                <th className="text-left px-4 py-2 border-b text-gray-600">Class</th>
                <th className="text-right px-4 py-2 border-b text-gray-600">Due</th>
                <th className="text-right px-4 py-2 border-b text-gray-600">Paid</th>
                <th className="text-right px-4 py-2 border-b text-gray-600">Balance</th>
                <th className="text-left px-4 py-2 border-b text-gray-600">Last Payment</th>
                <th className="text-left px-4 py-2 border-b text-gray-600">Status</th>
                <th className="text-left px-4 py-2 border-b text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const label = selectedTermLabel();
                const paid = totalPaidForTerm(s.id, label);
                const balance = Math.max(FEE_AMOUNT - paid, 0);
                const last = lastPaymentDateFor(s.id);
                const st = statusFor(s.id);
                return (
                  <tr key={s.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-4 py-2 border-b">
                      <div className="font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.section}</div>
                    </td>
                    <td className="px-4 py-2 border-b text-gray-700">{klassLabel(s.klass)}</td>
                    <td className="px-4 py-2 border-b text-right text-gray-700">
                      {formatCurrency(FEE_AMOUNT)}
                    </td>
                    <td className="px-4 py-2 border-b text-right text-gray-700">
                      {formatCurrency(paid)}
                    </td>
                    <td className="px-4 py-2 border-b text-right text-gray-700">
                      {formatCurrency(balance)}
                    </td>
                    <td className="px-4 py-2 border-b text-gray-700">{last || '-'}</td>
                    <td className="px-4 py-2 border-b">
                      <span
                        className={
                          st === 'Paid'
                            ? 'px-2 py-1 text-xs rounded-md bg-green-100 text-green-700'
                            : st === 'Partial'
                            ? 'px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-700'
                            : 'px-2 py-1 text-xs rounded-md bg-red-100 text-red-700'
                        }
                      >
                        {st}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 rounded-md bg-gray-800 text-white hover:bg-gray-700 text-sm"
                          onClick={() => openAddPayment(s)}
                        >
                          Add Payment
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                          onClick={() => openView(s)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
                    No pupils found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={activeStudent ? `Add Payment · ${activeStudent.name}` : 'Add Payment'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Amount ({currencyConfig?.code || 'ZMW'})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Method</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white text-gray-700"
              >
                <option>Cash</option>
                <option>Mobile Money</option>
                <option>Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Reference</label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Ref or receipt number"
                className="w-full px-3 py-2 border rounded-md bg-white text-gray-700"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="px-3 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700" onClick={savePayment}>Save</button>
          </div>
        </div>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={activeStudent ? `Finance · ${activeStudent.name}` : 'Finance'}>
        {activeStudent ? (
          <div className="space-y-6">
            <div className="bg-gray-50 border rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white flex items-center justify-center text-lg font-semibold">
                  {initials(activeStudent.name)}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-semibold text-gray-800">{activeStudent.name}</div>
                  <div className="text-sm text-gray-600">{klassLabel(activeStudent.klass)} · {activeStudent.section}</div>
                </div>
                <div className="px-3 py-1 rounded-md bg-gray-800 text-white text-sm">{selectedTermLabel()}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-soft p-5 border">
                <div className="text-sm text-gray-500">Amount Due (Current Term)</div>
                <div className="mt-2 text-2xl font-semibold text-gray-800">
                  {formatCurrency(FEE_AMOUNT)}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-5 border">
                <div className="text-sm text-gray-500">Paid (Current Term)</div>
                <div className="mt-2 text-2xl font-semibold text-gray-800">
                  {formatCurrency(
                    totalPaidForTerm(activeStudent.id, selectedTermLabel())
                  )}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-soft p-5 border">
                <div className="text-sm text-gray-500">Balance (Current Term)</div>
                <div className="mt-2 text-2xl font-semibold text-gray-800">
                  {formatCurrency(
                    Math.max(
                      FEE_AMOUNT -
                        totalPaidForTerm(
                          activeStudent.id,
                          selectedTermLabel()
                        ),
                      0
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-6 border">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-800">Payment History</div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => window.print()}
                  >
                    <Printer size={18} /> Print
                  </button>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                {(payments[activeStudent.id] || []).length > 0 ? (
                  <table className="min-w-full border rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 border-b text-gray-600">Date</th>
                        <th className="text-left px-4 py-2 border-b text-gray-600">Term</th>
                        <th className="text-left px-4 py-2 border-b text-gray-600">Method</th>
                        <th className="text-left px-4 py-2 border-b text-gray-600">Reference</th>
                        <th className="text-right px-4 py-2 border-b text-gray-600">Amount</th>
                        <th className="text-left px-4 py-2 border-b text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payments[activeStudent.id] || [])
                        .slice()
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((p, i) => (
                          <tr key={i} className="odd:bg-white even:bg-gray-50">
                            <td className="px-4 py-2 border-b text-gray-700">{p.date}</td>
                            <td className="px-4 py-2 border-b text-gray-700">{termLabelFromDate(p.date)}</td>
                            <td className="px-4 py-2 border-b text-gray-700">{p.method}</td>
                            <td className="px-4 py-2 border-b text-gray-700">
                              {p.reference || '-'}
                            </td>
                            <td className="px-4 py-2 border-b text-right text-gray-700">
                              {formatCurrency(Number(p.amount))}
                            </td>
                            <td className="px-4 py-2 border-b">
                              <button
                                className="px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs flex items-center gap-1"
                                onClick={() => deletePayment(p.id)}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-gray-600">No payments recorded</div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end">
                <div className="text-sm">
                  <span className="text-gray-600">Total Paid:</span>{' '}
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(totalPaidFor(activeStudent.id))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">No pupil selected</div>
        )}
      </Modal>
    </div>
  );
}
