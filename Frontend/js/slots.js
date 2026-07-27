/**
 * Slots Controller
 * Binds parking location selection dropdown and 20-slot grid per facility from Backend API.
 */

document.addEventListener('DOMContentLoaded', () => {
  const facilitySelect = document.getElementById('facility-select');
  const facilityTitle = document.getElementById('facility-title');
  const facilityDisplay = document.getElementById('selected-facility-display');
  const priceDisplay = document.getElementById('selected-price-display');
  const slotGrid = document.getElementById('slot-grid') || document.querySelector('.slot-grid');
  const slotDisplay = document.getElementById('selected-slot-display');
  const submitBtn = document.getElementById('submit-btn');
  const durationInput = document.getElementById('duration');
  const form = document.getElementById('booking-form') || document.querySelector('form');

  let currentFacility = null;
  let selectedSlot = null;
  let allFacilities = [];

  const defaultStaticFacilities = [
    { id: 'f1', name: 'City Mall Parking', location: 'Guwahati', ratePerHour: 20 },
    { id: 'f2', name: 'Railway Station Parking', location: 'Guwahati', ratePerHour: 15 },
    { id: 'f3', name: 'ADTU Campus Parking', location: 'Sonapur', ratePerHour: 10 },
    { id: 'f4', name: 'GS Road Parking Complex', location: 'Guwahati', ratePerHour: 25 }
  ];

  // Parse initial facility ID from URL parameter (if user arrived from search)
  const urlParams = new URLSearchParams(window.location.search);
  let targetFacilityId = urlParams.get('facilityId') || urlParams.get('facility') || 'f1';

  async function initFacilities() {
    try {
      const response = await fetch(`${window.API_BASE_URL}/slots/facilities`);
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        allFacilities = result.data;
      } else {
        allFacilities = defaultStaticFacilities;
      }
    } catch (err) {
      console.warn('Could not fetch facilities list from server, using fallback list:', err);
      allFacilities = defaultStaticFacilities;
    }

    populateFacilityDropdown();
  }

  function populateFacilityDropdown() {
    if (!facilitySelect) return;

    facilitySelect.innerHTML = '';
    allFacilities.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = `${f.name} - ${f.location} (Rs. ${f.ratePerHour}/hr)`;
      if (f.id === targetFacilityId) opt.selected = true;
      facilitySelect.appendChild(opt);
    });

    // Load initial facility slots
    const initialFac = allFacilities.find(f => f.id === facilitySelect.value) || allFacilities[0];
    loadFacility(initialFac);
  }

  if (facilitySelect) {
    facilitySelect.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const targetFac = allFacilities.find(f => f.id === selectedId) || defaultStaticFacilities[0];
      loadFacility(targetFac);
    });
  }

  function loadFacility(facility) {
    currentFacility = facility;
    selectedSlot = null;

    if (slotDisplay) slotDisplay.textContent = 'None';
    if (submitBtn) submitBtn.disabled = true;

    if (facilityTitle) facilityTitle.textContent = `${facility.name} - Slot Availability (20 Slots)`;
    if (facilityDisplay) facilityDisplay.textContent = facility.name;
    if (priceDisplay) priceDisplay.textContent = `Rs. ${facility.ratePerHour} / hour`;

    fetchSlotsForFacility(facility.id, facility.ratePerHour);
  }

  async function fetchSlotsForFacility(facilityId, rate) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/slots?facilityId=${encodeURIComponent(facilityId)}`);
      const result = await response.json();

      if (result.success && result.data) {
        renderSlots(result.data);
      } else {
        generateFallback20Slots(facilityId, rate);
      }
    } catch (error) {
      console.warn('Could not fetch slots from backend API, generating 20 static slots:', error);
      generateFallback20Slots(facilityId, rate);
    }
  }

  function generateFallback20Slots(facilityId, rate) {
    const letters = ['A', 'B', 'C', 'D'];
    const fallbackSlots = [];

    letters.forEach(letter => {
      for (let num = 1; num <= 5; num++) {
        const slotId = `${letter}${num}`;
        // Mark some slots as booked for demo realism
        const isBooked = (slotId === 'A2' || slotId === 'B3' || slotId === 'C1' || slotId === 'D4');
        fallbackSlots.push({
          id: slotId,
          facilityId: facilityId,
          status: isBooked ? 'booked' : 'available',
          price: rate
        });
      }
    });

    renderSlots(fallbackSlots);
  }

  function renderSlots(slotsData) {
    if (!slotGrid) return;
    slotGrid.innerHTML = '';

    slotsData.forEach(slot => {
      const slotEl = document.createElement('div');
      slotEl.className = `slot ${slot.status}`;
      slotEl.textContent = slot.id;

      if (slot.status !== 'booked') {
        slotEl.addEventListener('click', () => selectSlot(slotEl, slot.id));
      }

      slotGrid.appendChild(slotEl);
    });
  }

  function selectSlot(element, slotId) {
    if (element.classList.contains('selected')) {
      element.classList.remove('selected');
      element.classList.add('available');
      selectedSlot = null;
      if (slotDisplay) slotDisplay.textContent = 'None';
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    document.querySelectorAll('.slot').forEach(s => {
      if (s.classList.contains('selected')) {
        s.classList.remove('selected');
        s.classList.add('available');
      }
    });

    element.classList.remove('available');
    element.classList.add('selected');
    selectedSlot = slotId;
    if (slotDisplay) slotDisplay.textContent = slotId;
    if (submitBtn) submitBtn.disabled = false;
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!selectedSlot || !currentFacility) return;

      const duration = durationInput ? durationInput.value : '2';

      // Persist selection details
      localStorage.setItem('selectedSlot', selectedSlot);
      localStorage.setItem('facilityId', currentFacility.id);
      localStorage.setItem('facilityName', currentFacility.name);
      localStorage.setItem('ratePerHour', currentFacility.ratePerHour);
      localStorage.setItem('bookingDuration', duration);

      // Navigate to payment page with details in query params
      const redirectUrl = `payment.html?slot=${encodeURIComponent(selectedSlot)}&facility=${encodeURIComponent(currentFacility.name)}&rate=${encodeURIComponent(currentFacility.ratePerHour)}&duration=${encodeURIComponent(duration)}`;
      window.location.href = redirectUrl;
    });
  }

  initFacilities();
});
