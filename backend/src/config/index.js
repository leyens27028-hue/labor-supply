require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  baseSalary: 5000000, // Lương cơ bản 5 triệu
  commissionTiers: [
    { minHours: 0, maxHours: 800, rate: 0 },
    { minHours: 801, maxHours: 1500, rate: 2500 },
    { minHours: 1501, maxHours: 5000, rate: 3500 },
    { minHours: 5001, maxHours: Infinity, rate: 4000 },
  ],
};
