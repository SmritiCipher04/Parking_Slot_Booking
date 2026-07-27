/**
 * Home Page Controller
 * Enforces auth gating, displays personal greeting, and renders facilities from MongoDB Atlas.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  const welcomeHeading = document.getElementById('welcome-heading');
  if (welcomeHeading && user) {
    welcomeHeading.textContent = `Welcome back, ${user.name.split(' ')[0]}! Find Parking Near You`;
  }

  const dateInput = document.getElementById('search-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  const tableBody = document.querySelector('#facilities-table tbody');
  
  async function renderFacilities(filterText = '') {
    if (!tableBody) return;
    const facilities = await Storage.getFacilities();
    
    const filtered = facilities.filter(f => 
      f.name.toLowerCase().includes(filterText.toLowerCase()) ||
      f.location.toLowerCase().includes(filterText.toLowerCase())
    );

    tableBody.innerHTML = '';
    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-secondary);">No parking facilities matched your search location.</td></tr>`;
      return;
    }

    filtered.forEach(f => {
      const facId = f.facilityId || f.id;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${f.name}</strong></td>
        <td>${f.location}</td>
        <td><span class="badge badge-info">${f.totalSlots || 20} Slots</span></td>
        <td><strong>Rs. ${f.ratePerHour}</strong> / hr</td>
        <td>
          <a href="slots.html?facilityId=${facId}" class="btn btn-sm">View Slots & Book</a>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  const searchBtn = document.getElementById('search-btn');
  const locationInput = document.getElementById('search-location');

  if (searchBtn && locationInput) {
    searchBtn.addEventListener('click', () => {
      renderFacilities(locationInput.value.trim());
    });
    locationInput.addEventListener('input', () => {
      renderFacilities(locationInput.value.trim());
    });
  }

  await renderFacilities();
});
