import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Award, FileText, Download, Plus, Search } from 'lucide-react';
import api from '../../utils/api';

const Certificates = () => {
  const { currentUser } = useOutletContext();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Admin only
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    type: 'progress_card',
    remarks: ''
  });

  const canManage = ['admin', 'school_admin'].includes(currentUser?.role);

  const CERT_TYPES = [
    { value: 'TC', label: 'Transfer Certificate (TC)' },
    { value: 'PROGRESS_CARD', label: 'Progress Card' },
    { value: 'MEDICAL', label: 'Medical Certificate' },
    { value: 'MIGRATION', label: 'Migration Certificate' },
    { value: 'REPORT_CARD', label: 'Report Card' }
  ];

  useEffect(() => {
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchStudents();
    }
  }, [canManage]);

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/certificates');
      setCertificates(response.data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await api.post('/certificates', {
        ...formData,
        metadata: { remarks: formData.remarks }
      });
      setShowIssueModal(false);
      fetchCertificates();
      alert('Certificate issued successfully!');
    } catch (error) {
      alert('Failed to issue certificate');
    }
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.firstName?.toLowerCase().includes(term) ||
      s.lastName?.toLowerCase().includes(term) ||
      s.rollNumber?.toLowerCase().includes(term) ||
      s.className?.toLowerCase().includes(term) ||
      s.section?.toLowerCase().includes(term)
    );
  });

  const getCertificateColor = (type) => {
    const colors = {
      TC: 'bg-red-50 text-red-700 border-red-200',
      PROGRESS_CARD: 'bg-blue-50 text-blue-700 border-blue-200',
      MEDICAL: 'bg-green-50 text-green-700 border-green-200',
      MIGRATION: 'bg-purple-50 text-purple-700 border-purple-200',
      REPORT_CARD: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleDownloadPdf = async (certificateId) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download certificate PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Certificates & Documents</h1>
          <p className="text-gray-500">Access and manage official school documents</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus size={20} /> Issue Certificate
          </button>
        )}
      </div>

      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Issue New Certificate</h2>
            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Certificate Type</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full border rounded-lg p-2"
                >
                  {CERT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Student</label>

                <div className="mb-3">
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">Select student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                        {s.className ? ` - ${s.className}${s.section ? ` (${s.section})` : ''}` : ''}
                        {s.rollNumber ? ` [${s.rollNumber}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded-lg p-2 pl-8 mb-2"
                  />
                  <Search size={16} className="absolute top-3 left-2.5 text-gray-400" />
                </div>
                <select
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  size={5}
                >
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim()}
                      {s.className ? ` - ${s.className}${s.section ? ` (${s.section})` : ''}` : ''}
                      {s.rollNumber ? ` [${s.rollNumber}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Remarks / Details</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                  className="w-full border rounded-lg p-2"
                  rows={3}
                  placeholder="Additional details to appear on certificate..."
                />
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Issue Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map(cert => (
          <div key={cert.id} className="bg-white rounded-xl shadow-sm border p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-lg border-b border-l ${getCertificateColor(cert.type)}`}>
              {cert.type.replace(/_/g, ' ').toUpperCase()}
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Award size={32} className="text-teal-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {CERT_TYPES.find(t => t.value === cert.type)?.label || cert.type}
                </h3>
                <p className="text-sm text-gray-500">Ref: {cert.referenceNumber}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-6">
              <div className="flex justify-between">
                <span>Issued To:</span>
                <span className="font-medium text-gray-900">
                  {cert.student?.user?.firstName} {cert.student?.user?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="font-medium">
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </span>
              </div>
              {cert.metadata?.remarks && (
                <div className="pt-2 border-t mt-2">
                  <span className="block text-xs text-gray-400 mb-1">Remarks:</span>
                  <p className="italic">{cert.metadata.remarks}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => handleDownloadPdf(cert.id)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <Download size={18} /> Download PDF
            </button>
          </div>
        ))}

        {certificates.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No certificates issued yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificates;
