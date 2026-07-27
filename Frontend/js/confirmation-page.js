/**
 * Confirmation Page Controller
 * Reads booking details from MongoDB Atlas database and displays confirmation receipt.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');

  const userBookings = await Storage.getBookings(user.email);
  let booking = null;

  if (bookingId) {
    booking = userBookings.find(b => b.bookingId === bookingId);
  }

  if (!booking && userBookings.length > 0) {
    booking = userBookings[0];
  }

  if (booking) {
    const pinEl = document.getElementById('conf-pin');
    const idEl = document.getElementById('conf-booking-id');
    const facilityEl = document.getElementById('conf-facility');
    const slotEl = document.getElementById('conf-slot');
    const dateEl = document.getElementById('conf-date');
    const durationEl = document.getElementById('conf-duration');
    const amountEl = document.getElementById('conf-amount');

    if (pinEl) pinEl.textContent = `PIN-${booking.pin || '8492'}`;
    if (idEl) idEl.textContent = booking.bookingId;
    if (facilityEl) facilityEl.textContent = booking.facilityName;
    if (slotEl) slotEl.textContent = booking.slotId;
    if (dateEl) dateEl.textContent = booking.date;
    if (durationEl) durationEl.textContent = `${booking.durationHours} hours`;
    if (amountEl) amountEl.textContent = `Rs. ${booking.amountPaid}`;
  }
});
