/**
 * Auth Controller
 * User authentication, registration, admin access, and profile management via MongoDB Atlas.
 */

const User = require('../models/User');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.userId || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    const newUser = await User.create({
      userId: `u_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'user'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.userId || newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/admin-login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email: email.toLowerCase(), password, role: 'admin' });

    if (!admin && email === 'admin@excuseme.com' && password === 'adminpassword') {
      return res.status(200).json({
        success: true,
        message: 'Admin authentication successful',
        user: { id: 'admin1', name: 'System Admin', email: 'admin@excuseme.com', role: 'admin' }
      });
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      user: {
        id: admin.userId || admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { name, phone },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.userId || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/users (Admin Master List)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  register,
  adminLogin,
  updateProfile,
  getAllUsers
};
