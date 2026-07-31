/**
 * DataStore Model & Memory Database Fallback
 * Provides fast, zero-timeout operations when MongoDB Atlas connection is unwhitelisted/offline.
 */

const bcrypt = require('bcryptjs');

// Pre-hashed default user (password: 'password123')
const defaultHashedPassword = bcrypt.hashSync('password123', 10);

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

const admins = [];

const facilities = [
  { _id: 'f1', facilityId: 'f1', name: 'City Mall Parking', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 20, ratePerHour: 20 },
  { _id: 'f2', facilityId: 'f2', name: 'Railway Station Parking', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 15, ratePerHour: 15 },
  { _id: 'f3', facilityId: 'f3', name: 'ADTU Campus Parking', address: 'Sonapur, Assam', totalSlots: 20, pricePerHour: 10, ratePerHour: 10 },
  { _id: 'f4', facilityId: 'f4', name: 'GS Road Parking Complex', address: 'Guwahati, Assam', totalSlots: 20, pricePerHour: 25, ratePerHour: 25 }
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
  findUserByEmail,
  createUser,
  resetUserPasswordInMemory
};
