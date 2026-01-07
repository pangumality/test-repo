import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../../components/Modal';

export default function Hostel() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'MIXED',
    address: '',
    warden: '',
    capacity: 0
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      const { data } = await api.get('/hostels');
      setHostels(data);
    } catch (error) {
      console.error('Failed to fetch hostels', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/hostels', formData);
      setIsCreateModalOpen(false);
      setFormData({ name: '', type: 'MIXED', address: '', warden: '', capacity: 0 });
      fetchHostels();
    } catch (error) {
      alert('Failed to create hostel');
    }
  };

  if (selectedHostel) {
    return (
      <HostelDetails 
        hostelId={selectedHostel.id} 
        onBack={() => setSelectedHostel(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Hostels</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          + Add Hostel
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel) => (
            <div 
              key={hostel.id} 
              onClick={() => setSelectedHostel(hostel)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{hostel.name}</h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                    hostel.type === 'BOYS' ? 'bg-blue-100 text-blue-700' :
                    hostel.type === 'GIRLS' ? 'bg-pink-100 text-pink-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {hostel.type}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-semibold text-gray-700">{hostel.capacity}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                 {hostel.address && <p>📍 {hostel.address}</p>}
                 {hostel.warden && <p>👤 Warden: {hostel.warden}</p>}
                 <p>🛏️ Rooms: {hostel._count?.rooms || 0}</p>
              </div>
            </div>
          ))}
          
          {hostels.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No hostels found. Create one to get started.
            </div>
          )}
        </div>
      )}

      <Modal open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add New Hostel">
        <form onSubmit={handleCreateHostel} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="MIXED">Mixed</option>
              <option value="BOYS">Boys</option>
              <option value="GIRLS">Girls</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Warden Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
              value={formData.warden}
              onChange={(e) => setFormData({...formData, warden: e.target.value})}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Create Hostel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function HostelDetails({ hostelId, onBack }) {
    const [hostel, setHostel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [isAllocating, setIsAllocating] = useState(null); // roomId
    
    // Room Form
    const [roomData, setRoomData] = useState({
        roomNumber: '',
        floor: '',
        capacity: 4,
        type: 'Non-AC'
    });

    // Allocation Form
    const [allocData, setAllocData] = useState({
        studentId: '',
        startDate: new Date().toISOString().split('T')[0]
    });
    const [students, setStudents] = useState([]); // For dropdown

    useEffect(() => {
        fetchHostelDetails();
        fetchStudents();
    }, [hostelId]);

    const fetchHostelDetails = async () => {
        try {
            const { data } = await api.get(`/hostels/${hostelId}`);
            setHostel(data);
        } catch (error) {
            console.error('Failed to fetch hostel details');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const { data } = await api.get('/students');
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch students');
        }
    };

    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/hostels/${hostelId}/rooms`, roomData);
            setIsAddRoomOpen(false);
            setRoomData({ roomNumber: '', floor: '', capacity: 4, type: 'Non-AC' });
            fetchHostelDetails();
        } catch (error) {
            alert('Failed to add room');
        }
    };

    const handleAllocate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/hostels/allocations', {
                roomId: isAllocating,
                studentId: allocData.studentId,
                startDate: allocData.startDate
            });
            setIsAllocating(null);
            setAllocData({ studentId: '', startDate: new Date().toISOString().split('T')[0] });
            fetchHostelDetails();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to allocate student');
        }
    };

    const handleVacate = async (allocationId) => {
        if (!confirm('Are you sure you want to vacate this student?')) return;
        try {
            await api.put(`/hostels/allocations/${allocationId}/vacate`);
            fetchHostelDetails();
        } catch (error) {
            alert('Failed to vacate');
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if(!confirm('Are you sure? This will delete the room.')) return;
        try {
            await api.delete(`/hostels/rooms/${roomId}`);
            fetchHostelDetails();
        } catch (error) {
            alert('Failed to delete room');
        }
    }

    if (loading) return <div>Loading...</div>;
    if (!hostel) return <div>Hostel not found</div>;

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-indigo-600 hover:text-indigo-800 mb-4">
                &larr; Back to Hostels
            </button>
            
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{hostel.name}</h2>
                    <p className="text-gray-500">{hostel.type} • {hostel.address}</p>
                </div>
                <button
                    onClick={() => setIsAddRoomOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    + Add Room
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostel.rooms.map(room => (
                    <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Room {room.roomNumber}</h3>
                            <div className="flex space-x-2">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {room.allocations.length}/{room.capacity}
                                </span>
                                <button onClick={() => handleDeleteRoom(room.id)} className="text-red-500 hover:text-red-700 text-xs">
                                    Delete
                                </button>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                            <p>Floor: {room.floor || 'G'}</p>
                            <p>Type: {room.type}</p>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase">Occupants</h4>
                            {room.allocations.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Empty</p>
                            ) : (
                                <ul className="space-y-2">
                                    {room.allocations.map(alloc => (
                                        <li key={alloc.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                            <span>{alloc.student.user.firstName} {alloc.student.user.lastName}</span>
                                            <button 
                                                onClick={() => handleVacate(alloc.id)}
                                                className="text-red-500 text-xs hover:underline"
                                            >
                                                Vacate
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {room.allocations.length < room.capacity && (
                            <button
                                onClick={() => setIsAllocating(room.id)}
                                className="w-full py-2 border border-dashed border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm"
                            >
                                + Allocate Student
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Room Modal */}
            <Modal open={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} title="Add Room">
                <form onSubmit={handleAddRoom} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Room Number</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={roomData.roomNumber}
                            onChange={(e) => setRoomData({...roomData, roomNumber: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Floor</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={roomData.floor}
                            onChange={(e) => setRoomData({...roomData, floor: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Capacity</label>
                        <input
                            type="number"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={roomData.capacity}
                            onChange={(e) => setRoomData({...roomData, capacity: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <input
                            type="text"
                            placeholder="e.g. AC, Non-AC"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={roomData.type}
                            onChange={(e) => setRoomData({...roomData, type: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">Add Room</button>
                    </div>
                </form>
            </Modal>

            {/* Allocate Student Modal */}
            <Modal open={!!isAllocating} onClose={() => setIsAllocating(null)} title="Allocate Student">
                <form onSubmit={handleAllocate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Student</label>
                        <select
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={allocData.studentId}
                            onChange={(e) => setAllocData({...allocData, studentId: e.target.value})}
                        >
                            <option value="">Select Student</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            value={allocData.startDate}
                            onChange={(e) => setAllocData({...allocData, startDate: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">Allocate</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
