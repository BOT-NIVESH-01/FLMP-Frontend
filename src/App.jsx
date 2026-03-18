import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Loader } from 'lucide-react';

// --- Modular Imports ---
import { API_URL } from './config';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';
import { ToastContainer } from './components/common/ToastContainer';
import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (showLoader) setIsLoading(true);

    try {
      const config = { headers: { 'x-auth-token': token } };

      const [leavesRes, timetableRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/data/leaves`, config),
        axios.get(`${API_URL}/data/timetable`, config),
        axios.get(`${API_URL}/data/users`, config)
      ]);

      setLeaves(leavesRes.data);
      setTimetable(timetableRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
      if (err.response && err.response.status === 404) {
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } })
        .then(res => {
          setCurrentUser(res.data);
        })
        .catch(() => localStorage.removeItem('token'));
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData(true);
    }
  }, [currentUser, fetchDashboardData]);

  const handleLoginSuccess = (user) => {
    setIsLoading(true);
    setCurrentUser(user);
    fetchDashboardData(true);
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRequestLeave = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.post(`${API_URL}/data/leaves`, formData, config);

      await fetchDashboardData();
      addToast("Leave request submitted successfully.", "success");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to submit leave request.";
      addToast(errorMsg, "error");
    }
  };

  const handleAcceptSubRequest = async (leaveId, slot, isAccepted) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.patch(`${API_URL}/data/leaves/${leaveId}/substitute`,
        { slot, status: isAccepted ? 'Accepted' : 'Rejected' },
        config
      );

      await fetchDashboardData(false);
      addToast(isAccepted ? "Substitution accepted." : "Substitution declined.", isAccepted ? "success" : "info");
    } catch (err) {
      addToast("Error processing request.", "error");
    }
  };

  const handleForceAssign = async (leaveId, slot, subId, subName) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.patch(`${API_URL}/data/leaves/${leaveId}/force-substitute`,
        { slot, subId, subName },
        config
      );

      await fetchDashboardData(false);
      addToast("Substitute force assigned successfully.", "success");
    } catch (err) {
      addToast("Error force assigning substitute.", "error");
    }
  };

  const handleApproveLeave = async (leaveId, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.patch(`${API_URL}/data/leaves/${leaveId}/status`, { status }, config);

      await fetchDashboardData(false);
      addToast(`Leave request ${status.toLowerCase()}.`, status === 'Approved' ? "success" : "info");
    } catch (err) {
      addToast("Error updating status.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setLeaves([]);
    setTimetable([]);
  };

  return (
    <ThemeProvider>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {currentUser ? (
        isLoading ? (
          <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-[#F4F7FB] via-white to-[#F4F7FB] font-sans">
            <div className="text-center glass-card shadow-soft p-10 rounded-3xl">
              <div className="mb-4 text-[#0A4D9C] flex justify-center">
                <Loader size={48} className="animate-spin" />
              </div>
              <p className="text-[#1A1A1A] font-bold text-lg">Initializing Dashboard...</p>
              <p className="text-[#666666] text-sm mt-1">Loading your data</p>
            </div>
          </div>
        ) : (
          <Dashboard
            user={currentUser}
            allUsers={users}
            leaves={leaves}
            timetable={timetable}
            onLogout={handleLogout}
            onRequestLeave={handleRequestLeave}
            onApproveLeave={handleApproveLeave}
            onAcceptSubRequest={handleAcceptSubRequest}
            onForceAssign={handleForceAssign}
            addToast={addToast}
            refreshData={fetchDashboardData}
          />
        )
      ) : (
        <Login onLogin={handleLoginSuccess} addToast={addToast} />
      )}
    </ThemeProvider>
  );
};

export default App;