const config = require('../config');
const prisma = require('../config/prisma');

/**
 * Lấy bậc hoa hồng từ DB, fallback về config nếu lỗi
 * @returns {Array<{ minHours: number, maxHours: number, rate: number }>}
 */
async function getCommissionTiers() {
  try {
    const tiers = await prisma.commissionTier.findMany({
      where: { isActive: true },
      orderBy: { minHours: 'asc' },
    });

    if (tiers.length > 0) {
      return tiers.map((t) => ({
        minHours: t.minHours,
        maxHours: t.maxHours === 999999 ? Infinity : t.maxHours,
        rate: Number(t.rate),
      }));
    }
  } catch (error) {
    console.error('GetCommissionTiers from DB failed, using config fallback:', error.message);
  }

  return config.commissionTiers;
}

/**
 * Lấy lương cơ bản từ DB, fallback về config nếu lỗi
 * @returns {number}
 */
async function getBaseSalary() {
  try {
    const record = await prisma.salaryConfig.findUnique({ where: { key: 'BASE_SALARY' } });
    if (record) {
      return parseFloat(record.value);
    }
  } catch (error) {
    console.error('GetBaseSalary from DB failed, using config fallback:', error.message);
  }

  return config.baseSalary;
}

/**
 * Tính mức hoa hồng dựa trên tổng giờ
 * @param {number} totalHours - Tổng giờ trong tháng
 * @returns {{ rate: number, commission: number }}
 */
function calculateCommission(totalHours) {
  const tier = config.commissionTiers.find(
    (t) => totalHours >= t.minHours && totalHours <= t.maxHours
  );
  const rate = tier ? tier.rate : 0;
  return {
    rate,
    commission: totalHours * rate,
  };
}

/**
 * Tính mức hoa hồng dựa trên tổng giờ (đọc từ DB)
 * @param {number} totalHours - Tổng giờ trong tháng
 * @returns {Promise<{ rate: number, commission: number }>}
 */
async function calculateCommissionFromDB(totalHours) {
  const tiers = await getCommissionTiers();
  const tier = tiers.find(
    (t) => totalHours >= t.minHours && totalHours <= t.maxHours
  );
  const rate = tier ? tier.rate : 0;
  return {
    rate,
    commission: totalHours * rate,
  };
}

/**
 * Tính tổng lương Sale (sync — dùng config hardcoded)
 * @param {number} totalHours - Tổng giờ CN do Sale phụ trách
 * @param {number} totalBonus - Tổng thưởng khác
 * @returns {{ baseSalary, totalHours, commissionRate, commissionAmount, totalBonus, totalSalary }}
 */
function calculateSalary(totalHours, totalBonus = 0) {
  const { rate, commission } = calculateCommission(totalHours);
  return {
    baseSalary: config.baseSalary,
    totalHours,
    commissionRate: rate,
    commissionAmount: commission,
    totalBonus,
    totalSalary: config.baseSalary + commission + totalBonus,
  };
}

/**
 * Tính tổng lương Sale (async — đọc từ DB)
 * @param {number} totalHours - Tổng giờ CN do Sale phụ trách
 * @param {number} totalBonus - Tổng thưởng khác
 * @returns {Promise<{ baseSalary, totalHours, commissionRate, commissionAmount, totalBonus, totalSalary }>}
 */
async function calculateSalaryFromDB(totalHours, totalBonus = 0) {
  const [baseSalary, { rate, commission }] = await Promise.all([
    getBaseSalary(),
    calculateCommissionFromDB(totalHours),
  ]);

  return {
    baseSalary,
    totalHours,
    commissionRate: rate,
    commissionAmount: commission,
    totalBonus,
    totalSalary: baseSalary + commission + totalBonus,
  };
}

module.exports = { calculateCommission, calculateSalary, calculateSalaryFromDB };
