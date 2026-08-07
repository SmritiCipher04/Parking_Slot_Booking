import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SlotGrid from '../components/SlotGrid';

const PartnerDashboardPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalLocations: 0, totalBookings: 0, totalRevenue: 0 });
  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState('');
  const [facilitySlots, setFacilitySlots] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPartnerData();
  }, [user, navigate]);

  const fetchPartnerData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/partner/dashboard', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || { totalLocations: 0, totalBookings: 0, totalRevenue: 0 });
        setLocations(data.locations || []);
        setBookings(data.bookings || []);

        if (data.locations && data.locations.length > 0) {
          const firstLoc = data.locations[0]._id || data.locations[0].facilityId;
          setSelectedLocId(firstLoc);
          fetchSlotsForLoc(firstLoc);
        }
      }
    } catch (err) {
      console.error('Partner dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotsForLoc = async (locId) => {
    try {
      const res = await fetch(`/api/locations/${encodeURIComponent(locId)}/slots`);
      const data = await res.json();
      if (data.success && data.data) {
        setFacilitySlots(data.data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const handleSelectFacility = (locId) => {
    setSelectedLocId(locId);
    fetchSlotsForLoc(locId);
  };

  return (
    <>
      <Navbar />
      <main className="container main-content" style={{ maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2>Partner Dashboard</h2>
            <p className="subtitle" style={{ margin: 0 }}>Overview of your listed parking facilities, live slot occupancy, and revenue.</p>
          </div>
          <Link to="/become-partner" className="btn" style={{ fontSize: '13px', padding: '8px 16px' }}>
            + Register Another Facility
          </Link>
        </div>

        {/* Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Facilities</span>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--primary-blue)' }}>{stats.totalLocations}</div>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Bookings</span>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: '#16a34a' }}>{stats.totalBookings}</div>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Facility Revenue</span>
            <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '4px', color: 'var(--primary-blue)' }}>Rs. {stats.totalRevenue}</div>
          </div>
        </div>

        {/* Registered Locations List */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>My Parking Facilities</h3>

          {locations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              You have not registered any parking spaces yet.{' '}
              <Link to="/become-partner" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>List a Parking Space now</Link>.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Facility Name</th>
                    <th style={{ padding: '10px 12px' }}>Address</th>
                    <th style={{ padding: '10px 12px' }}>Slots</th>
                    <th style={{ padding: '10px 12px' }}>Rate/hr</th>
                    <th style={{ padding: '10px 12px' }}>Approval Status</th>
                    <th style={{ padding: '10px 12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => {
                    const locId = loc._id || loc.facilityId;
                    const isPending = loc.status === 'pending';
                    const isRejected = loc.status === 'rejected';

                    return (
                      <tr key={locId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{loc.name}</td>
                        <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{loc.address}</td>
                        <td style={{ padding: '12px' }}>{loc.totalSlots} Slots</td>
                        <td style={{ padding: '12px' }}>Rs. {loc.pricePerHour}/hr</td>
                        <td style={{ padding: '12px' }}>
                          {isPending && (
                            <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              ⏳ Pending Admin Review
                            </span>
                          )}
                          {isRejected && (
                            <span className="badge badge-danger" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }} title={loc.rejectionReason || ''}>
                              ❌ Rejected
                            </span>
                          )}
                          {loc.status === 'active' && (
                            <span className="badge badge-success" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              ✅ Active & Listed
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${selectedLocId === locId ? '' : 'btn-secondary'}`}
                            onClick={() => handleSelectFacility(locId)}
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                          >
                            View Live Slots
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Slot Grid Preview */}
        {selectedLocId && (
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
              Live Slot Grid Occupancy: {locations.find(l => (l._id || l.facilityId) === selectedLocId)?.name || 'Selected Facility'}
            </h3>

            {facilitySlots.length > 0 ? (
              <SlotGrid
                slots={facilitySlots}
                selectedSlots={[]}
                onSlotClick={() => {}}
                userRole="partner"
              />
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading slot grid...</p>
            )}
          </div>
        )}

        {/* Bookings History for Partner Location */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Bookings History at Your Location</h3>

          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>No bookings recorded for your facility yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Booking ID</th>
                    <th style={{ padding: '10px 12px' }}>User</th>
                    <th style={{ padding: '10px 12px' }}>Slot</th>
                    <th style={{ padding: '10px 12px' }}>Duration</th>
                    <th style={{ padding: '10px 12px' }}>Amount Paid</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id || b.bookingId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{b.bookingId || b._id}</td>
                      <td style={{ padding: '10px 12px' }}>{b.userName || b.userEmail || 'Customer'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{b.slotNumber}</td>
                      <td style={{ padding: '10px 12px' }}>{b.durationHours || 1} hr(s)</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>Rs. {b.amountPaid || 0}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge badge-${b.status === 'completed' ? 'success' : b.status === 'cancelled' ? 'danger' : 'info'}`} style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PartnerDashboardPage;
