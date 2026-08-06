import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';

const ExcuseMePlusPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [plans, setPlans] = useState([]);

  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [purchasedSubscription, setPurchasedSubscription] = useState(null);

  useEffect(() => {
    // Fetch facilities
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setFacilities(data.data);
          const firstId = data.data[0]._id || data.data[0].facilityId || data.data[0].id;
          setSelectedFacilityId(firstId);
          setSelectedFacility(data.data[0]);
        }
      })
      .catch(err => console.error(err));

    // Load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedFacilityId) return;

    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/subscriptions/plans?locationId=${encodeURIComponent(selectedFacilityId)}`);
        const data = await res.json();
        if (data.success) {
          // Filter by location or show all
          setPlans(data.data);
        }
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
      }
    };

    fetchPlans();
  }, [selectedFacilityId]);

  const handleFacilityChange = (e) => {
    const facId = e.target.value;
    setSelectedFacilityId(facId);
    const found = facilities.find(f => (f._id || f.facilityId || f.id) === facId);
    if (found) setSelectedFacility(found);
  };

  const handleBuyPass = (plan) => {
    if (!user) {
      alert('Please log in to purchase an ExcuseME PLUS Subscription Pass.');
      navigate('/login');
      return;
    }
    setActiveCheckoutPlan(plan);
    openRazorpayOrSimulator(plan);
  };

  const finalizeSubscription = async (plan, paymentId, paymentMethod = 'Razorpay (Card)') => {
    try {
      const res = await fetch('/api/subscriptions/verify-payment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          planId: plan._id || plan.id,
          razorpay_payment_id: paymentId,
          paymentMethod,
          amount: plan.price
        })
      });

      const result = await res.json();
      if (result.success && result.subscription) {
        setPurchasedSubscription(result.subscription);
        alert(`🎉 ${result.message}`);
      } else {
        alert('Subscription payment verification failed: ' + (result.message || 'Error'));
      }
    } catch (err) {
      console.error('Finalize subscription error:', err);
      alert('Connection error during payment confirmation.');
    }
  };

  const openRazorpayOrSimulator = async (plan) => {
    if (typeof window.Razorpay === 'undefined') {
      setIsSimulatorOpen(true);
      return;
    }

    try {
      const orderRes = await fetch('/api/subscriptions/create-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          planId: plan._id || plan.id,
          amount: plan.price
        })
      });

      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId || 'rzp_test_TAyTdm1bjJolB1',
        amount: orderData.amount || Math.round(plan.price * 100),
        currency: orderData.currency || 'INR',
        name: 'ExcuseME PLUS Pass',
        description: `${plan.name} - ${plan.locationName || (selectedFacility ? selectedFacility.name : 'Parking')}`,
        order_id: orderData.orderId,
        handler: function (response) {
          finalizeSubscription(plan, response.razorpay_payment_id, 'Razorpay Checkout');
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || '9999999999'
        },
        theme: { color: '#2563eb' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.warn('Razorpay order error, opening simulator:', err);
      setIsSimulatorOpen(true);
    }
  };

  const handleSimulatorSubmit = async () => {
    if (!activeCheckoutPlan) return;
    const simPaymentId = `sim_sub_${Date.now()}`;
    setIsSimulatorOpen(false);
    await finalizeSubscription(activeCheckoutPlan, simPaymentId, 'Local Payment Simulator');
  };

  return (
    <>
      <Navbar />
      <main className="container" style={{ maxWidth: '900px' }}>
        {/* Hero Banner */}
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '36px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <span style={{
            backgroundColor: '#ffffff22',
            color: '#ffffff',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'inline-block',
            marginBottom: '12px'
          }}>
            EXCUSEME PLUS PASSES
          </span>
          <h2 style={{ fontSize: '32px', color: 'white', marginBottom: '8px' }}>
            Unlimited Parking Passes at Discounted Rates
          </h2>
          <p style={{ opacity: 0.9, fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Skip daily per-booking payments! Get a Weekly or Monthly ExcuseME PLUS pass for your favorite parking location and enjoy zero per-booking fees.
          </p>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/my-subscriptions" className="btn" style={{ backgroundColor: 'white', color: '#2563eb', fontWeight: 600 }}>
              🎫 View My Active Passes
            </Link>
          </div>
        </div>

        {/* Purchase Confirmation Card */}
        {purchasedSubscription && (
          <div className="info-box" style={{ borderColor: '#10b981', backgroundColor: '#f0fdf4', marginBottom: '32px' }}>
            <h3 style={{ color: '#047857', marginBottom: '12px' }}>Your ExcuseME PLUS Pass is Now Active!</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div><strong>Pass Name:</strong> {purchasedSubscription.planName}</div>
              <div><strong>Location:</strong> {purchasedSubscription.locationName}</div>
              <div><strong>Valid From:</strong> {new Date(purchasedSubscription.startDate).toLocaleDateString()}</div>
              <div><strong>Valid Until:</strong> {new Date(purchasedSubscription.endDate).toLocaleDateString()}</div>
              <div><strong>Status:</strong> <span className="badge badge-success">Active Pass</span></div>
              <div><strong>Payment Ref:</strong> <code>{purchasedSubscription.paymentId}</code></div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <Link to={`/slots?facilityId=${selectedFacilityId}`} className="btn">
                🚗 Book a Slot Now (Rs. 0 Fee) &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Location Selector */}
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', marginBottom: '32px', border: '1px solid var(--border-color)' }}>
          <label htmlFor="facility-select" style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Select Preferred Parking Facility for ExcuseME PLUS Pass:
          </label>
          <select id="facility-select" value={selectedFacilityId} onChange={handleFacilityChange} style={{ maxWidth: '480px' }}>
            {facilities.map((f) => {
              const facId = f._id || f.facilityId || f.id;
              return (
                <option key={facId} value={facId}>
                  {f.name} - {f.address || 'Guwahati'} (Rs. {f.pricePerHour || f.ratePerHour}/hr)
                </option>
              );
            })}
          </select>
        </div>

        {/* Plans Grid */}
        <h3 style={{ marginBottom: '16px' }}>Available ExcuseME PLUS Passes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {plans.map((p) => {
            const planId = p._id || p.id;
            const isMonthly = p.type === 'monthly';

            return (
              <div
                key={planId}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '16px',
                  padding: '28px',
                  border: isMonthly ? '2px solid #2563eb' : '1px solid var(--border-color)',
                  boxShadow: isMonthly ? '0 10px 25px -5px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                {isMonthly && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '24px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '12px',
                    textTransform: 'uppercase'
                  }}>
                    BEST VALUE
                  </span>
                )}

                <div>
                  <span className="badge badge-info" style={{ textTransform: 'uppercase', marginBottom: '8px' }}>
                    {p.type} Pass ({p.durationDays} Days)
                  </span>

                  <h3 style={{ fontSize: '20px', marginTop: '6px', marginBottom: '6px' }}>{p.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                    Linked Location: <strong>{p.locationName}</strong>
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Rs. {p.price}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      / {p.durationDays} days
                    </span>
                    {p.savingsPercentage && (
                      <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
                        Save {p.savingsPercentage}% vs Daily
                      </span>
                    )}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontSize: '14px' }}>
                    {(p.features || [
                      'Unlimited slot reservations at location',
                      'Zero per-booking payments',
                      'Priority slot allocation',
                      '24/7 parking access'
                    ]).map((feat, idx) => (
                      <li key={idx} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    backgroundColor: isMonthly ? '#2563eb' : 'var(--primary-blue)'
                  }}
                  onClick={() => handleBuyPass(p)}
                >
                  💳 Get {p.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* Offline Simulator Modal */}
        <Modal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} maxWidth={480}>
          <h3>ExcuseME PLUS Payment Simulator</h3>
          <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>
            Simulate Razorpay payment for ExcuseME PLUS Pass
          </p>

          {activeCheckoutPlan && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <div><strong>Pass Name:</strong> <span>{activeCheckoutPlan.name}</span></div>
              <div><strong>Location:</strong> <span>{activeCheckoutPlan.locationName}</span></div>
              <div><strong>Price Due:</strong> <strong style={{ color: '#2563eb' }}>Rs. {activeCheckoutPlan.price}</strong></div>
            </div>
          )}

          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsSimulatorOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSimulatorSubmit}>
              Authorize Simulated Payment
            </button>
          </div>
        </Modal>
      </main>
      <Footer />
    </>
  );
};

export default ExcuseMePlusPage;
