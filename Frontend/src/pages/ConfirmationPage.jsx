import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ConfirmationPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const bookingId = searchParams.get('bookingId');

    const fetchBooking = async () => {
      try {
        const res = await fetch('/api/bookings', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const found = bookingId
            ? data.data.find(b => b.bookingId === bookingId)
            : data.data[0];
          setBooking(found || data.data[0]);
        }
      } catch (err) {
        console.error('Error fetching confirmation booking:', err);
      }
    };

    fetchBooking();
  }, [user, navigate, searchParams]);

  return (
    <>
      <Navbar />
      <main className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
        <h2>Parking Slot Booking Confirmed!</h2>
        <p className="subtitle">Your reservation details have been recorded in MongoDB Atlas.</p>

        {booking && (
          <div className="info-box" style={{ textAlign: 'left', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Security Entrance PIN</span>
                <div id="conf-pin" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '0.05em' }}>
                  PIN-{booking.entryPin || booking.pin || '8492'}
                </div>
              </div>
              <span className="badge badge-success">Confirmed</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '14px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Booking ID</span>
                <strong id="conf-booking-id">{booking.bookingId}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Location</span>
                <strong id="conf-facility">{booking.locationName || booking.facilityName}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Reserved Slot</span>
                <strong id="conf-slot" style={{ color: 'var(--primary-blue)', fontSize: '16px' }}>{booking.slotNumber || booking.slotId}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Reserved Date</span>
                <strong id="conf-date">{booking.date}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Duration</span>
                <strong id="conf-duration">{booking.durationHours} hours</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px' }}>Amount Paid</span>
                <strong id="conf-amount" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>Rs. {booking.amountPaid}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/history" className="btn">
            📋 View My Bookings
          </Link>
          <Link to="/" className="btn btn-secondary">
            🚗 Reserve Another Slot
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ConfirmationPage;
