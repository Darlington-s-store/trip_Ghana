import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TripPlanner() {
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'GHS',
    notes: '',
  });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchUserTrips();
  }, []);

  const fetchUserTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/trips', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setAlert({ show: true, message: 'Error loading trips', type: 'error' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const createTrip = async (e) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setAlert({ show: true, message: 'End date must be after start date', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/trips', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAlert({ show: true, message: 'Trip created successfully!', type: 'success' });
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        budget: '',
        currency: 'GHS',
        notes: '',
      });
      
      fetchUserTrips();
    } catch (error) {
      setAlert({ show: true, message: 'Error creating trip', type: 'error' });
    }
  };

  const submitTripForApproval = async (tripId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/trips/${tripId}/submit-approval`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAlert({ show: true, message: 'Trip submitted for approval', type: 'success' });
      fetchUserTrips();
    } catch (error) {
      setAlert({ show: true, message: 'Error submitting trip', type: 'error' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Alert */}
      {alert.show && (
        <div className={`mb-6 p-4 rounded-lg ${
          alert.type === 'error' 
            ? 'bg-red-100 text-red-800 border border-red-300' 
            : 'bg-green-100 text-green-800 border border-green-300'
        }`}>
          {alert.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Plan Your Ghana Trip</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Trip</h2>
              <form onSubmit={createTrip} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Accra Beach Getaway"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Amount"
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="GHS">GHS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details about your trip"
                    rows={4}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Trip
                </button>
              </form>
            </div>
          </div>

          {/* Trips List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Your Trips</h2>
              
              {trips.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No trips created yet.</p>
              ) : (
                <div className="space-y-4">
                  {trips.map(trip => (
                    <div
                      key={trip.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{trip.name}</h3>
                          <p className="text-gray-600 text-sm">
                            {trip.start_date} to {trip.end_date}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trip.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          trip.status === 'pending_approval' ? 'bg-blue-100 text-blue-800' :
                          trip.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {trip.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {trip.budget && (
                        <p className="text-gray-600 text-sm mb-3">
                          Budget: {trip.budget} {trip.currency}
                        </p>
                      )}

                      {trip.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm">
                          <p className="font-semibold text-red-800 mb-1">Rejection Reason:</p>
                          <p className="text-red-700">{trip.rejection_reason}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {trip.status === 'draft' && (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Edit
                            </button>
                            <button
                              onClick={() => submitTripForApproval(trip.id)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              Submit for Approval
                            </button>
                          </>
                        )}
                        {trip.status === 'approved' && (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Details & Book
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
