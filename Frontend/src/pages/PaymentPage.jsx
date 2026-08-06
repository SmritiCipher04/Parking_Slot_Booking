import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Modal from '../components/Modal';

const PaymentPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [checkoutData, setCheckoutData] = useState(null);
  const [facility, setFacility] = useState(null);
  const [activePass, setActivePass] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem('excuseme_checkout'));
    } catch (e) {}

    const facilityId = searchParams.get('facilityId') || (stored ? stored.facilityId : 'f1');
    const slotId = searchParams.get('slot') || (stored ? stored.slotId : 'A4');
    const duration = parseInt(searchParams.get('duration')) || (stored ? stored.durationHours : 2);

    const activeCheckout = {
      facilityId,
      slotId,
      durationHours: duration,
      userEmail: user.email
    };
    setCheckoutData(activeCheckout);

    // Fetch facility details
    fetch('/api/locations')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          const found = data.data.find(f => (f.facilityId || f._id || f.id) === facilityId) || data.data[0];
          setFacility(found);

          // Check if user has active ExcuseME PLUS pass for this facility
          const facName = found ? found.name : '';
          fetch(`/api/subscriptions/active-pass?facilityId=${encodeURIComponent(facilityId)}&facilityName=${encodeURIComponent(facName)}`, {
            headers: getAuthHeaders()
          })
            .then(r => r.json())
            .then(subData => {
              if (subData.success && subData.hasActivePass) {
                setActivePass(subData.pass);
              }
            })
            .catch(err => console.error('Error checking active pass:', err));
        }
      })
      .catch(err => console.error(err));

    // Dynamically load Razorpay SDK
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user, navigate, searchParams]);

  const duration = checkoutData ? checkoutData.durationHours : 2;
  const slotId = checkoutData ? checkoutData.slotId : 'A4';
  const facilityId = checkoutData ? checkoutData.facilityId : 'f1';
  const ratePerHour = facility ? (facility.pricePerHour || facility.ratePerHour || 20) : 20;
  const facilityName = facility ? facility.name : 'City Mall Parking';
  const totalAmount = activePass ? 0 : duration * ratePerHour;
  const currentDate = new Date().toISOString().split('T')[0];

  const finalizeBooking = async (paymentId, paymentMethod = 'Razorpay (Card)', signature = null, orderId = null, amountToPay = totalAmount) => {
    try {
      const res = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          slotId,
          facilityId,
          facilityName,
          userEmail: user.email,
          amount: amountToPay,
          duration,
          paymentMethod
        })
      });

      const result = await res.json();
      if (result.success && result.booking) {
        localStorage.removeItem('excuseme_checkout');
        navigate(`/confirmation?bookingId=${result.booking.bookingId}`);
      } else {
        alert('Payment verification failed: ' + (result.message || 'Error'));
      }
    } catch (err) {
      console.error('Finalize booking error:', err);
      alert('Connection error during payment confirmation.');
    }
  };

  const handlePassBooking = async () => {
    const passPaymentId = `pass_${activePass._id || Date.now()}`;
    await finalizeBooking(passPaymentId, 'ExcuseME PLUS Pass', null, null, 0);
  };

  const handleRazorpayPay = async (e) => {
    e.preventDefault();

    if (typeof window.Razorpay === 'undefined') {
      alert('Razorpay SDK unavailable. Opening local payment simulator...');
      setIsSimulatorOpen(true);
      return;
    }

    try {
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: totalAmount,
          slotId,
          facilityName,
          duration
        })
      });

      const orderData = await orderRes.json();

      const options = {
        key: orderData.keyId || 'rzp_test_TAyTdm1bjJolB1',
        amount: orderData.amount || Math.round(totalAmount * 100),
        currency: orderData.currency || 'INR',
        name: 'ExcuseME Parking',
        description: `Slot ${slotId} - ${facilityName}`,
        order_id: orderData.orderId,
        handler: function (response) {
          alert(`Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
          finalizeBooking(response.razorpay_payment_id, 'Razorpay Checkout', response.razorpay_signature, response.razorpay_order_id);
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
    const simPaymentId = `sim_${Date.now()}`;
    setIsSimulatorOpen(false);
    alert(`Simulated Payment Authorized Successfully!\nPayment ID: ${simPaymentId}`);
    await finalizeBooking(simPaymentId, 'Local Payment Simulator');
  };

  return (
    <>
      <Navbar />
      <main className="container" style={{ maxWidth: '640px' }}>
        <h2>Secure Booking Checkout</h2>
        <p className="subtitle">Review your slot reservation details and complete payment</p>

        {/* ExcuseME PLUS Active Pass Banner */}
        {activePass && (
          <div className="info-box" style={{ borderColor: '#10b981', backgroundColor: '#f0fdf4', marginBottom: '24px' }}>
            <h4 style={{ color: '#047857', marginTop: 0, marginBottom: '6px' }}>
              Covered by your ExcuseME PLUS pass!
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#065f46' }}>
              You have an active <strong>{activePass.planName}</strong> for <strong>{facilityName}</strong>. Zero per-booking fee required!
            </p>
          </div>
        )}

        <div className="info-box" style={{ marginTop: 0 }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Reservation Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Location</span>
              <strong id="summary-facility">{facilityName}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Reserved Slot</span>
              <strong id="summary-slot" style={{ color: 'var(--primary-blue)', fontSize: '16px' }}>{slotId}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Booking Date</span>
              <strong id="summary-date">{currentDate}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
              <strong id="summary-duration">{duration} hours</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Rate</span>
              <strong id="summary-rate">
                {activePass ? <s style={{ opacity: 0.6 }}>Rs. {ratePerHour} / hr</s> : `Rs. ${ratePerHour} / hr`}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>Total Payable</span>
              <strong id="summary-total" style={{ color: activePass ? '#10b981' : 'var(--text-primary)', fontSize: '20px' }}>
                {activePass ? 'Rs. 0 (Covered by Pass)' : `Rs. ${totalAmount}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activePass ? (
            <button
              type="button"
              id="pass-booking-button"
              className="btn"
              style={{ padding: '14px', fontSize: '16px', backgroundColor: '#10b981' }}
              onClick={handlePassBooking}
            >
              🎫 Confirm Booking with ExcuseME PLUS Pass (Rs. 0)
            </button>
          ) : (
            <>
              <button
                type="button"
                id="rzp-button"
                className="btn"
                style={{ padding: '14px', fontSize: '16px', backgroundColor: '#2563eb' }}
                onClick={handleRazorpayPay}
              >
                💳 Pay Rs. {totalAmount} with Razorpay (Test Mode)
              </button>

              <button
                type="button"
                id="sim-button"
                className="btn btn-secondary"
                style={{ padding: '10px', fontSize: '13px' }}
                onClick={() => setIsSimulatorOpen(true)}
              >
                ⚙️ Use Offline Payment Simulator
              </button>

              <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px' }}>
                💡 Frequent Parker? <Link to="/excuseme-plus" style={{ color: '#2563eb', fontWeight: 600 }}>Get an ExcuseME PLUS Pass</Link> to skip daily fees!
              </div>
            </>
          )}
        </div>
      </main>

      {/* Simulator Modal */}
      <Modal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} maxWidth={480}>
        <h3>Offline Payment Gateway Simulator</h3>
        <p className="subtitle" style={{ fontSize: '13px', marginBottom: '16px' }}>Simulate a successful payment for testing</p>

        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <div><strong>Location:</strong> <span id="modal-facility">{facilityName}</span></div>
          <div><strong>Slot:</strong> <span id="modal-slot">{slotId}</span></div>
          <div><strong>Amount Due:</strong> <strong id="modal-total" style={{ color: 'var(--primary-blue)' }}>Rs. {totalAmount}</strong></div>
        </div>

        <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" id="modal-cancel-btn" onClick={() => setIsSimulatorOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn" id="modal-submit-btn" onClick={handleSimulatorSubmit}>
            Authorize Simulated Payment
          </button>
        </div>
      </Modal>

      <Footer />
    </>
  );
};

export default PaymentPage;
