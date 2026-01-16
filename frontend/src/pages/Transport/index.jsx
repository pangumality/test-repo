import React, { useState, useEffect } from 'react';
import { Bus, User, Clock, CheckCircle2, XCircle, Plus } from 'lucide-react';
import api from '../../utils/api';

export default function Transport() {
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    schoolId: '',
    driverName: '',
    driverPhone: '',
    numberPlate: '',
    pickupTime: '07:00',
    arrivalTime: '08:00',
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await api.get('/schools');
        setSchools(res.data || []);
      } catch (e) {
        console.error('Failed to load schools for transport', e);
      } finally {
        setLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await api.get('/transport/buses');
        const list = res.data || [];
        const withNames = list.map((bus) => {
          const school = schools.find((s) => s.id === bus.schoolId);
          return {
            ...bus,
            schoolName: school?.name || 'Unassigned',
          };
        });
        setBuses(withNames);
      } catch (e) {
        console.error('Failed to load buses', e);
      }
    };
    fetchBuses();
  }, [schools]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    if (!formData.driverName.trim() || !formData.numberPlate.trim()) return;

    try {
      const res = await api.post('/transport/buses', {
        schoolId: formData.schoolId || undefined,
        driverName: formData.driverName.trim(),
        driverPhone: formData.driverPhone.trim() || undefined,
        numberPlate: formData.numberPlate.trim(),
        pickupTime: formData.pickupTime,
        arrivalTime: formData.arrivalTime,
      });

      const created = res.data;
      const school = schools.find((s) => s.id === created.schoolId) || null;
      setBuses((prev) => [
        {
          ...created,
          schoolName: school?.name || 'Unassigned',
        },
        ...prev,
      ]);

      setFormData((prev) => ({
        ...prev,
        driverName: '',
        driverPhone: '',
        numberPlate: '',
      }));
    } catch (e) {
      console.error('Failed to save bus', e);
      alert(e.response?.data?.error || 'Failed to save bus');
    }
  };

  const toggleBusStatus = async (id, field) => {
    try {
      const bus = buses.find((b) => b.id === id);
      if (!bus) return;

      const updated = await api.put(`/transport/buses/${id}`, {
        [field]: !bus[field],
      });

      setBuses((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                ...updated.data,
              }
            : b
        )
      );
    } catch (e) {
      console.error('Failed to update bus status', e);
      alert('Failed to update bus status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase flex items-center gap-2">
            <Bus className="text-indigo-600" />
            Transport
          </h2>
          <p className="text-gray-600">
            Assign bus drivers to schools and track pickup and arrival.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Add Bus Allocation
          </h3>
        </div>
        <form
          onSubmit={handleAddBus}
          className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School
            </label>
            <select
              name="schoolId"
              value={formData.schoolId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loadingSchools}
            >
              <option value="">
                {loadingSchools ? 'Loading schools...' : 'Select school (optional)'}
              </option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver name
            </label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <User size={16} className="text-gray-400" />
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="w-full text-sm outline-none"
                placeholder="e.g. John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver phone
            </label>
            <input
              type="tel"
              name="driverPhone"
              value={formData.driverPhone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. 0772 000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bus number plate
            </label>
            <input
              type="text"
              name="numberPlate"
              value={formData.numberPlate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. UBA 123X"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock size={14} className="text-gray-500" />
              Pickup time
            </label>
            <input
              type="time"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock size={14} className="text-gray-500" />
              Destination time
            </label>
            <input
              type="time"
              name="arrivalTime"
              value={formData.arrivalTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Save bus
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Bus allocations
        </h3>
        {buses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No buses added yet. Use the form above to add a bus for a school,
            with pickup and destination times.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">School</th>
                  <th className="py-2 pr-4">Driver</th>
                  <th className="py-2 pr-4">Bus plate</th>
                  <th className="py-2 pr-4">Pickup</th>
                  <th className="py-2 pr-4">Destination</th>
                  <th className="py-2 pr-4">Started off</th>
                  <th className="py-2 pr-4">Arrived at school</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr key={bus.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{bus.schoolName}</td>
                    <td className="py-2 pr-4">{bus.driverName}</td>
                    <td className="py-2 pr-4 font-mono">{bus.numberPlate}</td>
                    <td className="py-2 pr-4">{bus.pickupTime}</td>
                    <td className="py-2 pr-4">{bus.arrivalTime}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleBusStatus(bus.id, 'hasStarted')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          bus.hasStarted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {bus.hasStarted ? (
                          <>
                            <CheckCircle2 size={14} />
                            Started
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            Not started
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleBusStatus(bus.id, 'hasArrived')}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          bus.hasArrived
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {bus.hasArrived ? (
                          <>
                            <CheckCircle2 size={14} />
                            Arrived
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            On the way
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
