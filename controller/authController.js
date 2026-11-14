const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both email and password' });
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [
    email.toLowerCase(),
  ]);

  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'User already exists!' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
    [email.toLowerCase(), hashedPassword]
  );

  const newUser = result.rows[0];
  const token = generateToken(newUser);

  res.status(201).json({ token, user: newUser });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const result = await query('SELECT * FROM users WHERE email = $1', [
    email?.toLowerCase(),
  ]);

  const user = result.rows[0];
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email } });
};

const getMe = (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
};

module.exports = { registerUser, loginUser, getMe };
