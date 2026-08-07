import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const BecomePartnerPage = () => {
  const { user, getAuthHeaders, updateUserState } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [totalSlots, setTotalSlots] = useState(20);
  const [pricePerHour, setPricePerHour] = useState(25);
  const [latitude, setLatitude] = useState(26.1445);
  const [longitude, setLongitude] = useState(91.7362);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setContactName(user.name || '');
    setContactEmail(user.email || '');
    setContactPhone(user.phone || '');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !address || !pricePerHour) {
      alert('Please fill out all required facility details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/partner/locations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          address,
          contactName,
          contactEmail,
          contactPhone,
          totalSlots: parseInt(totalSlots) || 20,
          pricePerHour: parseFloat(pricePerHour) || 25,
          latitude: parseFloat(latitude) || 26.1445,
          longitude: parseFloat(longitude) || 91.7362
        })
      });

      const data = await res.json();
      if (data.success) {
        if (updateUserState) updateUserState({ role: 'partner' });
        alert(`🎉 Success! Your parking space "${name}" has been registered and is pending admin approval.`);
        navigate('/partner-dashboard');
      } else {
        alert(data.message || 'Error registering parking location.');
      }
    } catch (err) {
      console.error('Partner submission error:', err);
      alert('Error connecting to backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="container" style={{ maxWidth: '720px' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '32px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
          <h2>List Your Parking Space — Become a Partner</h2>
          <p className="subtitle" style={{ marginBottom: '24px' }}>
            Monetize your empty parking slots at your mall, hospital, office, or private property.
          </p>

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: '16px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Facility & Location Details
            </h3>

            <div className="form-group">
              <label htmlFor="fac-name">Parking Facility Name *</label>
              <input
                type="text"
                id="fac-name"
                placeholder="e.g. City Mall Underground Parking"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fac-address">Full Address *</label>
              <input
                type="text"
                id="fac-address"
                placeholder="e.g. GS Road, Near Hub Mall, Dispur, Guwahati"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                <label htmlFor="fac-slots">Number of Slots *</label>
                <input
                  type="number"
                  id="fac-slots"
                  min="5"
                  max="100"
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(e.target.value)}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Auto-generates slot codes (A1-A5, B1-B5...)</span>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                <label htmlFor="fac-rate">Hourly Rate (Rs.) *</label>
                <input
                  type="number"
                  id="fac-rate"
                  min="10"
                  max="500"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  required
                />
              </div>
            </div>

            <h3 style={{ fontSize: '16px', margin: '24px 0 14px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              GPS Location Coordinates
            </h3>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                <label htmlFor="fac-lat">Latitude</label>
                <input
                  type="number"
                  step="any"
                  id="fac-lat"
                  placeholder="26.1445"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                <label htmlFor="fac-lng">Longitude</label>
                <input
                  type="number"
                  step="any"
                  id="fac-lng"
                  placeholder="91.7362"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>

            <h3 style={{ fontSize: '16px', margin: '24px 0 14px 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Owner Contact Information
            </h3>

            <div className="form-group">
              <label htmlFor="contact-name">Contact Person Name</label>
              <input
                type="text"
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                <label htmlFor="contact-email">Contact Email</label>
                <input
                  type="email"
                  id="contact-email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
                <label htmlFor="contact-phone">Contact Phone</label>
                <input
                  type="tel"
                  id="contact-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn" style={{ width: '100%', marginTop: '16px' }} disabled={submitting}>
              {submitting ? 'Submitting Space...' : 'Register Parking Space for Approval'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default BecomePartnerPage;
