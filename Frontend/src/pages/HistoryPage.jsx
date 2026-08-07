import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';

const HistoryPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [activeExtendBooking, setActiveExtendBooking] = useState(null);
  const [extendHours, setExtendHours] = useState(1);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const handleCancelBooking = async (id) => {
    if (window.confirm(`Are you sure you want to cancel booking ${id}? Your reserved slot will be freed in MongoDB Atlas.`)) {
      try {
        const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
          method: 'PUT',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success) {
          alert(`Booking ${id} cancelled successfully.`);
          fetchBookings();
        } else {
          alert(data.message || 'Cancellation failed.');
        }
      } catch (err) {
        alert('Server error during cancellation.');
      }
    }
  };

  const handleOpenExtendModal = (b) => {
    setActiveExtendBooking(b);
    setExtendHours(1);
    setIsExtendModalOpen(true);
  };

  const handleConfirmExtend = async () => {
    if (!activeExtendBooking) return;
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(activeExtendBooking.bookingId)}/extend`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ extraHours: extendHours })
      });
      const data = await res.json();
      setIsExtendModalOpen(false);
      setActiveExtendBooking(null);

      if (data.success) {
        alert(`Booking extended by ${extendHours} hours!`);
        fetchBookings();
      } else {
        alert(data.message || 'Extension failed.');
      }
    } catch (err) {
      alert('Server error during extension.');
    }
  };

  const calculateExtendCost = () => {
    if (!activeExtendBooking) return 0;
    const rate = activeExtendBooking.ratePerHour || 20;
    return (parseInt(extendHours) || 1) * rate;
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <h2>My Booking Reservations</h2>
        <p className="subtitle">View active, upcoming, and past parking reservations with security PINs</p>

        <table id="bookings-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Entrance PIN</th>
              <th>Location</th>
              <th>Slot</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Total Paid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((b) => {
                let badgeClass = 'badge-success';
                if (b.status === 'cancelled' || b.status === 'Cancelled') badgeClass = 'badge-danger';
                if (b.status === 'completed' || b.status === 'Completed') badgeClass = 'badge-info';

                const isUpcoming = (b.status === 'upcoming' || b.status === 'Upcoming');

                return (
                  <tr key={b.bookingId}>
                    <td><strong>{b.bookingId}</strong></td>
                    <td>
                      <code style={{ background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        PIN-{b.entryPin || b.pin || '8492'}
                      </code>
                    </td>
                    <td>{b.locationName || b.facilityName}</td>
                    <td><strong style={{ color: 'var(--primary-blue)' }}>{b.slotNumber || b.slotId}</strong></td>
                    <td>{b.date}</td>
                    <td>{b.durationHours} hrs</td>
                    <td><strong>Rs. {b.amountPaid}</strong></td>
                    <td><span className={`badge ${badgeClass}`}>{b.status}</span></td>
                    <td>
                      {isUpcoming ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm extend-btn"
                            style={{ marginRight: '6px' }}
                            onClick={() => handleOpenExtendModal(b)}
                          >
                            ➕ Extend
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger cancel-btn"
                            onClick={() => handleCancelBooking(b.bookingId)}
                          >
                            ❌ Cancel
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No Actions</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No parking bookings found. <Link to="/slots">Book a slot now</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Extend Modal */}
        <Modal isOpen={isExtendModalOpen} onClose={() => setIsExtendModalOpen(false)} maxWidth={440}>
          <h3>➕ Extend Booking Duration</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>Add extra hours to your existing slot reservation</p>

          {activeExtendBooking && (
            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid var(--border-color)' }}>
              <div><strong>Booking ID:</strong> <span id="extend-booking-id">{activeExtendBooking.bookingId}</span></div>
              <div><strong>Reserved Slot:</strong> <strong id="extend-slot" style={{ color: 'var(--primary-blue)' }}>{activeExtendBooking.slotNumber || activeExtendBooking.slotId}</strong></div>
              <div><strong>Location:</strong> <span id="extend-facility">{activeExtendBooking.locationName || activeExtendBooking.facilityName}</span></div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="extend-hours">Add Extra Hours</label>
            <input
              type="number"
              id="extend-hours"
              min="1"
              max="12"
              value={extendHours}
              onChange={(e) => setExtendHours(e.target.value)}
              required
            />
          </div>

          <div style={{ margin: '16px 0', fontSize: '15px' }}>
            <span>Extra Cost Amount: </span>
            <strong id="extend-cost" style={{ color: 'var(--primary-blue)', fontSize: '18px' }}>
              Rs. {calculateExtendCost()}
            </strong>
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExtendModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleConfirmExtend}>
              Confirm Extension & Pay
            </button>
          </div>
        </Modal>
      </main>
      <Footer />
    </>
  );
};

export default HistoryPage;
