const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUsers, saveUsers } = require('./config/db');

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

  const users = getUsers();
  const existingUser = users.find((u) => u.email === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists!' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    email: email.toLowerCase(),
    password: hashedPassword,
  };

  users.push(newUser);
  saveUsers(users);

  const token = generateToken(newUser);
  res.status(201).json({ token, user: { id: newUser.id, email: newUser.email } });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();

  const user = users.find((u) => u.email === email?.toLowerCase());
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