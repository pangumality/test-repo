import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Finance() {
  const [companies, setCompanies] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [voucherView, setVoucherView] = useState('list');
  const [voucherType, setVoucherType] = useState('Sales');
  const [voucherNo, setVoucherNo] = useState('SAL/AUTO');
  const [voucherDate, setVoucherDate] = useState(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  });
  const [voucherRef, setVoucherRef] = useState('');
  const [voucherLines, setVoucherLines] = useState([{ ledger: '', debit: '', credit: '' }, { ledger: '', debit: '', credit: '' }]);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherFilterType, setVoucherFilterType] = useState('All');
  const [voucherDateFrom, setVoucherDateFrom] = useState('');
  const [voucherDateTo, setVoucherDateTo] = useState('');
  const [partyFilter, setPartyFilter] = useState('All');
  const [partySearch, setPartySearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [gstYear, setGstYear] = useState('FY 2024-25');
  const [reportsTab, setReportsTab] = useState('All Reports');
  const [reportsPeriod, setReportsPeriod] = useState('This Month');
  const [newLedgerName, setNewLedgerName] = useState('');
  const [newLedgerType, setNewLedgerType] = useState('customer');
  const [createStatus, setCreateStatus] = useState('');
  const [tallyStatus, setTallyStatus] = useState({ connected: null, checking: false });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Companies
      const { data: companyData } = await api.get('/tally/companies');
      
      // Handle both mock and real Tally response structures
      let companyList = [];
      if (companyData?.ENVELOPE?.BODY?.COMPANYCOLLECTION?.COMPANY) {
        // Mock data structure
        companyList = companyData.ENVELOPE.BODY.COMPANYCOLLECTION.COMPANY;
      } else if (companyData?.ENVELOPE?.BODY?.DATA?.COLLECTION?.COMPANY) {
        // Real Tally data structure
        companyList = companyData.ENVELOPE.BODY.DATA.COLLECTION.COMPANY;
      }

      const normalizedCompanies = Array.isArray(companyList) ? companyList : (companyList ? [companyList] : []);
      setCompanies(normalizedCompanies);

      // 2. Fetch Ledgers
      const { data: ledgerData } = await api.get('/tally/ledgers');
      
      let ledgerList = [];
      if (ledgerData?.ENVELOPE?.BODY?.LEDGERCOLLECTION?.LEDGER) {
        ledgerList = ledgerData.ENVELOPE.BODY.LEDGERCOLLECTION.LEDGER;
      } else if (ledgerData?.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
        ledgerList = ledgerData.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
      }

      const normalizedLedgers = Array.isArray(ledgerList) ? ledgerList : (ledgerList ? [ledgerList] : []);
      setLedgers(normalizedLedgers);

    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from Tally');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    checkTallyHealth();
  }, []);

  // Helper to safely extract any Tally field value (works for simple strings or complex objects)
  const getTallyValue = (val) => {
    if (!val) return "";
    
    // If it's already a string/number, return it
    if (typeof val === 'string' || typeof val === 'number') return val;
    
    // Check for standard XML text content property "_"
    if (val._ !== undefined) return val._;
    
    // Fallback: try to find any property that looks like a value
    // (In some cases Tally might return other structures, but "_" is standard for xml2js)
    return JSON.stringify(val); 
  };

  // Helper to safely extract company name specifically (handles the Tally Object structure)
  const getCompanyName = (c) => {
    if (!c) return "Unknown Company";
    
    // Handle specific Company object structure where NAME might be nested
    // 1. Try direct NAME property if it's a string
    if (typeof c.NAME === 'string') return c.NAME;

    // 2. Try nested NAME object
    if (c.NAME && c.NAME._) return c.NAME._;

    // 3. Fallback to just passing the NAME object to generic helper
    if (c.NAME) return getTallyValue(c.NAME);
    
    // 4. Fallback: attributes
    if (c.$ && c.$.NAME) return c.$.NAME;

    return "Unknown Company";
  };

  // derive company name for heading
  const companyName = companies.length > 0 ? getCompanyName(companies[0]) : "Tally Integration";
  const tabs = [
    { key: 'dashboard', label: 'Tally Dashboard' },
    { key: 'ledgers', label: 'Ledgers' },
    { key: 'vouchers', label: 'Vouchers' },
    { key: 'parties', label: 'Parties' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'reports', label: 'Reports' },
    { key: 'gst', label: 'GST' },
  ];
  const formatINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const toNumber = (val) => {
    const v = getTallyValue(val);
    const s = String(v ?? '').replace(/[^0-9\.\-]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };
  const checkTallyHealth = async () => {
    setTallyStatus({ connected: null, checking: true });
    try {
      const { data } = await api.get('/tally/health');
      setTallyStatus({ connected: true, checking: false, responseTime: data.responseTime });
    } catch (e) {
      setTallyStatus({ connected: false, checking: false, error: e.response?.data?.message || 'Connection failed' });
    }
  };
  const ledgerRows = ledgers.map((l) => {
    const name = getTallyValue(l.$?.NAME ?? l.NAME);
    const parent = getTallyValue(l.PARENT);
    const amt = toNumber(l.OPENINGBALANCE);
    return { name, parent, amount: amt, type: amt >= 0 ? 'Cr' : 'Dr' };
  });
  const totalCredit = ledgerRows.reduce((a, r) => a + (r.amount > 0 ? r.amount : 0), 0);
  const totalDebit = ledgerRows.reduce((a, r) => a + (r.amount < 0 ? Math.abs(r.amount) : 0), 0);
  const groups = Array.from(new Set(ledgerRows.map(r => r.parent).filter(Boolean)));
  const filteredLedgerRows = ledgerRows.filter(r => {
    const matchesSearch = ledgerSearch
      ? r.name.toLowerCase().includes(ledgerSearch.toLowerCase())
      : true;
    const matchesGroup = groupFilter === 'All Groups' ? true : r.parent === groupFilter;
    return matchesSearch && matchesGroup;
  });
  const exportCSV = () => {
    const rows = [['Ledger Name','Group','Opening Balance','Current Balance','Type']];
    filteredLedgerRows.forEach(r => {
      rows.push([r.name, r.parent, r.amount, r.amount, r.type]);
    });
    const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledgers.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const voucherTypes = ['All','Sales','Purchase','Payment','Receipt','Contra','Journal','Credit Note','Debit Note'];
  const sampleVouchers = [
    { date: '2024-04-15', no: 'SAL/001', type: 'Sales', party: 'Sharma Traders', amount: 118000 },
    { date: '2024-04-12', no: 'PUR/001', type: 'Purchase', party: 'Mumbai Suppliers', amount: -59000 },
    { date: '2024-04-18', no: 'PMT/001', type: 'Payment', party: 'Multiple', amount: -30000 },
    { date: '2024-04-20', no: 'RCP/001', type: 'Receipt', party: 'Sharma Traders', amount: 75000 },
  ];
  const filteredVouchers = sampleVouchers.filter(v => {
    const matchesType = voucherFilterType === 'All' ? true : v.type === voucherFilterType;
    const searchStr = `${v.no} ${v.party}`.toLowerCase();
    const matchesSearch = voucherSearch ? searchStr.includes(voucherSearch.toLowerCase()) : true;
    const d = new Date(v.date);
    const fromOk = voucherDateFrom ? d >= new Date(voucherDateFrom) : true;
    const toOk = voucherDateTo ? d <= new Date(voucherDateTo) : true;
    return matchesType && matchesSearch && fromOk && toOk;
  });
  const addVoucherLine = () => setVoucherLines([...voucherLines, { ledger: '', debit: '', credit: '' }]);
  const removeVoucherLine = (idx) => setVoucherLines(voucherLines.filter((_, i) => i !== idx));
  const updateVoucherLine = (idx, field, value) => {
    const next = [...voucherLines];
    next[idx] = { ...next[idx], [field]: value };
    setVoucherLines(next);
  };
  const voucherTotals = voucherLines.reduce((acc, l) => {
    const d = parseFloat(String(l.debit).replace(/[^0-9\.\-]/g,'')) || 0;
    const c = parseFloat(String(l.credit).replace(/[^0-9\.\-]/g,'')) || 0;
    return { debit: acc.debit + d, credit: acc.credit + c };
  }, { debit: 0, credit: 0 });
  const voucherDiff = voucherTotals.debit - voucherTotals.credit;
  const saveVoucher = async () => {
    if (voucherType !== 'Sales') return;
    const partyLine = voucherLines.find(l => l.ledger);
    const amt = voucherTotals.credit || voucherTotals.debit;
    if (!partyLine || !partyLine.ledger || !amt) return;
    try {
      await api.post('/tally/sales', { party: partyLine.ledger, amount: amt });
      setVoucherView('list');
    } catch (e) {}
  };
  const partyRows = ledgerRows
    .filter(r => {
      const p = (r.parent || '').toLowerCase();
      return p.includes('sundry debtors') || p.includes('sundry creditors');
    })
    .map(r => {
      const role = (r.parent || '').toLowerCase().includes('sundry debtors') ? 'Customer' : 'Supplier';
      const payable = role === 'Supplier' && r.amount > 0 ? r.amount : 0;
      const receivable = role === 'Customer' && r.amount < 0 ? Math.abs(r.amount) : 0;
      return { name: r.name, group: r.parent, role, receivable, payable };
    });
  const partiesTotalReceivable = partyRows.reduce((a, r) => a + r.receivable, 0);
  const partiesTotalPayable = partyRows.reduce((a, r) => a + r.payable, 0);
  const filteredPartyRows = partyRows.filter(r => {
    const matchesType = partyFilter === 'All'
      ? true
      : partyFilter === 'Debtors'
        ? r.role === 'Customer'
        : r.role === 'Supplier';
    const matchesSearch = partySearch
      ? r.name.toLowerCase().includes(partySearch.toLowerCase())
      : true;
    return matchesType && matchesSearch;
  });
  const sampleStock = [
    { name: 'Steel Rods (10mm)', cat: 'Raw Materials', unit: 'Kg', qty: 350, qtyDelta: -150, rate: 88, rateDelta: 3.52 },
    { name: 'Steel Rods (12mm)', cat: 'Raw Materials', unit: 'Kg', qty: 280, qtyDelta: -120, rate: 92, rateDelta: 2.25 },
    { name: 'Cement (OPC)', cat: 'Raw Materials', unit: 'Bags', qty: 150, qtyDelta: -50, rate: 395, rateDelta: 3.93 },
    { name: 'Paint - White', cat: 'Finished Goods', unit: 'Ltrs', qty: 85, qtyDelta: -15, rate: 210, rateDelta: -1.0 },
    { name: 'Paint - Blue', cat: 'Finished Goods', unit: 'Ltrs', qty: 65, qtyDelta: -15, rate: 225, rateDelta: 0.8 },
  ];
  const filteredStock = sampleStock.filter(s => {
    return stockSearch ? s.name.toLowerCase().includes(stockSearch.toLowerCase()) : true;
  });
  const stockValueTotal = filteredStock.reduce((a, s) => a + s.qty * s.rate, 0);
  const lowStockCount = filteredStock.filter(s => s.qty <= 100).length;
  const outOfStockCount = filteredStock.filter(s => s.qty <= 0).length;
  const gstReturns = [
    { id: 1, type: 'GSTR-1', description: 'Outward Supplies', period: 'December 2024', dueDate: '11 Jan 2025', status: 'Pending', taxAmount: 198000 },
    { id: 2, type: 'GSTR-3B', description: 'Monthly Return', period: 'December 2024', dueDate: '20 Jan 2025', status: 'Pending', taxAmount: 117000 },
    { id: 3, type: 'GSTR-1', description: 'Outward Supplies', period: 'November 2024', dueDate: '11 Dec 2024', status: 'Filed', taxAmount: 175000 },
  ];
  const gstSalesRates = [
    { rate: '18%', taxable: 850000, tax: 153000 },
    { rate: '12%', taxable: 150000, tax: 18000 },
    { rate: '5%', taxable: 100000, tax: 5000 },
    { rate: '0%', taxable: 50000, tax: 0 },
  ];
  const gstPurchaseRates = [
    { rate: '18%', taxable: 350000, tax: 63000 },
    { rate: '12%', taxable: 80000, tax: 9600 },
    { rate: '5%', taxable: 50000, tax: 2500 },
    { rate: '0%', taxable: 30000, tax: 0 },
  ];
  const gstOutput = 198000;
  const gstInput = 81000;
  const gstNetLiability = gstOutput - gstInput;
  const gstPendingReturns = gstReturns.filter(r => r.status === 'Pending').length;
  const createLedger = async () => {
    if (!newLedgerName) return;
    setCreateStatus('Creating...');
    try {
      const res = await api.post('/tally/auto-ledger', { name: newLedgerName, type: newLedgerType });
      const { data } = res;
      const msg = data.message || (data.created ? '✓ Ledger created successfully' : 'Ledger already exists');
      setCreateStatus(data.warning ? `${msg} — ${data.warning}` : msg);
      if (data.created) {
        setNewLedgerName('');
        setTimeout(() => {
          fetchData();
          setCreateStatus('');
        }, 2000);
      }
    } catch (e) {
      let errorMsg = 'Failed to create ledger';
      if (e.code === 'ECONNABORTED' || (e.message && e.message.includes('timeout'))) {
        errorMsg = 'Request timed out - Tally may be slow or unresponsive';
      } else if (e.response?.status === 503) {
        errorMsg = 'Tally is not running. Please start Tally and try again.';
      } else if (e.response?.status === 504) {
        errorMsg = 'Tally took too long to respond. Please try again.';
      } else if (e.response?.data?.error) {
        errorMsg = e.response.data.error + (e.response.data.details ? ': ' + e.response.data.details : '');
      } else if (e.message) {
        errorMsg = e.message;
      }
      setCreateStatus(`✗ ${errorMsg}`);
      setTimeout(() => setCreateStatus(''), 5000);
    }
  };

  return (
    <div className="p-6 text-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-sm ${tallyStatus.connected === true ? 'bg-green-50 text-green-700' : tallyStatus.connected === false ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
            <div className={`w-2 h-2 rounded-full ${tallyStatus.connected === true ? 'bg-green-500 animate-pulse' : tallyStatus.connected === false ? 'bg-red-500' : 'bg-gray-400'}`}></div>
            <span>
              {tallyStatus.checking
                ? 'Checking Tally...'
                : tallyStatus.connected === true
                ? `Tally Connected (${tallyStatus.responseTime})`
                : tallyStatus.connected === false
                ? `Tally Disconnected: ${tallyStatus.error}`
                : 'Unknown Status'}
            </span>
            <button onClick={checkTallyHealth} disabled={tallyStatus.checking} className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50">Check</button>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">{companyName}</h1>
          <div className="text-xl text-gray-500">Overview of your business performance</div>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-3 border rounded text-lg text-gray-700">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
          </select>
          <button 
            onClick={fetchData}
            className="px-5 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-lg"
          >
            Refresh
          </button>
        </div>
      </div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-lg font-medium rounded-t ${activeTab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {loading && <div className="text-gray-600">Loading data from Tally...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Total Sales</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(0)}</div>
                  <div className="text-sm text-green-600 mt-1">↑ 12.5% from last month</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Total Purchases</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(0)}</div>
                  <div className="text-sm text-red-600 mt-1">↓ 8.2% from last month</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Cash in Hand</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(0)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Bank Balance</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(0)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Receivables</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(totalDebit)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Payables</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(totalCredit)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Gross Profit</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(0)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Net Profit</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(0)}</div>
                  <div className="text-sm text-green-600 mt-1">↑ 15.3% from last month</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-base font-medium text-gray-700 mb-3">Quick Actions</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="px-4 py-3 bg-white border rounded hover:bg-gray-50 text-base">New Sale</button>
                  <button className="px-4 py-3 bg-white border rounded hover:bg-gray-50 text-base">New Purchase</button>
                  <button className="px-4 py-3 bg-red-50 border border-red-200 rounded hover:bg-red-100 text-base">Payment</button>
                  <button className="px-4 py-3 bg-green-50 border border-green-200 rounded hover:bg-green-100 text-base">Receipt</button>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Ledger</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Group</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ledgerRows.slice(0, 8).map((r, i) => (
                      <tr key={i}>
                        <td className="px-6 py-3 text-base text-gray-900">{r.name}</td>
                        <td className="px-6 py-3 text-base text-gray-600">{r.parent}</td>
                        <td className={`px-6 py-3 text-base text-right ${r.type === 'Cr' ? 'text-green-600' : 'text-red-600'}`}>{formatINR(Math.abs(r.amount))}</td>
                        <td className="px-6 py-3 text-base">{r.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-base text-gray-500">Total Debit Balances</div>
                    <div className="mt-2 text-2xl font-semibold text-red-600">{formatINR(totalDebit)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-base text-gray-500">Total Credit Balances</div>
                    <div className="mt-2 text-2xl font-semibold text-green-600">{formatINR(totalCredit)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-base text-gray-500">Total Ledgers</div>
                    <div className="mt-2 text-2xl font-semibold text-gray-800">{ledgers.length}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-base font-medium text-gray-700">Recent Vouchers</div>
                  <button className="text-sm text-blue-600 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded hover:bg-gray-50">
                    <div>
                      <div className="text-base font-semibold text-gray-800">SAL/001 <span className="text-gray-500 font-normal">Sales</span></div>
                      <div className="text-sm text-gray-500">Sharma Traders</div>
                    </div>
                    <div className="text-base text-gray-800">+{formatINR(118000)}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded hover:bg-gray-50">
                    <div>
                      <div className="text-base font-semibold text-gray-800">PUR/001 <span className="text-gray-500 font-normal">Purchase</span></div>
                      <div className="text-sm text-gray-500">Mumbai Suppliers</div>
                    </div>
                    <div className="text-base text-red-600">-{formatINR(59000)}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded hover:bg-gray-50">
                    <div>
                      <div className="text-base font-semibold text-gray-800">PMT/001 <span className="text-gray-500 font-normal">Payment</span></div>
                      <div className="text-sm text-gray-500">Office rent</div>
                    </div>
                    <div className="text-base text-red-600">-{formatINR(30000)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'ledgers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Ledgers</h2>
                  <div className="text-base text-gray-500">Manage all your account ledgers</div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    value={newLedgerName}
                    onChange={(e) => setNewLedgerName(e.target.value)}
                    placeholder="Customer name"
                    className="px-3 py-2 border rounded text-base"
                  />
                  <select
                    value={newLedgerType}
                    onChange={(e) => setNewLedgerType(e.target.value)}
                    className="px-3 py-2 border rounded text-base"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                  <button type="button" onClick={createLedger} disabled={!newLedgerName.trim()} className={`px-3 py-2 rounded text-base ${!newLedgerName.trim() ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>Create</button>
                  <span className="text-base text-gray-600">{createStatus}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search ledgers..."
                    className="flex-1 min-w-[200px] px-3 py-2 border rounded text-base"
                  />
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="px-3 py-2 border rounded text-base"
                  >
                    <option>All Groups</option>
                    {groups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <button className="px-3 py-2 border rounded text-base text-gray-700">More Filters</button>
                  <button onClick={exportCSV} className="px-3 py-2 border rounded text-base text-gray-700">Export</button>
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Ledger Name</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLedgerRows.length > 0 ? (
                        filteredLedgerRows.map((r, i) => (
                          <tr key={i}>
                            <td className="px-6 py-3 text-base text-gray-900">{r.name}</td>
                            <td className="px-6 py-3 text-base text-gray-600">{r.parent}</td>
                            <td className={`px-6 py-3 text-base text-right ${r.type === 'Cr' ? 'text-green-600' : 'text-red-600'}`}>{formatINR(Math.abs(r.amount))}</td>
                            <td className={`px-6 py-3 text-base text-right ${r.type === 'Cr' ? 'text-green-600' : 'text-red-600'}`}>{formatINR(Math.abs(r.amount))}</td>
                            <td className="px-6 py-3 text-base">{r.type}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-base text-gray-500 text-center">
                            No ledgers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'vouchers' && (
            <div className="space-y-4">
              {voucherView === 'list' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">Vouchers</h2>
                      <div className="text-base text-gray-500">Manage all accounting vouchers</div>
                    </div>
                    <button onClick={() => setVoucherView('create')} className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-base">+ New Voucher</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {voucherTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => setVoucherFilterType(t)}
                        className={`px-3 py-2 rounded text-base ${voucherFilterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                      <input
                        value={voucherSearch}
                        onChange={(e) => setVoucherSearch(e.target.value)}
                        placeholder="Search by voucher no, party, narration..."
                        className="flex-1 min-w-[200px] px-3 py-2 border rounded text-base"
                      />
                      <input
                        type="date"
                        value={voucherDateFrom}
                        onChange={(e) => setVoucherDateFrom(e.target.value)}
                        className="px-3 py-2 border rounded text-base"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={voucherDateTo}
                        onChange={(e) => setVoucherDateTo(e.target.value)}
                        className="px-3 py-2 border rounded text-base"
                      />
                      <button
                        onClick={() => {
                          const rows = [['Date','Voucher No.','Type','Party','Amount']];
                          filteredVouchers.forEach(v => rows.push([v.date, v.no, v.type, v.party, v.amount]));
                          const csv = rows.map(row => row.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'vouchers.csv';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3 py-2 border rounded text-base text-gray-700"
                      >
                        Export
                      </button>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-lg border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Voucher No.</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Party / Particulars</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredVouchers.map((v, i) => (
                            <tr key={i}>
                              <td className="px-6 py-3 text-base text-gray-900">{new Date(v.date).toLocaleDateString('en-GB')}</td>
                              <td className="px-6 py-3 text-base text-blue-600">{v.no}</td>
                              <td className="px-6 py-3 text-base text-gray-700">{v.type}</td>
                              <td className="px-6 py-3 text-base text-gray-700">{v.party}</td>
                              <td className={`px-6 py-3 text-base text-right ${v.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatINR(Math.abs(v.amount))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {voucherView === 'create' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800">{voucherType} Voucher</h2>
                      <div className="text-base text-gray-500">Create a new {voucherType.toLowerCase()} entry</div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setVoucherView('list')} className="px-3 py-2 border rounded text-base text-gray-700">Cancel</button>
                      <button onClick={saveVoucher} className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-base">Save Voucher</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-700 mb-1">Voucher Number</div>
                        <input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className="w-full px-3 py-2 border rounded text-base" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-700 mb-1">Date</div>
                        <input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className="w-full px-3 py-2 border rounded text-base" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-700 mb-1">Reference Number</div>
                        <input value={voucherRef} onChange={(e) => setVoucherRef(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border rounded text-base" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-base font-medium text-gray-700">Entries</div>
                      <button onClick={addVoucherLine} className="text-base text-blue-600">+ Add Line</button>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Ledger Account</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {voucherLines.map((line, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-3">
                                <select
                                  value={line.ledger}
                                  onChange={(e) => updateVoucherLine(idx, 'ledger', e.target.value)}
                                  className="w-full px-3 py-2 border rounded text-base"
                                >
                                  <option value="">Select Ledger</option>
                                  {ledgerRows.map(l => (
                                    <option key={l.name} value={l.name}>{l.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-3">
                                <input
                                  value={line.debit}
                                  onChange={(e) => updateVoucherLine(idx, 'debit', e.target.value)}
                                  className="w-full px-3 py-2 border rounded text-base text-right"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-6 py-3">
                                <input
                                  value={line.credit}
                                  onChange={(e) => updateVoucherLine(idx, 'credit', e.target.value)}
                                  className="w-full px-3 py-2 border rounded text-base text-right"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-6 py-3">
                                <button onClick={() => removeVoucherLine(idx)} className="px-3 py-2 border rounded text-base text-gray-700">🗑</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td className="px-6 py-3 text-right text-base text-gray-700">Total</td>
                            <td className="px-6 py-3 text-right text-base text-red-600">{formatINR(voucherTotals.debit)}</td>
                            <td className="px-6 py-3 text-right text-base text-green-600">{formatINR(voucherTotals.credit)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <div className="text-base text-gray-700">
                      <span className="mr-2">Difference:</span>
                      <span className={voucherDiff > 0 ? 'text-red-600' : voucherDiff < 0 ? 'text-green-600' : 'text-gray-800'}>
                        {formatINR(Math.abs(voucherDiff))}
                      </span>
                      <span className="ml-2">{voucherDiff > 0 ? '(Debit needed)' : voucherDiff < 0 ? '(Credit needed)' : '(Balanced)'}</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 mb-1">Narration</div>
                      <textarea rows="3" className="w-full px-3 py-2 border rounded text-base" placeholder="Enter narration"></textarea>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'parties' && (
            <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">No parties loaded.</div>
          )}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Inventory</h2>
                  <div className="text-base text-gray-500">Manage stock items and inventory</div>
                </div>
                <button className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-base">+ Add Stock Item</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Total Items</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{filteredStock.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Stock Value</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(stockValueTotal)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Low Stock Items</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{lowStockCount}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Out of Stock</div>
                  <div className="mt-2 text-2xl font-semibold text-red-600">{outOfStockCount}</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <input
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Search stock items..."
                  className="w-full px-3 py-2 border rounded text-base"
                />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredStock.map((s, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">{s.name}</div>
                          <div className="text-sm text-gray-600">{s.cat}</div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{s.unit}</div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600">Quantity</div>
                          <div className="mt-1 text-gray-900">{s.qty} <span className="text-red-600">({s.qtyDelta > 0 ? '+' : ''}{s.qtyDelta})</span></div>
                        </div>
                        <div>
                          <div className="text-gray-600">Rate</div>
                          <div className="mt-1 text-gray-900">₹{s.rate} <span className={`${s.rateDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>({s.rateDelta >= 0 ? '+' : ''}{s.rateDelta}%)</span></div>
                        </div>
                      </div>
                      <div className="mt-3 border-t pt-3 text-sm">
                        <div className="text-gray-600">Stock Value</div>
                        <div className="mt-1 text-lg font-semibold text-gray-800">{formatINR(s.qty * s.rate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Reports</h2>
                  <div className="text-base text-gray-500">Generate and view financial reports</div>
                  <div className="mt-4 flex gap-6">
                    <button
                      onClick={() => setReportsTab('All Reports')}
                      className={`text-base pb-2 border-b-2 ${
                        reportsTab === 'All Reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                      }`}
                    >
                      All Reports
                    </button>
                    <button
                      onClick={() => setReportsTab('Day Book')}
                      className={`text-base pb-2 border-b-2 ${
                        reportsTab === 'Day Book' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                      }`}
                    >
                      Day Book
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={reportsPeriod}
                    onChange={(e) => setReportsPeriod(e.target.value)}
                    className="px-3 py-2 border rounded text-sm text-gray-700"
                  >
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>This Quarter</option>
                    <option>This Year</option>
                  </select>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-base">Export All</button>
                </div>
              </div>
              {reportsTab === 'All Reports' && (
                <div className="space-y-8">
                  <div>
                    <div className="text-xl font-semibold text-gray-800 mb-4">Accounting Reports</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { title: 'Day Book', subtitle: 'Daily transaction summary', icon: '📄' },
                        { title: 'Trial Balance', subtitle: 'Account balances verification', icon: '📊' },
                        { title: 'Profit & Loss', subtitle: 'Income and expense statement', icon: '📈' },
                        { title: 'Balance Sheet', subtitle: 'Assets and liabilities', icon: '🗂' },
                      ].map((item) => (
                        <button key={item.title} className="text-left bg-white rounded-lg shadow p-4 border hover:border-sky-200 transition">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xl">{item.icon}</div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">›</div>
                          </div>
                          <div className="mt-4 text-lg font-semibold text-gray-800">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-800 mb-4">Party Reports</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { title: 'Sundry Debtors', subtitle: 'Amounts receivable', icon: '📄' },
                        { title: 'Sundry Creditors', subtitle: 'Amounts payable', icon: '📄' },
                        { title: 'Party Ledger', subtitle: 'Individual party transactions', icon: '📊' },
                        { title: 'Ageing Analysis', subtitle: 'Outstanding dues by age', icon: '🕒' },
                      ].map((item) => (
                        <button key={item.title} className="text-left bg-white rounded-lg shadow p-4 border hover:border-sky-200 transition">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xl">{item.icon}</div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">›</div>
                          </div>
                          <div className="mt-4 text-lg font-semibold text-gray-800">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-800 mb-4">GST Reports</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { title: 'GSTR-1', subtitle: 'Outward supplies', icon: '📄' },
                        { title: 'GSTR-2', subtitle: 'Inward supplies', icon: '📄' },
                        { title: 'GSTR-3B', subtitle: 'Monthly return summary', icon: '📊' },
                        { title: 'GST Reconciliation', subtitle: 'Input credit matching', icon: '🕒' },
                      ].map((item) => (
                        <button key={item.title} className="text-left bg-white rounded-lg shadow p-4 border hover:border-sky-200 transition">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xl">{item.icon}</div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">›</div>
                          </div>
                          <div className="mt-4 text-lg font-semibold text-gray-800">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-gray-800 mb-4">Inventory Reports</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { title: 'Stock Summary', subtitle: 'Current stock levels', icon: '📄' },
                        { title: 'Stock Movement', subtitle: 'In/out transactions', icon: '📈' },
                        { title: 'Stock Valuation', subtitle: 'Inventory value report', icon: '📊' },
                        { title: 'Reorder Level', subtitle: 'Low stock alerts', icon: '🕒' },
                      ].map((item) => (
                        <button key={item.title} className="text-left bg-white rounded-lg shadow p-4 border hover:border-sky-200 transition">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center text-xl">{item.icon}</div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">›</div>
                          </div>
                          <div className="mt-4 text-lg font-semibold text-gray-800">{item.title}</div>
                          <div className="text-sm text-gray-500">{item.subtitle}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {reportsTab === 'Day Book' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base font-medium text-gray-700 mb-3">Day Book</div>
                  <div className="overflow-hidden rounded-lg border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Voucher</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Particulars</th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[
                          { date: '2024-12-01', no: 'SAL/101', party: 'Sharma Traders', amount: 118000 },
                          { date: '2024-12-02', no: 'PUR/091', party: 'Mumbai Suppliers', amount: -59000 },
                          { date: '2024-12-03', no: 'PMT/021', party: 'Office Rent', amount: -30000 },
                        ].map((v, i) => (
                          <tr key={i}>
                            <td className="px-6 py-3 text-base text-gray-900">{new Date(v.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-6 py-3 text-base text-blue-600">{v.no}</td>
                            <td className="px-6 py-3 text-base text-gray-700">{v.party}</td>
                            <td className={`px-6 py-3 text-base text-right ${v.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatINR(Math.abs(v.amount))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'gst' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">GST Management</h2>
                  <div className="text-base text-gray-500">Track and manage your GST returns</div>
                </div>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-base">
                  File Return
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-xl">₹</div>
                  <div>
                    <div className="text-sm text-gray-500">Output GST</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-800">{formatINR(gstOutput)}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xl">₹</div>
                  <div>
                    <div className="text-sm text-gray-500">Input GST</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-800">{formatINR(gstInput)}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">₹</div>
                  <div>
                    <div className="text-sm text-gray-500">Net Liability</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-800">{formatINR(gstNetLiability)}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xl">⏱</div>
                  <div>
                    <div className="text-sm text-gray-500">Pending Returns</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-800">{gstPendingReturns}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                  <div>
                    <div className="text-base font-semibold text-gray-800">GST Returns</div>
                    <div className="text-sm text-gray-500">Overview of your GST filings</div>
                  </div>
                  <select
                    value={gstYear}
                    onChange={(e) => setGstYear(e.target.value)}
                    className="px-3 py-2 border rounded text-sm text-gray-700"
                  >
                    <option>FY 2024-25</option>
                    <option>FY 2023-24</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Return Type</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Period</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Tax Amount</th>
                        <th className="px-6 py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gstReturns.map(r => (
                        <tr key={r.id}>
                          <td className="px-6 py-4 text-base text-gray-800">
                            <div className="font-semibold">{r.type}</div>
                            <div className="text-sm text-gray-500">{r.description}</div>
                          </td>
                          <td className="px-6 py-4 text-base text-gray-700">{r.period}</td>
                          <td className="px-6 py-4 text-base text-gray-700">{r.dueDate}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                r.status === 'Filed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              <span className="mr-2 text-base">
                                {r.status === 'Filed' ? '✔' : '⏳'}
                              </span>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-base text-right text-gray-800">
                            {formatINR(r.taxAmount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                                📄
                              </button>
                              <button className="w-11 h-11 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                                ⬇
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-xl font-semibold text-gray-800 mb-4">Sales by GST Rate</div>
                  <div className="space-y-3">
                    {gstSalesRates.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between px-5 py-4 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-1.5 rounded-md bg-emerald-100 text-emerald-700 text-base font-semibold">
                            {r.rate}
                          </div>
                          <div>
                            <div className="text-base text-gray-500">Taxable Value</div>
                            <div className="mt-1 text-xl font-semibold text-gray-800">
                              {formatINR(r.taxable)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base text-gray-500">Tax</div>
                          <div className="mt-1 text-xl font-semibold text-gray-800">
                            {formatINR(r.tax)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-xl font-semibold text-gray-800 mb-4">Purchases by GST Rate</div>
                  <div className="space-y-3">
                    {gstPurchaseRates.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between px-5 py-4 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className="px-4 py-1.5 rounded-md bg-emerald-100 text-emerald-700 text-base font-semibold">
                            {r.rate}
                          </div>
                          <div>
                            <div className="text-base text-gray-500">Taxable Value</div>
                            <div className="mt-1 text-xl font-semibold text-gray-800">
                              {formatINR(r.taxable)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base text-gray-500">Tax</div>
                          <div className="mt-1 text-xl font-semibold text-gray-800">
                            {formatINR(r.tax)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'parties' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Parties</h2>
                  <div className="text-base text-gray-500">Manage your customers and suppliers</div>
                </div>
                <button className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-base">+ Add Party</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Total Parties</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{partyRows.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Total Receivables</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-800">{formatINR(partiesTotalReceivable)}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-base text-gray-500">Total Payables</div>
                  <div className="mt-2 text-2xl font-semibold text-red-600">{formatINR(partiesTotalPayable)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['All','Debtors','Creditors'].map(t => (
                  <button
                    key={t}
                    onClick={() => setPartyFilter(t)}
                    className={`px-3 py-2 rounded text-base ${partyFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {t === 'All' ? 'All Parties' : t}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <input
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  placeholder="Search parties..."
                  className="w-full px-3 py-2 border rounded text-base"
                />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredPartyRows.map((p, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">{p.name}</div>
                          <div className="text-sm text-gray-600">{p.group}</div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{p.role}</div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>+91 98765 43210</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{p.role === 'Customer' ? 'customer@example.com' : 'supplier@example.com'}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-between items-center border-t pt-3">
                        <div className="text-sm text-gray-600">{p.role === 'Customer' ? 'Receivable' : 'Payable'}</div>
                        <div className={`text-lg font-semibold ${p.role === 'Customer' ? 'text-gray-800' : 'text-red-600'}`}>
                          {formatINR(p.role === 'Customer' ? p.receivable : p.payable)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-50 rounded border text-sm text-gray-600">
        <p><strong>Debug Info:</strong></p>
        <pre className="mt-2 overflow-x-auto">
          {JSON.stringify({ companies, ledgers }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
