/**
 * Booking History Controller
 * Populates user booking history dynamically from Backend API.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.querySelector('table tbody') || document.querySelector('table');
  const userEmail = localStorage.getItem('userEmail') || 'smriti@example.com';

  try {
    const response = await fetch(`${window.API_BASE_URL}/bookings?email=${encodeURIComponent(userEmail)}`);
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0 && tableBody) {
      renderBookings(result.data);
    }
  } catch (error) {
    console.warn('Booking history API unavailable, displaying default history view:', error);
  }

  function renderBookings(bookingsList) {
    // If table has existing header row, keep header
    const rows = tableBody.querySelectorAll('tr');
    if (rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        rows[i].remove();
      }
    }

    bookingsList.forEach(b => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${b.bookingId}</td>
        <td>${b.facilityName}</td>
        <td>${b.slotNumber}</td>
        <td>${b.date}</td>
        <td>${b.durationHours} hrs</td>
        <td>Rs. ${b.amountPaid}</td>
        <td><span style="color: green; font-weight: bold;">${b.paymentStatus}</span></td>
      `;
      tableBody.appendChild(row);
    });
  }
});
