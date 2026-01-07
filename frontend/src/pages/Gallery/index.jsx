import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, Image as ImageIcon, X, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import Modal from '../../components/Modal';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Group items by Title and Date
  const groupedItems = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      // Create a unique key based on title and date
      const dateStr = new Date(item.date).toDateString();
      const key = `${item.title}-${dateStr}`;
      
      if (!groups[key]) {
        groups[key] = {
          ...item,
          images: [],
          id: key // Virtual ID for the group
        };
      }
      groups[key].images.push(item);
    });
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [items]);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchGallery();
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  const fetchGallery = async () => {
    try {
      const { data } = await api.get('/gallery');
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch gallery', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0 && !formData.imageUrl) {
        alert('Please select files or enter an image URL');
        return;
    }

    try {
      setUploading(true);
      let uploadedUrls = [];

      // 1. Handle Multiple File Uploads
      if (files.length > 0) {
          const uploadData = new FormData();
          files.forEach(file => {
            uploadData.append('images', file);
          });
          
          const { data } = await api.post('/upload-multiple', uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedUrls = data.urls;
      } else if (formData.imageUrl) {
          uploadedUrls = [formData.imageUrl];
      }

      // 2. Create Gallery Items Batch
      const galleryItems = uploadedUrls.map(url => ({
        ...formData,
        imageUrl: url
      }));

      await api.post('/gallery/batch', { items: galleryItems });
      
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        category: '',
        date: new Date().toISOString().split('T')[0]
      });
      setFiles([]);
      fetchGallery();
    } catch (err) {
      console.error('Failed to add items', err);
      alert('Failed to add photos');
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await api.delete(`/gallery/${id}`);
      fetchGallery();
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete photo');
    }
  };

  const canManage = ['admin', 'staff', 'teacher'].includes(String(userRole || '').toLowerCase());

  console.log('Gallery Role Debug:', { userRole, canManage });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">School Gallery</h1>
          <p className="text-slate-500">Memories and events from our school</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            <Upload size={20} />
            Upload Photo
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 animate-pulse">Loading gallery...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
          <ImageIcon size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">No photos yet</h3>
          <p className="text-slate-400">Photos posted by the school will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedItems.map((group) => (
            <div key={group.id} className="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div 
                className="aspect-video bg-slate-100 relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <img 
                  src={group.imageUrl} 
                  alt={group.title}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { 
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = 'https://placehold.co/800x600?text=Image+Error'; 
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Photo Count Badge */}
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <ImageIcon size={12} />
                  {group.images.length}
                </div>

                <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <p className="font-medium text-sm">View all {group.images.length} photos</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 line-clamp-1 text-lg">{group.title}</h3>
                  {canManage && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete all images in the group
                        if (window.confirm(`Delete all ${group.images.length} photos in "${group.title}"?`)) {
                            group.images.forEach(img => handleDelete(img.id));
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                      title="Delete Event"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[2.5rem]">{group.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(group.date).toLocaleDateString()}
                  </span>
                  {group.category && (
                    <span className="px-2.5 py-1 bg-slate-100 rounded-full text-slate-600 font-medium border border-slate-200">
                      {group.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Photo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload Images</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative bg-slate-50 hover:bg-blue-50/50"
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input 
                type="file" 
                id="fileInput" 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={e => setFiles(Array.from(e.target.files))}
              />
              {files.length > 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 text-green-600 font-medium">
                   <ImageIcon size={20} />
                   <span>{files.length} file{files.length > 1 ? 's' : ''} selected</span>
                   <div className="text-xs text-slate-500 max-h-20 overflow-y-auto w-full text-center">
                     {files.map((f, i) => (
                       <div key={i}>{f.name}</div>
                     ))}
                   </div>
                </div>
              ) : (
                <div className="text-slate-500 flex flex-col items-center">
                  <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm mb-2">Click to upload photos</p>
                  <button 
                    type="button" 
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-md hover:bg-slate-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('fileInput').click();
                    }}
                  >
                    Select Files
                  </button>
                  <p className="text-xs text-slate-400 mt-2">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}
            </div>
            
            <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Or use URL</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <input
              type="url"
              value={formData.imageUrl}
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={files.length > 0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the event..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select...</option>
                <option value="Sports">Sports</option>
                <option value="Academic">Academic</option>
                <option value="Cultural">Cultural</option>
                <option value="Celebration">Celebration</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 font-medium"
            >
              Post Photo
            </button>
          </div>
        </form>
      </Modal>

      {/* Group View Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedGroup(null)}>
            <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedGroup.title}</h2>
                        <p className="text-slate-500">{selectedGroup.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(selectedGroup.date).toLocaleDateString()}
                            </span>
                            {selectedGroup.category && (
                                <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium border border-slate-200">
                                    {selectedGroup.category}
                                </span>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedGroup(null)}
                        className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedGroup.images.map((img) => (
                            <div 
                                key={img.id} 
                                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all"
                                onClick={() => setSelectedImage(img)}
                            >
                                <img 
                                    src={img.imageUrl} 
                                    alt={img.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src = 'https://placehold.co/800x600?text=Image+Error'; 
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                {canManage && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(img.id);
                                            // Update the group view by removing the deleted image
                                            const updatedImages = selectedGroup.images.filter(i => i.id !== img.id);
                                            if (updatedImages.length === 0) {
                                                setSelectedGroup(null); // Close if empty
                                            } else {
                                                setSelectedGroup({ ...selectedGroup, images: updatedImages });
                                            }
                                        }}
                                        className="absolute top-2 right-2 text-white/0 group-hover:text-white/100 bg-red-600/80 p-1.5 rounded-full hover:bg-red-600 transition-all"
                                        title="Delete Photo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Lightbox Modal (Single Image) */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full hover:bg-white/20">
            <X size={24} />
          </button>
          <div className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedImage.imageUrl} 
              alt={selectedImage.title}
              className="w-auto h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-6 text-white text-center max-w-2xl">
              <h2 className="text-2xl font-bold mb-2">{selectedImage.title}</h2>
              <p className="text-gray-300 text-lg">{selectedImage.description}</p>
              <div className="flex items-center justify-center gap-4 mt-4 text-gray-400 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(selectedImage.date).toLocaleDateString()}
                </span>
                {selectedImage.category && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-white/90">
                    {selectedImage.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
