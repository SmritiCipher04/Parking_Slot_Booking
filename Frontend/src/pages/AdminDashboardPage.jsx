import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import UserAvatar from '../components/UserAvatar';

const AdminDashboardPage = () => {
  const { admin, getAdminAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalLocations: 0,
    totalSubscriptions: 0,
    bookingRevenue: 0,
    subscriptionRevenue: 0,
    totalRevenue: 0
  });

  const [facilities, setFacilities] = useState([]);
  const [pendingLocations, setPendingLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [deletedLogs, setDeletedLogs] = useState([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);

  const [selectedLog, setSelectedLog] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const handleApprovePartnerLocation = async (locId) => {
    if (!window.confirm('Approve this partner parking location for live search results?')) return;
    try {
      const res = await fetch(`/api/admin/locations/${encodeURIComponent(locId)}/approve`, {
        method: 'PUT',
        headers: getAdminAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      } else {
        alert(data.message || 'Error approving location.');
      }
    } catch (err) {
      alert('Error connecting to backend.');
    }
  };

  const handleRejectPartnerLocation = async (locId) => {
    const reason = window.prompt('Enter rejection reason for partner (optional):', 'Does not meet safety/size criteria');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/admin/locations/${encodeURIComponent(locId)}/reject`, {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ rejectionReason: reason })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      } else {
        alert(data.message || 'Error rejecting location.');
      }
    } catch (err) {
      alert('Error connecting to backend.');
    }
  };

  // Add Facility Modal State
  const [isFacModalOpen, setIsFacModalOpen] = useState(false);
  const [facName, setFacName] = useState('');
  const [facAddress, setFacAddress] = useState('');
  const [facSlots, setFacSlots] = useState('20');
  const [facRate, setFacRate] = useState('20');
  const [facLat, setFacLat] = useState('26.1445');
  const [facLng, setFacLng] = useState('91.7362');

  // Add Subscription Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState('monthly');
  const [planDays, setPlanDays] = useState('30');
  const [planPrice, setPlanPrice] = useState('349');
  const [planSavings, setPlanSavings] = useState('30');
  const [planFacId, setPlanFacId] = useState('');

  const fetchAdminData = async () => {
    try {
      const headers = getAdminAuthHeaders();

      // Stats
      const statsRes = await fetch('/api/admin/dashboard-stats', { headers });
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) setStats(statsData.stats);

      // Locations
      const locRes = await fetch('/api/locations');
      const locData = await locRes.json();
      if (locData.success) {
        setFacilities(locData.data);
        if (locData.data.length > 0 && !planFacId) {
          setPlanFacId(locData.data[0]._id || locData.data[0].facilityId || locData.data[0].id);
        }
      }

      // Master Bookings
      const bRes = await fetch('/api/admin/bookings', { headers });
      const bData = await bRes.json();
      if (bData.success) setBookings(bData.data);

      // Users List
      const uRes = await fetch('/api/admin/users', { headers });
      const uData = await uRes.json();
      if (uData.success) setUsersList(uData.data);

      // 2-Day Deleted Accounts Retention Audit Log
      const dlRes = await fetch('/api/admin/deleted-accounts', { headers });
      const dlData = await dlRes.json();
      if (dlData.success) setDeletedLogs(dlData.data);

      // Pending Partner Parking Locations
      const plRes = await fetch('/api/admin/pending-locations', { headers });
      const plData = await plRes.json();
      if (plData.success) setPendingLocations(plData.data);

      // ExcuseME PLUS Subscription Plans
      const spRes = await fetch('/api/subscriptions/plans');
      const spData = await spRes.json();
      if (spData.success) setSubscriptionPlans(spData.data);

      // All User Subscriptions
      const usRes = await fetch('/api/admin/subscriptions', { headers });
      const usData = await usRes.json();
      if (usData.success) setUserSubscriptions(usData.data);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (!admin) {
      navigate('/admin-login');
      return;
    }
    fetchAdminData();
  }, [admin, navigate]);

  const handleSaveFacility = async (e) => {
    e.preventDefault();
    if (!facName || !facAddress) {
      alert('Please fill out all facility fields.');
      return;
    }

    try {
      const res = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          name: facName,
          address: facAddress,
          totalSlots: parseInt(facSlots) || 20,
          pricePerHour: parseFloat(facRate) || 20,
          latitude: parseFloat(facLat) || 26.1445,
          longitude: parseFloat(facLng) || 91.7362
        })
      });

      const data = await res.json();
      setIsFacModalOpen(false);
      setFacName('');
      setFacAddress('');

      if (data.success) {
        alert(`New location "${facName}" created with 20 slots in MongoDB Atlas!`);
        fetchAdminData();
      } else {
        alert(data.message || 'Error creating location.');
      }
    } catch (err) {
      alert('Error creating location.');
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planName || !planPrice || !planFacId) {
      alert('Please fill out all plan fields.');
      return;
    }

    const selectedLoc = facilities.find(f => (f._id || f.facilityId || f.id) === planFacId);
    const locName = selectedLoc ? selectedLoc.name : 'Parking Facility';

    try {
      const res = await fetch('/api/admin/subscriptions/plans', {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({
          name: planName,
          type: planType,
          durationDays: parseInt(planDays) || (planType === 'weekly' ? 7 : 30),
          price: parseFloat(planPrice),
          savingsPercentage: parseInt(planSavings) || 25,
          locationId: planFacId,
          locationName: locName
        })
      });

      const data = await res.json();
      setIsPlanModalOpen(false);
      setPlanName('');

      if (data.success) {
        alert(`ExcuseME PLUS plan "${planName}" created successfully!`);
        fetchAdminData();
      } else {
        alert(data.message || 'Error creating plan.');
      }
    } catch (err) {
      alert('Error creating subscription plan.');
    }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this ExcuseME PLUS plan?')) {
      try {
        const res = await fetch(`/api/admin/subscriptions/plans/${id}`, {
          method: 'DELETE',
          headers: getAdminAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          alert('Plan deleted.');
          fetchAdminData();
        }
      } catch (err) {
        alert('Error deleting plan.');
      }
    }
  };

  const openInspectLogModal = (log) => {
    setSelectedLog(log);
    setIsLogModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <h2>🛡️ Administrator Control Panel</h2>
        <p className="subtitle">Real-time system overview, ExcuseME PLUS management, and master booking registry in MongoDB Atlas</p>

        {/* Top Summary Cards with Revenue Breakdown */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
            <p className="subtitle" style={{ fontSize: '12px', margin: 0 }}>Active Customer Accounts</p>
          </div>

          <div className="stat-card">
            <h3>Total Facilities</h3>
            <div className="stat-value">{facilities.length}</div>
            <p className="subtitle" style={{ fontSize: '12px', margin: 0 }}>Active Locations</p>
          </div>

          <div className="stat-card">
            <h3>Booking Revenue</h3>
            <div className="stat-value" style={{ color: 'var(--text-primary)' }}>
              Rs. {stats.bookingRevenue}
            </div>
            <p className="subtitle" style={{ fontSize: '12px', margin: 0 }}>Per-Booking Payments</p>
          </div>

          <div className="stat-card">
            <h3>ExcuseME PLUS Revenue</h3>
            <div className="stat-value" style={{ color: '#2563eb' }}>
              Rs. {stats.subscriptionRevenue}
            </div>
            <p className="subtitle" style={{ fontSize: '12px', margin: 0 }}>{stats.totalSubscriptions} Passes Purchased</p>
          </div>

          <div className="stat-card" style={{ border: '2px solid #2563eb' }}>
            <h3>Combined Revenue</h3>
            <div className="stat-value" style={{ color: '#2563eb' }}>
              Rs. {stats.totalRevenue}
            </div>
            <p className="subtitle" style={{ fontSize: '12px', margin: 0 }}>Total Gross Revenue</p>
          </div>
        </div>

        {/* ExcuseME PLUS Plans Management */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>💳 ExcuseME PLUS Subscription Plans</h3>
          <button
            type="button"
            className="btn btn-sm"
            style={{ backgroundColor: '#2563eb' }}
            onClick={() => setIsPlanModalOpen(true)}
          >
            ➕ Create Subscription Plan
          </button>
        </div>

        <table id="admin-plans-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Linked Location</th>
              <th>Price</th>
              <th>Savings</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subscriptionPlans.length > 0 ? (
              subscriptionPlans.map((p) => {
                const pId = p._id || p.id;
                return (
                  <tr key={pId}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.type}</span></td>
                    <td>{p.durationDays} Days</td>
                    <td>{p.locationName}</td>
                    <td><strong>Rs. {p.price}</strong></td>
                    <td><span className="badge badge-success">Save {p.savingsPercentage || 25}%</span></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeletePlan(pId)}
                      >
                        ❌ Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No ExcuseME PLUS plans created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* User Subscriptions Registry */}
        <h3 style={{ marginTop: '36px' }}>🎫 User Subscription Passes Registry</h3>
        <table id="admin-user-subs-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Pass Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Valid From</th>
              <th>Valid Until</th>
              <th>Price Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {userSubscriptions.length > 0 ? (
              userSubscriptions.map((s) => {
                const sId = s._id || s.id;
                const isExpired = s.status === 'expired' || new Date(s.endDate) < new Date();
                const badgeClass = isExpired ? 'badge-danger' : 'badge-success';

                return (
                  <tr key={sId}>
                    <td>{s.userEmail}</td>
                    <td><strong>{s.planName}</strong></td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{s.planType}</span></td>
                    <td>{s.locationName}</td>
                    <td>{new Date(s.startDate).toLocaleDateString()}</td>
                    <td>{new Date(s.endDate).toLocaleDateString()}</td>
                    <td><strong>Rs. {s.pricePaid}</strong></td>
                    <td><span className={`badge ${badgeClass}`}>{isExpired ? 'Expired' : 'Active'}</span></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No user subscription passes purchased yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pending Partner Parking Locations */}
        {pendingLocations.length > 0 && (
          <div style={{ marginTop: '36px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#d48806', fontSize: '18px' }}>
              ⏳ Pending Partner Locations ({pendingLocations.length})
            </h3>
            <p className="subtitle" style={{ fontSize: '13px', margin: '0 0 16px 0' }}>
              Review partner submitted parking spaces before approving them for live search results.
            </p>

            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', backgroundColor: '#ffffff' }}>
              <thead>
                <tr style={{ backgroundColor: '#fff3c4', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Facility Name</th>
                  <th style={{ padding: '10px 12px' }}>Address</th>
                  <th style={{ padding: '10px 12px' }}>Slots</th>
                  <th style={{ padding: '10px 12px' }}>Price/hr</th>
                  <th style={{ padding: '10px 12px' }}>Partner Contact</th>
                  <th style={{ padding: '10px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLocations.map(pl => {
                  const pId = pl._id || pl.facilityId;
                  return (
                    <tr key={pId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{pl.name}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{pl.address}</td>
                      <td style={{ padding: '12px' }}>{pl.totalSlots} Slots</td>
                      <td style={{ padding: '12px' }}>Rs. {pl.pricePerHour}/hr</td>
                      <td style={{ padding: '12px' }}>
                        <div>{pl.contactName || 'Partner'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pl.contactEmail || ''} {pl.contactPhone ? `· ${pl.contactPhone}` : ''}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ backgroundColor: '#16a34a', fontSize: '12px', padding: '4px 10px' }}
                            onClick={() => handleApprovePartnerLocation(pId)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                            onClick={() => handleRejectPartnerLocation(pId)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Facilities Management */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>📍 Parking Locations & Facilities</h3>
          <button
            type="button"
            className="btn btn-sm"
            id="add-facility-btn"
            onClick={() => setIsFacModalOpen(true)}
          >
            ➕ Add Parking Facility
          </button>
        </div>

        <table id="admin-facilities-table">
          <thead>
            <tr>
              <th>Facility ID</th>
              <th>Location Name</th>
              <th>Address</th>
              <th>Capacity</th>
              <th>Hourly Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {facilities.length > 0 ? (
              facilities.map((f) => {
                const facId = f._id || f.facilityId || f.id;
                return (
                  <tr key={facId}>
                    <td><code>{facId}</code></td>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.address || f.location || 'Guwahati, Assam'}</td>
                    <td><span className="badge badge-info">{f.totalSlots || 20} Slots</span></td>
                    <td><strong>Rs. {f.pricePerHour || f.ratePerHour}</strong> / hr</td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No parking locations found in MongoDB Atlas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Master Bookings Registry */}
        <h3 style={{ marginTop: '36px' }}>📋 Master Booking Registry</h3>
        <table id="admin-bookings-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User Account</th>
              <th>Location</th>
              <th>Slot</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Total Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((b) => {
                let badgeClass = 'badge-success';
                if (b.status === 'cancelled' || b.status === 'Cancelled') badgeClass = 'badge-danger';
                if (b.status === 'completed' || b.status === 'Completed') badgeClass = 'badge-info';

                const uEmail = b.userEmail || (b.user ? b.user.email : 'Deleted User Account');
                const locName = b.locationName || b.facilityName || (b.location ? b.location.name : 'Unknown');
                const sNum = b.slotNumber || b.slotId;
                const isSubBooking = b.amountPaid === 0 || b.paymentMethod === 'ExcuseME PLUS Pass';

                return (
                  <tr key={b.bookingId || b._id}>
                    <td><strong>{b.bookingId}</strong></td>
                    <td>{uEmail}</td>
                    <td>{locName}</td>
                    <td><strong style={{ color: 'var(--primary-blue)' }}>{sNum}</strong></td>
                    <td>{b.date}</td>
                    <td>{b.durationHours} hrs</td>
                    <td>
                      {isSubBooking ? (
                        <span className="badge badge-success" style={{ fontSize: '11px' }}>ExcuseME PLUS (Rs. 0)</span>
                      ) : (
                        <strong>Rs. {b.amountPaid}</strong>
                      )}
                    </td>
                    <td><span className={`badge ${badgeClass}`}>{b.status}</span></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No bookings recorded in MongoDB Atlas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Registered Users List */}
        <h3 style={{ marginTop: '36px' }}>👥 Active Registered User Accounts</h3>
        <table id="admin-users-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name</th>
              <th>Email Address</th>
              <th>Phone Number</th>
              <th>Registration Date</th>
            </tr>
          </thead>
          <tbody>
            {usersList.length > 0 ? (
              usersList.map((u) => {
                const uId = u._id || u.userId || u.id;
                const regDate = u.registrationDate ? new Date(u.registrationDate).toLocaleDateString() : 'N/A';
                return (
                  <tr key={uId}>
                    <td><code>{uId}</code></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserAvatar user={u} size={28} />
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{regDate}</span></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No active registered users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 2-Day Deleted Accounts Retention Audit Log */}
        <h3 style={{ marginTop: '36px' }}>
          📜 Deleted Accounts Audit Log (2-Day Temporary Retention)
          {deletedLogs.length > 0 && (
            <span style={{
              marginLeft: '10px',
              backgroundColor: '#64748b',
              color: 'white',
              borderRadius: '12px',
              padding: '2px 10px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              {deletedLogs.length} Retained
            </span>
          )}
        </h3>
        <table id="admin-deleted-logs-table">
          <thead>
            <tr>
              <th>Original User Name</th>
              <th>Email Address</th>
              <th>Phone</th>
              <th>Deletion Date & Time</th>
              <th>Retained Data</th>
              <th>Inspect Data</th>
            </tr>
          </thead>
          <tbody>
            {deletedLogs.length > 0 ? (
              deletedLogs.map((log) => {
                const logId = log._id || log.id;
                const bCount = (log.retainedBookings || []).length;
                const tCount = (log.retainedTransactions || []).length;

                return (
                  <tr key={logId}>
                    <td><strong>{log.userName}</strong></td>
                    <td>{log.userEmail}</td>
                    <td>{log.userPhone || 'N/A'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(log.deletedAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '12px' }}>
                        {bCount} Bookings, {tCount} Txns
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => openInspectLogModal(log)}
                      >
                        🔍 View Retained Data
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No deleted accounts currently retained in 2-day audit log.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Add Subscription Plan Modal */}
        <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} maxWidth={480}>
          <h3>Create ExcuseME PLUS Plan</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>Define a weekly or monthly pass for a parking location</p>

          <form onSubmit={handleSavePlan}>
            <div className="form-group">
              <label>Plan Name</label>
              <input
                type="text"
                placeholder="e.g. City Mall Monthly Pass"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Parking Facility</label>
              <select value={planFacId} onChange={(e) => setPlanFacId(e.target.value)} required>
                {facilities.map((f) => {
                  const facId = f._id || f.facilityId || f.id;
                  return (
                    <option key={facId} value={facId}>
                      {f.name} - {f.address || 'Guwahati'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Pass Type</label>
                <select
                  value={planType}
                  onChange={(e) => {
                    setPlanType(e.target.value);
                    setPlanDays(e.target.value === 'weekly' ? '7' : '30');
                  }}
                >
                  <option value="weekly">Weekly (7 Days)</option>
                  <option value="monthly">Monthly (30 Days)</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (Rs.)</label>
                <input
                  type="number"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Savings Badge (% vs daily)</label>
              <input
                type="number"
                value={planSavings}
                onChange={(e) => setPlanSavings(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsPlanModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#2563eb' }}>
                Save Plan
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Location Modal */}
        <Modal isOpen={isFacModalOpen} onClose={() => setIsFacModalOpen(false)} maxWidth={480}>
          <h3>➕ Add New Parking Location</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>Create a new facility with 20 auto-generated slots</p>

          <form id="add-facility-form" onSubmit={handleSaveFacility}>
            <div className="form-group">
              <label htmlFor="fac-name">Location / Facility Name</label>
              <input
                type="text"
                id="fac-name"
                placeholder="e.g. City Centre Mall Parking"
                value={facName}
                onChange={(e) => setFacName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fac-address">Address & City</label>
              <input
                type="text"
                id="fac-address"
                placeholder="e.g. GS Road, Dispur, Guwahati"
                value={facAddress}
                onChange={(e) => setFacAddress(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="fac-slots">Total Slots</label>
                <input
                  type="number"
                  id="fac-slots"
                  value={facSlots}
                  onChange={(e) => setFacSlots(e.target.value)}
                  readOnly
                  style={{ backgroundColor: '#f1f5f9' }}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="fac-rate">Hourly Rate (Rs.)</label>
                <input
                  type="number"
                  id="fac-rate"
                  value={facRate}
                  onChange={(e) => setFacRate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="fac-lat">Latitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  id="fac-lat"
                  placeholder="e.g. 26.1445"
                  value={facLat}
                  onChange={(e) => setFacLat(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="fac-lng">Longitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  id="fac-lng"
                  placeholder="e.g. 91.7362"
                  value={facLng}
                  onChange={(e) => setFacLng(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsFacModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" id="save-facility-btn" className="btn" style={{ flex: 1 }}>
                Create Facility
              </button>
            </div>
          </form>
        </Modal>

        {/* Retained Data Inspection Modal */}
        <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} maxWidth={640}>
          {selectedLog && (
            <div>
              <h3>📜 Retained Data Audit Snapshot</h3>
              <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>
                Account of <strong>{selectedLog.userName}</strong> ({selectedLog.userEmail}) deleted on {new Date(selectedLog.deletedAt).toLocaleString()}
              </p>

              <h4 style={{ fontSize: '15px', marginTop: '16px', marginBottom: '8px' }}>📋 Retained Bookings ({(selectedLog.retainedBookings || []).length})</h4>
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', fontSize: '13px', background: 'var(--bg-main)' }}>
                {(selectedLog.retainedBookings || []).length > 0 ? (
                  selectedLog.retainedBookings.map((b, idx) => (
                    <div key={idx} style={{ padding: '6px 0', borderBottom: idx < selectedLog.retainedBookings.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <strong>{b.bookingId}</strong> | {b.locationName || b.facilityName} | Slot: <strong>{b.slotNumber || b.slotId}</strong> | Date: {b.date} | Amount: Rs. {b.amountPaid}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No bookings retained for this account.</div>
                )}
              </div>

              <h4 style={{ fontSize: '15px', marginTop: '16px', marginBottom: '8px' }}>💳 Retained Transactions ({(selectedLog.retainedTransactions || []).length})</h4>
              <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', fontSize: '13px', background: 'var(--bg-main)' }}>
                {(selectedLog.retainedTransactions || []).length > 0 ? (
                  selectedLog.retainedTransactions.map((t, idx) => (
                    <div key={idx} style={{ padding: '6px 0', borderBottom: idx < selectedLog.retainedTransactions.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <strong>{t.transactionId}</strong> | Payment Ref: <code>{t.paymentId}</code> | Amount: Rs. {t.amount} | Method: {t.paymentMethod}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No transaction receipts retained for this account.</div>
                )}
              </div>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsLogModalOpen(false)}>
                  Close Audit View
                </button>
              </div>
            </div>
          )}
        </Modal>
      </main>
      <Footer />
    </>
  );
};

export default AdminDashboardPage;
