/**
 * DataStore Model
 * Centralized data management for parking facilities, slots, bookings, users, and transactions.
 * Includes at least 20 slots per facility location.
 */

const facilities = [
  { id: 'f1', name: 'City Mall Parking', location: 'Guwahati', availableSlots: 15, ratePerHour: 20 },
  { id: 'f2', name: 'Railway Station Parking', location: 'Guwahati', availableSlots: 14, ratePerHour: 15 },
  { id: 'f3', name: 'ADTU Campus Parking', location: 'Sonapur', availableSlots: 18, ratePerHour: 10 },
  { id: 'f4', name: 'GS Road Parking Complex', location: 'Guwahati', availableSlots: 16, ratePerHour: 25 }
];

const generate20Slots = (facilityId, price, bookedIndexes = []) => {
  const letters = ['A', 'B', 'C', 'D'];
  const slotsArr = [];
  let index = 1;

  letters.forEach(letter => {
    for (let num = 1; num <= 5; num++) {
      const slotId = `${letter}${num}`;
      const isBooked = bookedIndexes.includes(index);
      slotsArr.push({
        id: slotId,
        facilityId: facilityId,
        status: isBooked ? 'booked' : 'available',
        price: price
      });
      index++;
    }
  });

  return slotsArr;
};

const slots = [
  ...generate20Slots('f1', 20, [2, 6, 9, 12, 17]),
  ...generate20Slots('f2', 15, [1, 4, 8, 11, 15, 19]),
  ...generate20Slots('f3', 10, [5, 14]),
  ...generate20Slots('f4', 25, [3, 7, 10, 18])
];

const bookings = [
  {
    bookingId: 'BK1001',
    userEmail: 'smriti@example.com',
    facilityName: 'City Mall Parking',
    slotNumber: 'A4',
    date: '2026-07-08',
    durationHours: 2,
    amountPaid: 40,
    paymentStatus: 'COMPLETED',
    paymentId: 'pay_demo123456789',
    createdAt: new Date('2026-07-08T10:00:00')
  }
];

const users = [
  { id: 'u1', name: 'Smriti Sarkar', email: 'smriti@example.com', password: 'password123', role: 'user' },
  { id: 'admin1', name: 'Admin', email: 'admin@excuseme.com', password: 'adminpassword', role: 'admin' }
];

module.exports = {
  facilities,
  slots,
  bookings,
  users
};
