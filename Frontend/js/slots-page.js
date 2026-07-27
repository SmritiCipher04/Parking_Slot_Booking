/**
 * Slots Page Controller
 * Handles location dropdown selection, dynamic 20-slot grid rendering, and estimated cost calculations via MongoDB Atlas.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Gate page to logged-in users only
  const user = Auth.requireAuth();
  if (!user) return;

  const facilitySelect = document.getElementById('facility-select');
  const facilityTitle = document.getElementById('facility-title');
  const facilityDisplay = document.getElementById('selected-facility-display');
  const priceDisplay = document.getElementById('selected-price-display');
  const slotGrid = document.getElementById('slot-grid');
  const slotDisplay = document.getElementById('selected-slot-display');
  const durationInput = document.getElementById('duration');
  const totalDisplay = document.getElementById('estimated-total-display');
  const submitBtn = document.getElementById('submit-btn');

  let currentFacility = null;
  let selectedSlotId = null;

  const urlParams = new URLSearchParams(window.location.search);
  let targetFacilityId = urlParams.get('facilityId') || urlParams.get('facility') || 'f1';

  async function initFacilities() {
    const facilities = await Storage.getFacilities();
    if (!facilitySelect || facilities.length === 0) return;

    facilitySelect.innerHTML = '';
    facilities.forEach(f => {
      const facId = f.facilityId || f.id;
      const opt = document.createElement('option');
      opt.value = facId;
      opt.textContent = `${f.name} - ${f.location} (Rs. ${f.ratePerHour}/hr)`;
      if (facId === targetFacilityId) opt.selected = true;
      facilitySelect.appendChild(opt);
    });

    const activeFacility = facilities.find(f => (f.facilityId || f.id) === facilitySelect.value) || facilities[0];
    await loadFacility(activeFacility);
  }

  if (facilitySelect) {
    facilitySelect.addEventListener('change', async (e) => {
      const facilities = await Storage.getFacilities();
      const target = facilities.find(f => (f.facilityId || f.id) === e.target.value) || facilities[0];
      await loadFacility(target);
    });
  }

  async function loadFacility(facility) {
    currentFacility = facility;
    selectedSlotId = null;

    if (slotDisplay) slotDisplay.textContent = 'None';
    if (submitBtn) submitBtn.disabled = true;

    if (facilityTitle) facilityTitle.textContent = `${facility.name} - Slot Layout (20 Slots)`;
    if (facilityDisplay) facilityDisplay.textContent = facility.name;
    if (priceDisplay) priceDisplay.textContent = `Rs. ${facility.ratePerHour} / hr`;

    updateTotalCost();

    const facId = facility.facilityId || facility.id;
    const slots = await Storage.getSlotsByFacility(facId);
    renderSlots(slots);
  }

  function renderSlots(slotsData) {
    if (!slotGrid) return;
    slotGrid.innerHTML = '';

    slotsData.forEach(slot => {
      const slotEl = document.createElement('div');
      const sId = slot.slotId || slot.id;
      slotEl.className = `slot ${slot.status}`;

      let statusLabel = 'Available';
      if (slot.status === 'booked') statusLabel = 'Occupied';
      if (slot.status === 'reserved') statusLabel = 'Reserved';

      slotEl.innerHTML = `
        <div>${sId}</div>
        <div class="slot-subtext">${statusLabel}</div>
      `;

      if (slot.status === 'available') {
        slotEl.addEventListener('click', () => toggleSlotSelection(slotEl, sId));
      }

      slotGrid.appendChild(slotEl);
    });
  }

  function toggleSlotSelection(element, slotId) {
    if (element.classList.contains('selected')) {
      element.classList.remove('selected');
      element.classList.add('available');
      selectedSlotId = null;
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
    selectedSlotId = slotId;

    if (slotDisplay) slotDisplay.textContent = slotId;
    if (submitBtn) submitBtn.disabled = false;
  }

  function updateTotalCost() {
    if (!currentFacility || !durationInput || !totalDisplay) return;
    const hours = parseInt(durationInput.value) || 1;
    const total = hours * currentFacility.ratePerHour;
    totalDisplay.textContent = `Rs. ${total}`;
  }

  if (durationInput) {
    durationInput.addEventListener('input', updateTotalCost);
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (!selectedSlotId || !currentFacility) return;

      const duration = parseInt(durationInput.value) || 2;
      const facId = currentFacility.facilityId || currentFacility.id;

      // Save checkout context
      const checkoutData = {
        facilityId: facId,
        facilityName: currentFacility.name,
        slotId: selectedSlotId,
        ratePerHour: currentFacility.ratePerHour,
        durationHours: duration,
        amountPaid: duration * currentFacility.ratePerHour,
        userEmail: user.email
      };

      localStorage.setItem('excuseme_checkout', JSON.stringify(checkoutData));

      // Redirect to payment.html
      window.location.href = `payment.html?facilityId=${facId}&slot=${selectedSlotId}&duration=${duration}`;
    });
  }

  await initFacilities();
});
