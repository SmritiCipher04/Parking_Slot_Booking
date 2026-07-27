/**
 * Admin Dashboard Page Controller
 * Renders master statistics, user account lists, bookings, and location management via MongoDB Atlas.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Gate page to logged-in admin only
  const admin = Auth.requireAdminAuth();
  if (!admin) return;

  const adminLogoutBtn = document.getElementById('admin-logout-btn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      Auth.adminLogout();
    });
  }

  const statRevenue = document.getElementById('stat-revenue');
  const statBookings = document.getElementById('stat-bookings');
  const statUsers = document.getElementById('stat-users');
  const statFacilities = document.getElementById('stat-facilities');

  const facTableBody = document.querySelector('#admin-facilities-table tbody');
  const bookingTableBody = document.querySelector('#admin-bookings-table tbody');
  const userTableBody = document.querySelector('#admin-users-table tbody');

  const facModal = document.getElementById('facility-modal');
  const addLocationBtn = document.getElementById('add-location-btn');
  const facModalCloseBtn = document.getElementById('fac-modal-close-btn');
  const facModalCancelBtn = document.getElementById('fac-modal-cancel-btn');
  const saveFacilityBtn = document.getElementById('save-facility-btn');

  async function updateDashboardStats() {
    const bookings = await Storage.getBookings();
    const users = await Storage.getUsers();
    const facilities = await Storage.getFacilities();

    const revenue = bookings
      .filter(b => b.status !== 'Cancelled')
      .reduce((sum, b) => sum + (b.amountPaid || 0), 0);

    if (statRevenue) statRevenue.textContent = `Rs. ${revenue}`;
    if (statBookings) statBookings.textContent = bookings.length;
    if (statUsers) statUsers.textContent = users.length;
    if (statFacilities) statFacilities.textContent = facilities.length;
  }

  async function renderFacilities() {
    if (!facTableBody) return;
    const facilities = await Storage.getFacilities();
    facTableBody.innerHTML = '';

    facilities.forEach(f => {
      const facId = f.facilityId || f.id;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${facId}</code></td>
        <td><strong>${f.name}</strong></td>
        <td>${f.location}</td>
        <td><span class="badge badge-info">${f.totalSlots || 20} Slots</span></td>
        <td><strong>Rs. ${f.ratePerHour}</strong> / hr</td>
      `;
      facTableBody.appendChild(tr);
    });
  }

  async function renderMasterBookings() {
    if (!bookingTableBody) return;
    const bookings = await Storage.getBookings();
    bookingTableBody.innerHTML = '';

    if (bookings.length === 0) {
      bookingTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-secondary);">No bookings recorded in MongoDB Atlas.</td></tr>`;
      return;
    }

    bookings.forEach(b => {
      const tr = document.createElement('tr');
      let badgeClass = 'badge-success';
      if (b.status === 'Cancelled') badgeClass = 'badge-danger';
      if (b.status === 'Completed') badgeClass = 'badge-info';

      tr.innerHTML = `
        <td><strong>${b.bookingId}</strong></td>
        <td>${b.userEmail}</td>
        <td>${b.facilityName}</td>
        <td><strong style="color: var(--primary-blue);">${b.slotId}</strong></td>
        <td>${b.date}</td>
        <td>${b.durationHours} hrs</td>
        <td><strong>Rs. ${b.amountPaid}</strong></td>
        <td><span class="badge ${badgeClass}">${b.status}</span></td>
      `;
      bookingTableBody.appendChild(tr);
    });
  }

  async function renderUsers() {
    if (!userTableBody) return;
    const users = await Storage.getUsers();
    userTableBody.innerHTML = '';

    users.forEach(u => {
      const uId = u.userId || u.id || u._id;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${uId}</code></td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || 'N/A'}</td>
        <td><span class="badge badge-info">${u.role || 'user'}</span></td>
      `;
      userTableBody.appendChild(tr);
    });
  }

  function openFacilityModal() {
    if (facModal) facModal.classList.add('active');
  }

  function closeFacilityModal() {
    if (facModal) facModal.classList.remove('active');
  }

  if (addLocationBtn) addLocationBtn.onclick = openFacilityModal;
  if (facModalCloseBtn) facModalCloseBtn.onclick = closeFacilityModal;
  if (facModalCancelBtn) facModalCancelBtn.onclick = closeFacilityModal;

  if (saveFacilityBtn) {
    saveFacilityBtn.addEventListener('click', async () => {
      const name = document.getElementById('fac-name').value.trim();
      const location = document.getElementById('fac-location').value.trim();
      const slots = document.getElementById('fac-slots').value.trim();
      const rate = document.getElementById('fac-rate').value.trim();

      if (!name || !location) {
        alert('Please fill out all facility fields.');
        return;
      }

      const res = await Storage.addFacility({
        name,
        location,
        totalSlots: slots,
        ratePerHour: rate
      });

      closeFacilityModal();

      if (res.success) {
        alert(`New facility "${name}" saved to MongoDB Atlas with 20 slots!`);
        await updateDashboardStats();
        await renderFacilities();
      } else {
        alert(res.message || 'Error saving facility.');
      }
    });
  }

  // Initial Load
  await updateDashboardStats();
  await renderFacilities();
  await renderMasterBookings();
  await renderUsers();
});
