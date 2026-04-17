const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/teams', require('./routes/team'));
app.use('/api/vendors', require('./routes/vendor'));
app.use('/api/factories', require('./routes/factory'));
app.use('/api/orders', require('./routes/recruitmentOrder'));
app.use('/api/workers', require('./routes/worker'));
app.use('/api/collaborators', require('./routes/collaborator'));
app.use('/api/working-hours', require('./routes/workingHours'));
app.use('/api/salaries', require('./routes/salary'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/commission', require('./routes/commission'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ',
  });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on port ${config.port}`);
});

module.exports = app;
