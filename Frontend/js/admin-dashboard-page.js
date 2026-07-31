/**
 * Admin Dashboard Page Controller
 * Enforces admin JWT auth gating, renders live computed database stats, master users list (without passwords), locations CRUD, and master bookings.
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
    const stats = await Storage.getAdminDashboardStats();
    if (stats) {
      if (statRevenue) statRevenue.textContent = `Rs. ${stats.totalRevenue}`;
      if (statBookings) statBookings.textContent = stats.totalBookings;
      if (statUsers) statUsers.textContent = stats.totalUsers;
      if (statFacilities) statFacilities.textContent = stats.totalLocations;
    }
  }

  async function renderFacilities() {
    if (!facTableBody) return;
    const facilities = await Storage.getFacilities();
    facTableBody.innerHTML = '';

    facilities.forEach(f => {
      const facId = f.facilityId || f._id || f.id;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${facId}</code></td>
        <td><strong>${f.name}</strong></td>
        <td>${f.address || f.location}</td>
        <td><span class="badge badge-info">${f.totalSlots || 20} Slots</span></td>
        <td><strong>Rs. ${f.pricePerHour || f.ratePerHour}</strong> / hr</td>
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
      if (b.status === 'cancelled') badgeClass = 'badge-danger';
      if (b.status === 'completed') badgeClass = 'badge-info';

      const uEmail = b.userEmail || (b.user ? b.user.email : 'user@example.com');
      const locName = b.locationName || (b.location ? b.location.name : 'City Mall Parking');
      const sNum = b.slotNumber || b.slotId;

      tr.innerHTML = `
        <td><strong>${b.bookingId}</strong></td>
        <td>${uEmail}</td>
        <td>${locName}</td>
        <td><strong style="color: var(--primary-blue);">${sNum}</strong></td>
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

    if (users.length === 0) {
      userTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No registered users found.</td></tr>`;
      return;
    }

    users.forEach(u => {
      const uId = u._id || u.userId || u.id;
      const regDate = u.registrationDate ? new Date(u.registrationDate).toLocaleDateString() : 'N/A';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${uId}</code></td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone || 'N/A'}</td>
        <td><span style="font-size:12px; color: var(--text-secondary);">${regDate}</span></td>
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
      const address = document.getElementById('fac-location').value.trim();
      const slots = document.getElementById('fac-slots').value.trim();
      const rate = document.getElementById('fac-rate').value.trim();

      if (!name || !address) {
        alert('Please fill out all facility fields.');
        return;
      }

      const res = await Storage.addFacility({
        name,
        address,
        totalSlots: slots,
        pricePerHour: rate
      });

      closeFacilityModal();

      if (res.success) {
        alert(`New location "${name}" created with 20 slots in MongoDB Atlas!`);
        await updateDashboardStats();
        await renderFacilities();
      } else {
        alert(res.message || 'Error creating location.');
      }
    });
  }

  // Initial Data Fetching
  await updateDashboardStats();
  await renderFacilities();
  await renderMasterBookings();
  await renderUsers();
});
