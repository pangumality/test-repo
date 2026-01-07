import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Plus, Trash2, MapPin } from 'lucide-react';
import api from '../../utils/api';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Sports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sports, setSports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isSportModalOpen, setIsSportModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Forms
  const [newSport, setNewSport] = useState({ name: '', category: 'Team' });
  const [newTeam, setNewTeam] = useState({ name: '', sportId: '' });
  const [newEvent, setNewEvent] = useState({ title: '', startDate: '', location: '', sportId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, tRes, eRes] = await Promise.all([
        api.get('/sports'),
        api.get('/sports/teams'),
        api.get('/sports/events')
      ]);
      setSports(sRes.data);
      setTeams(tRes.data);
      setEvents(eRes.data);
    } catch (error) {
      console.error('Failed to fetch sports data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSport = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sports', newSport);
      setIsSportModalOpen(false);
      fetchData();
    } catch (e) { alert('Failed to create sport'); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sports/teams', newTeam);
      setIsTeamModalOpen(false);
      fetchData();
    } catch (e) { alert('Failed to create team'); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sports/events', newEvent);
      setIsEventModalOpen(false);
      fetchData();
    } catch (e) { alert('Failed to create event'); }
  };

  const handleDeleteSport = async (id) => {
    if(!window.confirm('Delete this sport?')) return;
    try { await api.delete(`/sports/${id}`); fetchData(); } catch(e) { alert('Failed'); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 uppercase">Sports Management</h1>
          <p className="text-gray-600">Manage sports, teams, and events</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['overview', 'teams', 'events'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 capitalize font-medium ${
              activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Sports</h3>
                <button
                  onClick={() => setIsSportModalOpen(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> Add Sport
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sports.map(sport => (
                  <div key={sport.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold">{sport.name}</h4>
                        <span className="text-xs text-gray-500">{sport.category}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSport(sport.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Teams</h3>
                <button
                  onClick={() => setIsTeamModalOpen(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> Add Team
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800">{team.name}</h4>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{team.sport?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Users size={14} />
                      <span>{team._count?.players || 0} Players</span>
                    </div>
                    {team.coach && (
                      <div className="text-xs text-gray-500 mt-2">
                        Coach: {team.coach.firstName} {team.coach.lastName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Upcoming Events</h3>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> Add Event
                </button>
              </div>
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-gray-800">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(event.startDate).toLocaleDateString()}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        )}
                        {event.sport && (
                          <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">
                            {event.sport.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Sport Modal */}
      <Modal isOpen={isSportModalOpen} onClose={() => setIsSportModalOpen(false)} title="Add Sport">
        <form onSubmit={handleCreateSport} className="space-y-4">
          <input
            type="text"
            placeholder="Sport Name"
            className="w-full border p-2 rounded"
            required
            value={newSport.name}
            onChange={e => setNewSport({...newSport, name: e.target.value})}
          />
          <select
            className="w-full border p-2 rounded"
            value={newSport.category}
            onChange={e => setNewSport({...newSport, category: e.target.value})}
          >
            <option value="Team">Team Sport</option>
            <option value="Individual">Individual Sport</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Save</button>
        </form>
      </Modal>

      {/* Create Team Modal */}
      <Modal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} title="Add Team">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <input
            type="text"
            placeholder="Team Name (e.g. U-16 Boys)"
            className="w-full border p-2 rounded"
            required
            value={newTeam.name}
            onChange={e => setNewTeam({...newTeam, name: e.target.value})}
          />
          <select
            className="w-full border p-2 rounded"
            required
            value={newTeam.sportId}
            onChange={e => setNewTeam({...newTeam, sportId: e.target.value})}
          >
            <option value="">Select Sport</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Save</button>
        </form>
      </Modal>

      {/* Create Event Modal */}
      <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Add Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <input
            type="text"
            placeholder="Event Title"
            className="w-full border p-2 rounded"
            required
            value={newEvent.title}
            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
          />
          <input
            type="date"
            className="w-full border p-2 rounded"
            required
            value={newEvent.startDate}
            onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
          />
          <input
            type="text"
            placeholder="Location"
            className="w-full border p-2 rounded"
            value={newEvent.location}
            onChange={e => setNewEvent({...newEvent, location: e.target.value})}
          />
          <select
            className="w-full border p-2 rounded"
            value={newEvent.sportId}
            onChange={e => setNewEvent({...newEvent, sportId: e.target.value})}
          >
            <option value="">Select Sport (Optional)</option>
            {sports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Save</button>
        </form>
      </Modal>
    </div>
  );
};

export default Sports;
