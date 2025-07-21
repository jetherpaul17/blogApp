const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports.register = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      username,
      password: hashed
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Registration failed', details: err.message });
  }
};

module.exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    const match = await bcrypt.compare(req.body.password, user?.password || '');
    if (!user || !match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ 
      id: user._id, 
      email: user.email, 
      isAdmin: user.isAdmin 
    }, 'inventoryManagement', { expiresIn: '1h' });
    res.status(200).json({ access: token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports.details = async (req, res) => {
  try {
    // The user info is already available from the auth middleware
    const user = await User.findById(req.user.id).select('-password'); 
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user details' });
  }
};

// Admin-only function to get all users
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ 
      message: 'Users retrieved successfully',
      users: users,
      count: users.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Admin-only function to delete any user
module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ 
      message: 'User deleted successfully',
      deletedUser: { id: deletedUser._id, email: deletedUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};