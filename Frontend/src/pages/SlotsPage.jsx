import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SlotGrid from '../components/SlotGrid';

const SlotsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [currentFacility, setCurrentFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [durationHours, setDurationHours] = useState(2);
  const [liveStatusNotice, setLiveStatusNotice] = useState('🟢 Live slot availability active');

  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const initialFacilityId = searchParams.get('facilityId') || searchParams.get('facility') || 'f1';

    const fetchFacilities = async () => {
      try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setFacilities(data.data);
          const active = data.data.find(f => (f.facilityId || f._id || f.id) === initialFacilityId) || data.data[0];
          setSelectedFacilityId(active.facilityId || active._id || active.id);
          setCurrentFacility(active);
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      }
    };

    fetchFacilities();
  }, [user, navigate, searchParams]);

  // Setup Socket.IO connection & polling for real-time slot grid updates
  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setLiveStatusNotice('🟢 Real-time WebSocket updates connected');
    });

    socket.on('disconnect', () => {
      setLiveStatusNotice('⚡ Fast 3s polling fallback active');
    });

    socket.on('slotStatusUpdate', (update) => {
      if (!update) return;

      setSlots((prevSlots) => {
        return prevSlots.map((s) => {
          const sId = s.slotNumber || s.slotId || s._id || s.id;
          const matchId = update.slotId || update.slotNumber;

          if (sId === matchId || s.slotNumber === update.slotNumber) {
            return {
              ...s,
              status: update.status,
              occupiedUntil: update.occupiedUntil
            };
          }
          return s;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch slots whenever selected facility changes + fast 3s polling fallback
  useEffect(() => {
    if (!selectedFacilityId) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('joinFacility', selectedFacilityId);
    }

    const fetchSlots = async () => {
      try {
        const res = await fetch(`/api/locations/${encodeURIComponent(selectedFacilityId)}/slots`);
        const data = await res.json();
        if (data.success) {
          setSlots(data.data);
          if (data.location) setCurrentFacility(data.location);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
      }
    };

    fetchSlots();
    setSelectedSlotId(null);

    // Fast 3-second polling fallback to guarantee real-time updates everywhere
    const pollInterval = setInterval(fetchSlots, 3000);

    return () => {
      clearInterval(pollInterval);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leaveFacility', selectedFacilityId);
      }
    };
  }, [selectedFacilityId]);

  const handleFacilityChange = (e) => {
    const facId = e.target.value;
    setSelectedFacilityId(facId);
    const found = facilities.find(f => (f.facilityId || f._id || f.id) === facId);
    if (found) setCurrentFacility(found);
  };

  const handleSlotSelect = (sId) => {
    if (selectedSlotId === sId) {
      setSelectedSlotId(null);
    } else {
      setSelectedSlotId(sId);
    }
  };

  const rate = currentFacility ? (currentFacility.pricePerHour || currentFacility.ratePerHour || 20) : 20;
  const totalCost = (parseInt(durationHours) || 1) * rate;

  const handleProceedToCheckout = () => {
    if (!selectedSlotId || !currentFacility) return;

    const facId = currentFacility.facilityId || currentFacility._id || currentFacility.id;
    const checkoutData = {
      facilityId: facId,
      facilityName: currentFacility.name,
      slotId: selectedSlotId,
      ratePerHour: rate,
      durationHours: parseInt(durationHours) || 2,
      amountPaid: totalCost,
      userEmail: user.email
    };

    localStorage.setItem('excuseme_checkout', JSON.stringify(checkoutData));
    navigate(`/payment?facilityId=${facId}&slot=${selectedSlotId}&duration=${durationHours}`);
  };

  return (
    <>
      <Navbar />
      <main className="container">
        <h2>Select Your Parking Slot</h2>
        <p className="subtitle">Choose an available parking location and select your preferred slot from the 20-slot grid layout.</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div className="form-group" style={{ maxWidth: '420px', margin: 0, flex: 1 }}>
            <label htmlFor="facility-select">Choose Available Location</label>
            <select id="facility-select" value={selectedFacilityId} onChange={handleFacilityChange}>
              {facilities.map((f) => {
                const facId = f.facilityId || f._id || f.id;
                return (
                  <option key={facId} value={facId}>
                    {f.name} - {f.address || f.location || 'Guwahati'} (Rs. {f.pricePerHour || f.ratePerHour}/hr)
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ fontSize: '12px', color: '#059669', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '20px', fontWeight: 600 }}>
            {liveStatusNotice}
          </div>
        </div>

        <div className="slot-legend">
          <div className="legend-item">
            <div className="legend-box" style={{ backgroundColor: 'var(--status-available-bg)', borderColor: 'var(--status-available-border)' }}></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-box" style={{ backgroundColor: 'var(--status-booked-bg)', borderColor: 'var(--status-booked-border)' }}></div>
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-box" style={{ backgroundColor: 'var(--status-reserved-bg)', borderColor: 'var(--status-reserved-border)' }}></div>
            <span>Reserved</span>
          </div>
          <div className="legend-item">
            <div className="legend-box" style={{ backgroundColor: 'var(--status-selected-bg)', borderColor: 'var(--status-selected-border)' }}></div>
            <span>Selected</span>
          </div>
        </div>

        <h3 id="facility-title">
          {currentFacility ? `${currentFacility.name} - Slot Layout (20 Slots)` : 'Parking Slots Layout'}
        </h3>

        <SlotGrid slots={slots} selectedSlotId={selectedSlotId} onSelectSlot={handleSlotSelect} />

        <div className="info-box">
          <h4>Booking Reservation Summary</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Location:</span>
              <strong id="selected-facility-display" style={{ display: 'block' }}>
                {currentFacility ? currentFacility.name : 'Select a facility'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Selected Slot:</span>
              <strong id="selected-slot-display" style={{ display: 'block', color: 'var(--primary-blue)', fontSize: '18px' }}>
                {selectedSlotId || 'None'}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Hourly Price:</span>
              <strong id="selected-price-display" style={{ display: 'block' }}>
                Rs. {rate} / hr
              </strong>
            </div>

            <div>
              <label htmlFor="duration" style={{ fontSize: '13px' }}>Duration (Hours):</label>
              <input
                type="number"
                id="duration"
                min="1"
                max="24"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                style={{ width: '80px', padding: '6px' }}
              />
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Estimated Total:</span>
              <strong id="estimated-total-display" style={{ display: 'block', fontSize: '20px', color: 'var(--text-primary)' }}>
                Rs. {totalCost}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              id="submit-btn"
              className="btn"
              disabled={!selectedSlotId}
              onClick={handleProceedToCheckout}
            >
              Proceed to Payment & Checkout &rarr;
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SlotsPage;
