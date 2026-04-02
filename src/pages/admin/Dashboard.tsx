import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch settings
      const settingsRes = await axios.get('/api/admin/settings/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(settingsRes.data.data);

      // Fetch users
      const usersRes = await axios.get('/api/admin/settings/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersRes.data.data);

      // Fetch pending trips
      const tripsRes = await axios.get('/api/trips/admin/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(tripsRes.data.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAlert({ show: true, message: 'Error loading dashboard', type: 'error' });
      setLoading(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const token = localStorage.getItem('token');
      const newState = !maintenanceMode;

      await axios.post(
        '/api/admin/settings/maintenance-mode',
        {
          enabled: newState,
          message: newState ? 'We are undergoing scheduled maintenance.' : '',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMaintenanceMode(newState);
      setAlert({
        show: true,
        message: `Maintenance mode ${newState ? 'enabled' : 'disabled'}`,
        type: 'success',
      });
    } catch (error) {
      setAlert({ show: true, message: 'Error updating maintenance mode', type: 'error' });
    }
  };

  const sendSiteAlert = async () => {
    try {
      const token = localStorage.getItem('token');
      const alertMessage = prompt('Enter alert message:');
      
      if (!alertMessage) return;

      await axios.post(
        '/api/admin/settings/alerts/send',
        {
          title: 'System Alert',
          message: alertMessage,
          priority: 'info',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlert({ show: true, message: 'Alert sent to all users', type: 'success' });
    } catch (error) {
      setAlert({ show: true, message: 'Error sending alert', type: 'error' });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Alert Banner */}
      {alert.show && (
        <div className={`p-4 mb-4 ${alert.type === 'error' ? 'bg-red-100' : 'bg-green-100'}`}>
          {alert.message}
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="flex">
        <div className="w-64 bg-gray-900 text-white p-6 min-h-screen">
          <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
          <nav className="space-y-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left p-2 rounded ${
                activeTab === 'overview' ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full text-left p-2 rounded ${
                activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`w-full text-left p-2 rounded ${
                activeTab === 'trips' ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              Trip Approval
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left p-2 rounded ${
                activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              System Settings
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full text-left p-2 rounded ${
                activeTab === 'audit' ? 'bg-blue-600' : 'hover:bg-gray-800'
              }`}
            >
              Audit Logs
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Users</h3>
                  <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-semibold mb-2">Pending Trips</h3>
                  <p className="text-3xl font-bold">{trips.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-semibold mb-2">System Status</h3>
                  <p className="text-xl font-bold">{maintenanceMode ? 'Maintenance' : 'Online'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">User Management</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.first_name} {user.last_name}</td>
                        <td className="px-6 py-4 text-sm">{user.role}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button className="text-blue-600 hover:text-blue-800 mr-4">Edit</button>
                          <button className="text-red-600 hover:text-red-800">Suspend</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">System Settings</h2>
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Maintenance Mode</h3>
                    <p className="text-gray-600 text-sm">Toggle website maintenance status</p>
                  </div>
                  <button
                    onClick={toggleMaintenanceMode}
                    className={`px-4 py-2 rounded text-white ${
                      maintenanceMode ? 'bg-red-600' : 'bg-green-600'
                    }`}
                  >
                    {maintenanceMode ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <hr />

                <button
                  onClick={sendSiteAlert}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Send Site Alert
                </button>
              </div>
            </div>
          )}

          {activeTab === 'trips' && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Trip Approval Queue</h2>
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div key={trip.id} className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{trip.name}</h3>
                        <p className="text-gray-600 text-sm">By {trip.first_name} {trip.last_name}</p>
                        <p className="text-gray-600 text-sm">{trip.start_date} to {trip.end_date}</p>
                      </div>
                      <div className="space-x-2">
                        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                          Approve
                        </button>
                        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
