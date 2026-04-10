import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validate as validateEmail } from 'deep-email-validator';
import { getUserByEmail, saveUser, updateUser, deleteUser } from '../services/datasetService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_safe_route_key_2024';


// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Please provide name, email, and password.' });
    }

    // Deep, actual SMTP validation to ensure the mailbox is original and real
    const validationResult = await validateEmail({
      email: email,
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: true,
    });

    if (!validationResult.valid) {
       // Extract human readable reason
       const reason = validationResult.validators[validationResult.reason]?.reason || 'Email is unreachable or does not exist.';
       return res.status(400).json({ error: `Invalid email: ${reason}` });
    }

    // Check dataset if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to dataset
    const newUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    await saveUser(newUser);

    // Issue token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // Check if user exists in dataset
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Issue token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me - Verify token
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await getUserByEmail(decoded.email);
    
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    
    res.json({
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid.' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const updates = req.body;
    
    const updatedUser = await updateUser(decoded.email, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found in dataset.' });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        emergencyContact: updatedUser.emergencyContact
      }
    });

  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error during profile update.' });
  }
});

// DELETE /api/auth/profile - Permanently delete user
router.delete('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const wasDeleted = await deleteUser(decoded.email);
    if (!wasDeleted) {
      return res.status(404).json({ error: 'User not found or already deleted.' });
    }
    
    res.json({ message: 'Profile deleted successfully.' });
  } catch (err) {
    console.error('Profile deletion error:', err);
    res.status(500).json({ error: 'Server error during profile deletion.' });
  }
});

export default router;
