import React, { useState, useEffect } from 'react';
import { Book, Plus, Search, User, Calendar, CheckCircle, X, RotateCcw, Trash2, Pencil } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../../components/Modal';

const Library = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory | issued
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  
  // Form state
  const [editingBook, setEditingBook] = useState(null);
  const [bookFormData, setBookFormData] = useState({
    title: '', author: '', isbn: '', category: '', quantity: 1
  });
  const [issueFormData, setIssueFormData] = useState({
    bookId: '', studentId: '', dueDate: ''
  });

  useEffect(() => {
    fetchData();
    fetchStudents();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, issuedRes] = await Promise.all([
        api.get('/books'),
        api.get('/books/issued')
      ]);
      setBooks(booksRes.data);
      setIssuedBooks(issuedRes.data);
    } catch (error) {
      console.error('Failed to fetch library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  // --- Book Management ---

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await api.put(`/books/${editingBook.id}`, bookFormData);
      } else {
        await api.post('/books', bookFormData);
      }
      setIsBookModalOpen(false);
      setEditingBook(null);
      setBookFormData({ title: '', author: '', isbn: '', category: '', quantity: 1 });
      fetchData(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.delete(`/books/${id}`);
      setBooks(books.filter(b => b.id !== id));
    } catch (error) {
      alert('Failed to delete book');
    }
  };

  const openEditBook = (book) => {
    setEditingBook(book);
    setBookFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category: book.category || '',
      quantity: book.quantity
    });
    setIsBookModalOpen(true);
  };

  const openAddBook = () => {
    setEditingBook(null);
    setBookFormData({ title: '', author: '', isbn: '', category: '', quantity: 1 });
    setIsBookModalOpen(true);
  };

  // --- Issue/Return Management ---

  const openIssueModal = (book = null) => {
    setIssueFormData({
      bookId: book ? book.id : '',
      studentId: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default 7 days
    });
    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/books/issue', issueFormData);
      setIsIssueModalOpen(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to issue book');
    }
  };

  const handleReturn = async (issueId) => {
    if (!window.confirm('Confirm return of this book?')) return;
    try {
      await api.post('/books/return', { issueId });
      fetchData();
    } catch (error) {
      alert('Failed to return book');
    }
  };

  if (loading && books.length === 0) return <div className="p-8 text-center text-gray-500">Loading library...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Library Management</h1>
          <p className="text-gray-500">Manage books, issues, and returns</p>
        </div>
        <button
          onClick={openAddBook}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus size={20} /> Add Book
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          className={`pb-3 px-4 font-medium transition-colors relative ${
            activeTab === 'inventory' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          Books Inventory
          {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600"></div>}
        </button>
        <button
          className={`pb-3 px-4 font-medium transition-colors relative ${
            activeTab === 'issued' ? 'text-teal-600' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('issued')}
        >
          Issued Books
          {activeTab === 'issued' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-600"></div>}
        </button>
      </div>

      {/* Content */}
      <div
        className="rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        style={{ backgroundColor: 'var(--ui-surface)' }}
      >
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4">Title / Author</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">ISBN</th>
                  <th className="px-6 py-4 text-center">Availability</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{book.title}</div>
                      <div className="text-sm text-gray-500">{book.author}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{book.category || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">{book.isbn || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        book.available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {book.available} / {book.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => openIssueModal(book)}
                        disabled={book.available === 0}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Issue Book"
                      >
                        <User size={18} />
                      </button>
                      <button 
                        onClick={() => openEditBook(book)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {books.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No books found. Add some books to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'issued' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                <tr>
                  <th className="px-6 py-4">Book</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Issued On</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issuedBooks.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{issue.book.title}</div>
                      <div className="text-sm text-gray-500">{issue.book.author}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{issue.student.user.firstName} {issue.student.user.lastName}</div>
                      <div className="text-sm text-gray-500">{issue.student.klass?.name || 'No Class'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(issue.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(issue.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        Issued
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleReturn(issue.id)}
                        className="flex items-center gap-1 ml-auto px-3 py-1 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 text-sm font-medium transition-colors"
                      >
                        <RotateCcw size={14} /> Return
                      </button>
                    </td>
                  </tr>
                ))}
                {issuedBooks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No books currently issued.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Book Modal */}
      <Modal open={isBookModalOpen} onClose={() => setIsBookModalOpen(false)} title={editingBook ? 'Edit Book' : 'Add New Book'}>
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={bookFormData.title}
              onChange={e => setBookFormData({...bookFormData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={bookFormData.author}
              onChange={e => setBookFormData({...bookFormData, author: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={bookFormData.isbn}
                onChange={e => setBookFormData({...bookFormData, isbn: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={bookFormData.category}
                onChange={e => setBookFormData({...bookFormData, category: e.target.value})}
                placeholder="e.g. Science, Fiction"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={bookFormData.quantity}
              onChange={e => setBookFormData({...bookFormData, quantity: parseInt(e.target.value)})}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              {editingBook ? 'Update Book' : 'Add Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Issue Book Modal */}
      <Modal open={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Book">
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Book</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={issueFormData.bookId}
              onChange={e => setIssueFormData({...issueFormData, bookId: e.target.value})}
            >
              <option value="">-- Select Book --</option>
              {books.filter(b => b.available > 0).map(b => (
                <option key={b.id} value={b.id}>{b.title} (Available: {b.available})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={issueFormData.studentId}
              onChange={e => setIssueFormData({...issueFormData, studentId: e.target.value})}
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} {s.className ? `(${s.className})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={issueFormData.dueDate}
              onChange={e => setIssueFormData({...issueFormData, dueDate: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Issue Book
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Library;
