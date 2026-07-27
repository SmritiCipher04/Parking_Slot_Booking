/**
 * History Page Controller
 * Displays user bookings from MongoDB Atlas, supports inline cancellation and extension via Express API.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  const tableBody = document.querySelector('#bookings-table tbody');
  
  const extendModal = document.getElementById('extend-modal');
  const extendCloseBtn = document.getElementById('extend-close-btn');
  const extendCancelBtn = document.getElementById('extend-cancel-btn');
  const extendConfirmBtn = document.getElementById('extend-confirm-btn');
  const extendHoursInput = document.getElementById('extend-hours');
  const extendBookingIdEl = document.getElementById('extend-booking-id');
  const extendSlotEl = document.getElementById('extend-slot');
  const extendFacilityEl = document.getElementById('extend-facility');
  const extendCostEl = document.getElementById('extend-cost');

  let activeExtendBooking = null;

  async function renderBookings() {
    if (!tableBody) return;
    const bookings = await Storage.getBookings(user.email);
    tableBody.innerHTML = '';

    if (bookings.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-secondary);">No parking bookings found. <a href="slots.html">Book a slot now</a></td></tr>`;
      return;
    }

    bookings.forEach(b => {
      const tr = document.createElement('tr');
      
      let badgeClass = 'badge-success';
      if (b.status === 'Cancelled') badgeClass = 'badge-danger';
      if (b.status === 'Completed') badgeClass = 'badge-info';

      const isUpcoming = (b.status === 'Upcoming');

      tr.innerHTML = `
        <td><strong>${b.bookingId}</strong></td>
        <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">PIN-${b.pin || '8492'}</code></td>
        <td>${b.facilityName}</td>
        <td><strong style="color: var(--primary-blue);">${b.slotId}</strong></td>
        <td>${b.date}</td>
        <td>${b.durationHours} hrs</td>
        <td><strong>Rs. ${b.amountPaid}</strong></td>
        <td><span class="badge ${badgeClass}">${b.status}</span></td>
        <td>
          ${isUpcoming ? `
            <button class="btn btn-sm extend-btn" data-id="${b.bookingId}">➕ Extend</button>
            <button class="btn btn-sm btn-danger cancel-btn" data-id="${b.bookingId}">❌ Cancel</button>
          ` : `<span style="color: var(--text-muted); font-size:12px;">No Actions</span>`}
        </td>
      `;

      tableBody.appendChild(tr);
    });

    attachActionListeners();
  }

  function attachActionListeners() {
    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm(`Are you sure you want to cancel booking ${id}? Your reserved slot will be freed in MongoDB Atlas.`)) {
          const res = await Storage.cancelBooking(id);
          if (res.success) {
            alert(`Booking ${id} has been cancelled successfully.`);
            await renderBookings();
          } else {
            alert(res.message || 'Cancellation failed');
          }
        }
      });
    });

    document.querySelectorAll('.extend-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const bookings = await Storage.getBookings(user.email);
        activeExtendBooking = bookings.find(b => b.bookingId === id);

        if (activeExtendBooking && extendModal) {
          if (extendBookingIdEl) extendBookingIdEl.textContent = activeExtendBooking.bookingId;
          if (extendSlotEl) extendSlotEl.textContent = activeExtendBooking.slotId;
          if (extendFacilityEl) extendFacilityEl.textContent = activeExtendBooking.facilityName;
          updateExtendCost();
          extendModal.classList.add('active');
        }
      });
    });
  }

  function updateExtendCost() {
    if (!activeExtendBooking || !extendHoursInput || !extendCostEl) return;
    const hours = parseInt(extendHoursInput.value) || 1;
    const cost = hours * (activeExtendBooking.ratePerHour || 20);
    extendCostEl.textContent = `Rs. ${cost}`;
  }

  if (extendHoursInput) {
    extendHoursInput.addEventListener('input', updateExtendCost);
  }

  function closeExtendModal() {
    if (extendModal) extendModal.classList.remove('active');
    activeExtendBooking = null;
  }

  if (extendCloseBtn) extendCloseBtn.onclick = closeExtendModal;
  if (extendCancelBtn) extendCancelBtn.onclick = closeExtendModal;

  if (extendConfirmBtn) {
    extendConfirmBtn.addEventListener('click', async () => {
      if (!activeExtendBooking || !extendHoursInput) return;
      const hours = parseInt(extendHoursInput.value) || 1;

      const res = await Storage.extendBooking(activeExtendBooking.bookingId, hours);
      closeExtendModal();

      if (res.success) {
        alert(`Booking extended by ${hours} hours! Saved to MongoDB Atlas.`);
        await renderBookings();
      } else {
        alert(res.message || 'Extension failed.');
      }
    });
  }

  renderBookings();
});
