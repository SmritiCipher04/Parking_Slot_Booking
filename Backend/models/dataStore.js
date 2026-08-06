/**
 * DataStore Model & Memory Database Fallback
 * Provides fast, zero-timeout operations when MongoDB Atlas connection is unwhitelisted/offline.
 */

const bcrypt = require('bcryptjs');

// Pre-hashed default user (password: 'password123')
const defaultHashedPassword = bcrypt.hashSync('password123', 10);
// Pre-hashed default admin (username: 'admin@example.com', password: '54321')
const defaultAdminHashedPassword = bcrypt.hashSync('54321', 10);

const users = [
  {
    _id: 'u1',
    name: 'Smriti Sarkar',
    email: 'smriti@example.com',
    phone: '9876543210',
    password: defaultHashedPassword,
    registrationDate: new Date('2026-01-01')
  }
];

const admins = [
  {
    _id: 'a1',
    username: 'admin@example.com',
    password: defaultAdminHashedPassword,
    createdAt: new Date('2026-01-01')
  }
];

const facilities = [
  { _id: 'f1', facilityId: 'f1', name: 'City Mall Parking', address: 'GS Road, Christian Basti, Guwahati', totalSlots: 20, pricePerHour: 20, ratePerHour: 20, latitude: 26.1445, longitude: 91.7362 },
  { _id: 'f2', facilityId: 'f2', name: 'Railway Station Parking', address: 'Paltan Bazar, Guwahati', totalSlots: 20, pricePerHour: 15, ratePerHour: 15, latitude: 26.1818, longitude: 91.7510 },
  { _id: 'f3', facilityId: 'f3', name: 'ADTU Campus Parking', address: 'Sonapur, Guwahati, Assam', totalSlots: 20, pricePerHour: 10, ratePerHour: 10, latitude: 26.1158, longitude: 91.9790 },
  { _id: 'f4', facilityId: 'f4', name: 'GS Road Parking Complex', address: 'Bhangagarh, Guwahati', totalSlots: 20, pricePerHour: 25, ratePerHour: 25, latitude: 26.1550, longitude: 91.7650 }
];

const generate20Slots = (facilityId, price, bookedIndexes = []) => {
  const letters = ['A', 'B', 'C', 'D'];
  const slotsArr = [];
  let index = 1;

  letters.forEach(letter => {
    for (let num = 1; num <= 5; num++) {
      const slotNumber = `${letter}${num}`;
      const isBooked = bookedIndexes.includes(index);
      slotsArr.push({
        _id: `slot_${facilityId}_${slotNumber}`,
        slotId: slotNumber,
        slotNumber: slotNumber,
        location: facilityId,
        facilityId: facilityId,
        status: isBooked ? 'occupied' : 'available',
        occupiedUntil: isBooked ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null,
        price: price
      });
      index++;
    }
  });

  return slotsArr;
};

const slots = [
  ...generate20Slots('f1', 20, [2, 6, 12, 17]),
  ...generate20Slots('f2', 15, [1, 4, 8, 15]),
  ...generate20Slots('f3', 10, [5, 14]),
  ...generate20Slots('f4', 25, [3, 7, 10])
];

const bookings = [];
const transactions = [];
const deletedAccountLogs = [];

const subscriptionPlans = [
  { _id: 'sp1', name: 'City Mall Weekly Pass', type: 'weekly', durationDays: 7, price: 99, savingsPercentage: 30, facilityId: 'f1', locationName: 'City Mall Parking', isActive: true },
  { _id: 'sp2', name: 'City Mall Monthly Pass', type: 'monthly', durationDays: 30, price: 349, savingsPercentage: 40, facilityId: 'f1', locationName: 'City Mall Parking', isActive: true }
];

const userSubscriptions = [];

// Helper functions for memory fallback
const findUserByEmail = async (email) => {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

const createUser = async ({ name, email, phone, password }) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = {
    _id: `u_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    registrationDate: new Date()
  };
  users.push(newUser);
  return newUser;
};

const resetUserPasswordInMemory = async (email, phone, newPassword) => {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.phone.trim() === phone.trim());
  if (!user) return false;
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  return true;
};

module.exports = {
  users,
  admins,
  facilities,
  slots,
  bookings,
  transactions,
  deletedAccountLogs,
  subscriptionPlans,
  userSubscriptions,
  findUserByEmail,
  createUser,
  resetUserPasswordInMemory
};
