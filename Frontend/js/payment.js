/**
 * Payment Portal Controller
 * Connects frontend payment view securely to Backend API and Razorpay Checkout SDK.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Parse URL parameters or localStorage for booking context
  const urlParams = new URLSearchParams(window.location.search);
  const slotId = urlParams.get('slot') || localStorage.getItem('selectedSlot') || 'A4';
  const duration = parseInt(urlParams.get('duration') || localStorage.getItem('bookingDuration') || '2');
  const facilityName = urlParams.get('facility') || localStorage.getItem('facilityName') || 'City Mall Parking';
  const ratePerHour = parseFloat(urlParams.get('rate') || localStorage.getItem('ratePerHour') || '20');
  const totalAmount = duration * ratePerHour;

  // Update DOM elements with booking summary
  const facilityCell = document.querySelector('table tr:nth-child(1) td');
  const slotCell = document.querySelector('table tr:nth-child(2) td');
  const dateCell = document.querySelector('table tr:nth-child(3) td');
  const durationCell = document.querySelector('table tr:nth-child(4) td');
  const rateCell = document.querySelector('table tr:nth-child(5) td');
  const amountCell = document.querySelector('table tr:nth-child(6) td strong');

  if (facilityCell) facilityCell.textContent = facilityName;
  if (slotCell) slotCell.textContent = slotId;
  if (dateCell) dateCell.textContent = new Date().toISOString().split('T')[0];
  if (durationCell) durationCell.textContent = `${duration} hours`;
  if (rateCell) rateCell.textContent = `Rs. ${ratePerHour} / hour`;
  if (amountCell) amountCell.textContent = `Rs. ${totalAmount}`;

  // Update button labels
  const rzpButton = document.getElementById('rzp-button');
  if (rzpButton) rzpButton.textContent = `Pay Rs. ${totalAmount} with Razorpay`;

  // Modal display elements
  const modalFacilityDisplay = document.querySelector('.modal-content span:nth-child(2)');
  const modalSlotDisplay = document.querySelectorAll('.modal-content span')[3];
  const modalAmountDisplay = document.querySelectorAll('.modal-content span')[5];

  // UI Modal helper elements
  const modal = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');
  const submitModalBtn = document.getElementById('modal-submit-btn');

  function showSimulator() {
    if (modal) {
      // Update modal text values before showing
      const modalSpans = modal.querySelectorAll('span');
      if (modalSpans.length >= 6) {
        modalSpans[1].textContent = facilityName;
        modalSpans[3].textContent = slotId;
        modalSpans[5].textContent = `Rs. ${totalAmount}`;
      }
      modal.classList.add('active');
    }
  }

  function closeSimulator() {
    if (modal) modal.classList.remove('active');
  }

  if (closeBtn) closeBtn.onclick = closeSimulator;
  if (cancelBtn) cancelBtn.onclick = closeSimulator;

  // Razorpay Payment Handler
  if (rzpButton) {
    rzpButton.addEventListener('click', async (e) => {
      e.preventDefault();

      try {
        rzpButton.disabled = true;
        rzpButton.textContent = 'Initializing Payment...';

        // Step 1: Request order creation from Backend (Backend uses .env keys)
        const orderResponse = await fetch(`${window.API_BASE_URL}/payment/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: totalAmount,
            slotId: slotId,
            facilityName: facilityName,
            duration: duration
          })
        });

        const orderData = await orderResponse.json();

        if (!orderData.success) {
          throw new Error(orderData.message || 'Order creation failed');
        }

        // Check if Razorpay SDK is available
        if (typeof Razorpay === 'undefined') {
          console.warn('Razorpay SDK not loaded. Launching fallback simulator...');
          showSimulator();
          return;
        }

        // Step 2: Configure Razorpay popup options
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'ExcuseME Parking',
          description: `Slot ${slotId} - ${facilityName}`,
          order_id: orderData.orderId,

          handler: async function (response) {
            // Step 3: Send verification payload to backend
            try {
              const verifyResponse = await fetch(`${window.API_BASE_URL}/payment/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  slotId: slotId,
                  facilityName: facilityName,
                  duration: duration,
                  amount: totalAmount,
                  userEmail: localStorage.getItem('userEmail') || 'smriti@example.com'
                })
              });

              const verifyResult = await verifyResponse.json();

              if (verifyResult.success) {
                alert(`Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
                window.location.href = 'confirmation.html';
              } else {
                alert('Payment verification failed: ' + verifyResult.message);
              }
            } catch (err) {
              console.error('Verification error:', err);
              window.location.href = 'confirmation.html';
            }
          },

          prefill: {
            name: 'Smriti Sarkar',
            email: localStorage.getItem('userEmail') || 'smriti@example.com',
            contact: '9999999999'
          },

          theme: {
            color: '#2c5f8a'
          }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          alert('Payment Failed: ' + response.error.description);
        });
        rzp.open();

      } catch (error) {
        console.error('Payment order creation error:', error);
        showSimulator();
      } finally {
        rzpButton.disabled = false;
        rzpButton.textContent = `Pay Rs. ${totalAmount} with Razorpay`;
      }
    });
  }

  // Simulator Fallback Button Handler
  const simButton = document.getElementById('sim-button');
  if (simButton) {
    simButton.addEventListener('click', (e) => {
      e.preventDefault();
      showSimulator();
    });
  }

  // Modal Submit Handler
  if (submitModalBtn) {
    submitModalBtn.addEventListener('click', async () => {
      const simPaymentId = `sim_${Date.now()}`;
      try {
        const verifyResponse = await fetch(`${window.API_BASE_URL}/payment/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_payment_id: simPaymentId,
            slotId: slotId,
            facilityName: facilityName,
            duration: duration,
            amount: totalAmount,
            userEmail: localStorage.getItem('userEmail') || 'smriti@example.com'
          })
        });

        const verifyResult = await verifyResponse.json();
        closeSimulator();

        if (verifyResult.success) {
          alert(`Simulated Payment Authorized!\nPayment ID: ${simPaymentId}`);
          window.location.href = 'confirmation.html';
        } else {
          alert('Simulation failed: ' + verifyResult.message);
        }
      } catch (err) {
        console.error('Simulation error:', err);
        window.location.href = 'confirmation.html';
      }
    });
  }
});
