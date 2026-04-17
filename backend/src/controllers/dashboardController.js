const prisma = require('../config/prisma');

/**
 * GET /api/dashboard/stats
 * Thống kê tổng quan cho Dashboard
 * - ADMIN/DIRECTOR: xem toàn bộ
 * - TEAM_LEAD: xem dữ liệu của nhóm mình
 * - SALE: chỉ xem dữ liệu của mình
 */
async function getStats(req, res) {
  try {
    const { role, id: userId, teamId } = req.user;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Build scoping filters based on role
    const isFullAccess = role === 'ADMIN' || role === 'DIRECTOR';

    // Worker filter: scope by saleId
    let workerWhere = {};
    if (role === 'TEAM_LEAD' && teamId) {
      const teamMembers = await prisma.user.findMany({
        where: { teamId, role: 'SALE', isActive: true },
        select: { id: true },
      });
      const memberIds = teamMembers.map((m) => m.id);
      workerWhere = { saleId: { in: memberIds } };
    } else if (role === 'SALE') {
      workerWhere = { saleId: userId };
    }

    // Working hours filter: scope by worker's saleId
    let hoursWorkerFilter = {};
    if (role === 'TEAM_LEAD' && teamId) {
      const teamMembers = await prisma.user.findMany({
        where: { teamId, role: 'SALE', isActive: true },
        select: { id: true },
      });
      const memberIds = teamMembers.map((m) => m.id);
      hoursWorkerFilter = { worker: { saleId: { in: memberIds } } };
    } else if (role === 'SALE') {
      hoursWorkerFilter = { worker: { saleId: userId } };
    }

    // Run all queries in parallel
    const [openOrders, workingWorkers, activeVendors, hoursAgg, activeSales, activeCollaborators, totalTeams] = await Promise.all([
      // Đơn tuyển đang mở (không scope theo role vì đơn tuyển là chung)
      prisma.recruitmentOrder.count({
        where: { status: { in: ['NEW', 'RECRUITING'] } },
      }),

      // Công nhân đang làm việc
      prisma.worker.count({
        where: { status: 'WORKING', ...workerWhere },
      }),

      // Vendor đang hoạt động (không scope theo role)
      prisma.vendor.count({
        where: { isActive: true },
      }),

      // Tổng giờ làm tháng này
      prisma.workingHours.aggregate({
        where: {
          month: currentMonth,
          year: currentYear,
          ...hoursWorkerFilter,
        },
        _sum: { totalHours: true },
      }),

      // Sale đang hoạt động
      prisma.user.count({
        where: { role: 'SALE', isActive: true },
      }),

      // CTV đang hoạt động
      prisma.collaborator.count({
        where: { isActive: true },
      }),

      // Tổng số nhóm
      prisma.team.count(),
    ]);

    const totalHoursThisMonth = Number(hoursAgg._sum.totalHours || 0);

    res.json({
      success: true,
      data: {
        openOrders,
        workingWorkers,
        activeVendors,
        totalHoursThisMonth,
        activeSales,
        activeCollaborators,
        totalTeams,
        month: currentMonth,
        year: currentYear,
      },
    });
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getStats };
