/**
 * Payment Page Controller
 * Handles payment verification and persists completed Bookings and Transactions directly into MongoDB Atlas via Express API.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  let checkoutData = null;
  try {
    checkoutData = JSON.parse(localStorage.getItem('excuseme_checkout'));
  } catch (e) {}

  const urlParams = new URLSearchParams(window.location.search);
  const facilityId = urlParams.get('facilityId') || (checkoutData ? checkoutData.facilityId : 'f1');
  const slotId = urlParams.get('slot') || (checkoutData ? checkoutData.slotId : 'A4');
  const duration = parseInt(urlParams.get('duration')) || (checkoutData ? checkoutData.durationHours : 2);

  const facilities = await Storage.getFacilities();
  const facility = facilities.find(f => (f.facilityId || f.id) === facilityId) || facilities[0];
  const ratePerHour = facility ? facility.ratePerHour : 20;
  const totalAmount = duration * ratePerHour;
  const facilityName = facility ? facility.name : 'City Mall Parking';
  const currentDate = new Date().toISOString().split('T')[0];

  const summaryFacility = document.getElementById('summary-facility');
  const summarySlot = document.getElementById('summary-slot');
  const summaryDate = document.getElementById('summary-date');
  const summaryDuration = document.getElementById('summary-duration');
  const summaryRate = document.getElementById('summary-rate');
  const summaryTotal = document.getElementById('summary-total');

  if (summaryFacility) summaryFacility.textContent = facilityName;
  if (summarySlot) summarySlot.textContent = slotId;
  if (summaryDate) summaryDate.textContent = currentDate;
  if (summaryDuration) summaryDuration.textContent = `${duration} hours`;
  if (summaryRate) summaryRate.textContent = `Rs. ${ratePerHour} / hour`;
  if (summaryTotal) summaryTotal.textContent = `Rs. ${totalAmount}`;

  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const submitModalBtn = document.getElementById('modal-submit-btn');
  const simButton = document.getElementById('sim-button');
  const rzpButton = document.getElementById('rzp-button');

  const modalFacility = document.getElementById('modal-facility');
  const modalSlot = document.getElementById('modal-slot');
  const modalTotal = document.getElementById('modal-total');

  if (modalFacility) modalFacility.textContent = facilityName;
  if (modalSlot) modalSlot.textContent = slotId;
  if (modalTotal) modalTotal.textContent = `Rs. ${totalAmount}`;

  function showSimulator() {
    if (modal) modal.classList.add('active');
  }

  function closeSimulator() {
    if (modal) modal.classList.remove('active');
  }

  if (closeBtn) closeBtn.onclick = closeSimulator;
  if (cancelBtn) cancelBtn.onclick = closeSimulator;
  if (simButton) simButton.onclick = showSimulator;

  // Process Booking Completion via Express API -> MongoDB Atlas
  async function finalizeBooking(paymentId, paymentMethod = 'Razorpay (Card)', signature = null, orderId = null) {
    try {
      const response = await fetch(`${window.API_BASE_URL || '/api'}/payment/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
          slotId: slotId,
          facilityId: facilityId,
          facilityName: facilityName,
          userEmail: user.email,
          amount: totalAmount,
          duration: duration,
          paymentMethod: paymentMethod
        })
      });

      const result = await response.json();

      if (result.success && result.booking) {
        localStorage.removeItem('excuseme_checkout');
        window.location.href = `confirmation.html?bookingId=${result.booking.bookingId}`;
      } else {
        alert('Payment verification failed: ' + (result.message || 'Error'));
      }
    } catch (err) {
      console.error('Finalize booking error:', err);
      alert('Connection error during payment confirmation.');
    }
  }

  if (rzpButton) {
    rzpButton.textContent = `💳 Pay Rs. ${totalAmount} with Razorpay (Test Mode)`;
    rzpButton.addEventListener('click', async (e) => {
      e.preventDefault();

      if (typeof Razorpay === 'undefined') {
        alert('Razorpay SDK script unavailable. Redirecting to offline simulator...');
        showSimulator();
        return;
      }

      try {
        const orderRes = await fetch(`${window.API_BASE_URL || '/api'}/payment/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            slotId: slotId,
            facilityName: facilityName,
            duration: duration
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

        const rzp = new Razorpay(options);
        rzp.open();
      } catch (err) {
        console.warn('Razorpay order error, opening simulator:', err);
        showSimulator();
      }
    });
  }

  if (submitModalBtn) {
    submitModalBtn.addEventListener('click', async () => {
      const simPaymentId = `sim_${Date.now()}`;
      closeSimulator();
      alert(`Simulated Payment Authorized Successfully!\nPayment ID: ${simPaymentId}`);
      await finalizeBooking(simPaymentId, 'Local Payment Simulator');
    });
  }
});
