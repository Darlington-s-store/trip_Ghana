const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = require('./db');

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8080', credentials: true }));
app.use(express.json());

// camelCase utility
const toCamel = (o) => {
  if (o === null || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(toCamel);
  const n = {};
  Object.keys(o).forEach((k) => {
    const camel = k.replace(/([-_][a-z])/g, (g) => g.toUpperCase().replace('-', '').replace('_', ''));
    n[camel] = toCamel(o[k]);
  });
  return n;
};

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (obj) {
    if (obj && obj.success !== undefined) {
      return originalJson.call(this, toCamel(obj));
    }
    return originalJson.call(this, obj);
  };
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/attractions', require('./routes/attractions'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin/users', require('./routes/adminUsers'));
app.use('/api/admin/analytics', require('./routes/analytics'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin/settings', require('./routes/adminSettings'));
app.use('/api/chat', require('./routes/chat'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { pool };
