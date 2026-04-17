const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/orders
 */
async function getOrders(req, res) {
  try {
    const { search, status, employmentType, vendorId, factoryId, assignedSaleId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Sale chỉ xem đơn được giao
    if (req.user.role === 'SALE') {
      where.assignedSaleId = req.user.id;
    }

    // Trưởng nhóm xem đơn của Sale trong nhóm
    if (req.user.role === 'TEAM_LEAD') {
      const team = await prisma.team.findUnique({ where: { leadId: req.user.id }, include: { members: { select: { id: true } } } });
      if (team) {
        const memberIds = team.members.map((m) => m.id);
        memberIds.push(req.user.id);
        where.OR = [{ assignedSaleId: { in: memberIds } }, { createdById: req.user.id }];
      }
    }

    if (status) where.status = status;
    if (employmentType) where.employmentType = employmentType;
    if (vendorId) where.vendorId = vendorId;
    if (factoryId) where.factoryId = factoryId;
    if (assignedSaleId) where.assignedSaleId = assignedSaleId;
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [orders, total] = await Promise.all([
      prisma.recruitmentOrder.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } },
          factory: { select: { id: true, name: true } },
          assignedSale: { select: { id: true, fullName: true } },
          createdBy: { select: { id: true, fullName: true } },
          _count: { select: { workerAssignments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.recruitmentOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('GetOrders error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * GET /api/orders/:id
 */
async function getOrderById(req, res) {
  try {
    const order = await prisma.recruitmentOrder.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: { select: { id: true, name: true, contactPerson: true, phone: true } },
        factory: { select: { id: true, name: true, address: true } },
        assignedSale: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true } },
        workerAssignments: {
          include: {
            worker: {
              select: { id: true, fullName: true, idCard: true, phone: true, status: true, employmentType: true },
            },
          },
          orderBy: { assignedDate: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn tuyển' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('GetOrderById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/orders
 */
async function createOrder(req, res) {
  try {
    const { title, vendorId, factoryId, employmentType, quantity, genderRequirement, ageMin, ageMax, requirements, commissionPerHour, specialBonus, specialBonusCondition, assignedSaleId, deadline, note } = req.body;

    if (!title || !vendorId || !factoryId || !employmentType || !quantity || !commissionPerHour) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đủ: tiêu đề, vendor, nhà máy, loại hình, số lượng, hoa hồng/giờ',
      });
    }

    const order = await prisma.recruitmentOrder.create({
      data: {
        title: title.trim(),
        vendorId,
        factoryId,
        employmentType,
        quantity: parseInt(quantity),
        genderRequirement: genderRequirement || 'ANY',
        ageMin: ageMin ? parseInt(ageMin) : null,
        ageMax: ageMax ? parseInt(ageMax) : null,
        requirements: requirements?.trim() || null,
        commissionPerHour: parseFloat(commissionPerHour),
        specialBonus: specialBonus ? parseFloat(specialBonus) : null,
        specialBonusCondition: specialBonusCondition?.trim() || null,
        status: assignedSaleId ? 'RECRUITING' : 'NEW',
        createdById: req.user.id,
        assignedSaleId: assignedSaleId || null,
        deadline: deadline ? new Date(deadline) : null,
        note: note?.trim() || null,
      },
      include: {
        vendor: { select: { name: true } },
        factory: { select: { name: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'recruitment_orders',
      entityId: order.id,
      newData: { title: order.title, vendorId, factoryId, employmentType, quantity },
      description: `Tạo đơn tuyển: ${order.title} — ${order.factory.name}`,
    });

    res.status(201).json({ success: true, message: 'Tạo đơn tuyển thành công', data: order });
  } catch (error) {
    console.error('CreateOrder error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/orders/:id
 */
async function updateOrder(req, res) {
  try {
    const existing = await prisma.recruitmentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn tuyển' });
    }

    const { title, quantity, genderRequirement, ageMin, ageMax, requirements, commissionPerHour, specialBonus, specialBonusCondition, status, assignedSaleId, deadline, note } = req.body;

    const data = {};
    if (title !== undefined) data.title = title.trim();
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (genderRequirement !== undefined) data.genderRequirement = genderRequirement;
    if (ageMin !== undefined) data.ageMin = ageMin ? parseInt(ageMin) : null;
    if (ageMax !== undefined) data.ageMax = ageMax ? parseInt(ageMax) : null;
    if (requirements !== undefined) data.requirements = requirements?.trim() || null;
    if (commissionPerHour !== undefined) data.commissionPerHour = parseFloat(commissionPerHour);
    if (specialBonus !== undefined) data.specialBonus = specialBonus ? parseFloat(specialBonus) : null;
    if (specialBonusCondition !== undefined) data.specialBonusCondition = specialBonusCondition?.trim() || null;
    if (status !== undefined) data.status = status;
    if (assignedSaleId !== undefined) data.assignedSaleId = assignedSaleId || null;
    if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;
    if (note !== undefined) data.note = note?.trim() || null;

    const order = await prisma.recruitmentOrder.update({
      where: { id: req.params.id },
      data,
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'recruitment_orders',
      entityId: order.id,
      oldData: { title: existing.title, status: existing.status, assignedSaleId: existing.assignedSaleId },
      newData: data,
      description: `Cập nhật đơn tuyển: ${order.title}`,
    });

    res.json({ success: true, message: 'Cập nhật thành công', data: order });
  } catch (error) {
    console.error('UpdateOrder error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/orders/:id/assign-worker
 * Gắn CN vào đơn tuyển
 */
async function assignWorker(req, res) {
  try {
    const { workerId, note } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn công nhân' });
    }

    const existing = await prisma.workerAssignment.findUnique({
      where: { workerId_recruitmentOrderId: { workerId, recruitmentOrderId: req.params.id } },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Công nhân đã được gắn vào đơn này' });
    }

    const order = await prisma.recruitmentOrder.findUnique({ where: { id: req.params.id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn tuyển' });
    }

    const assignment = await prisma.workerAssignment.create({
      data: {
        workerId,
        recruitmentOrderId: req.params.id,
        note: note?.trim() || null,
      },
      include: {
        worker: { select: { id: true, fullName: true } },
      },
    });

    // Cập nhật trạng thái CN thành WORKING
    await prisma.worker.update({
      where: { id: workerId },
      data: {
        status: 'WORKING',
        factoryId: order.factoryId,
        startDate: new Date(),
        employmentType: order.employmentType,
      },
    });

    // Kiểm tra đã đủ CN chưa → cập nhật status đơn
    const assignCount = await prisma.workerAssignment.count({ where: { recruitmentOrderId: req.params.id } });
    if (assignCount >= order.quantity && order.status !== 'FULFILLED') {
      await prisma.recruitmentOrder.update({
        where: { id: req.params.id },
        data: { status: 'FULFILLED' },
      });
    }

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'worker_assignments',
      entityId: assignment.id,
      newData: { workerId, recruitmentOrderId: req.params.id },
      description: `Gắn CN ${assignment.worker.fullName} vào đơn: ${order.title}`,
    });

    res.status(201).json({ success: true, message: `Đã gắn ${assignment.worker.fullName} vào đơn`, data: assignment });
  } catch (error) {
    console.error('AssignWorker error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/orders/:id/remove-worker/:assignmentId
 */
async function removeWorker(req, res) {
  try {
    const assignment = await prisma.workerAssignment.findUnique({
      where: { id: req.params.assignmentId },
      include: { worker: { select: { id: true, fullName: true } } },
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phân công' });
    }

    await prisma.workerAssignment.delete({ where: { id: req.params.assignmentId } });

    // Cập nhật CN lại AVAILABLE
    await prisma.worker.update({
      where: { id: assignment.workerId },
      data: { status: 'AVAILABLE', factoryId: null, startDate: null },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'worker_assignments',
      entityId: req.params.assignmentId,
      oldData: { workerId: assignment.workerId, recruitmentOrderId: assignment.recruitmentOrderId },
      description: `Gỡ CN ${assignment.worker.fullName} khỏi đơn tuyển`,
    });

    res.json({ success: true, message: `Đã gỡ ${assignment.worker.fullName}` });
  } catch (error) {
    console.error('RemoveWorker error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/orders/:id (soft delete - set CLOSED)
 */
async function deleteOrder(req, res) {
  try {
    const existing = await prisma.recruitmentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn tuyển' });

    await prisma.recruitmentOrder.update({ where: { id: req.params.id }, data: { status: 'CLOSED' } });

    await createAuditLog({
      userId: req.user.id, action: 'DELETE', entity: 'recruitment_orders', entityId: req.params.id,
      description: `Đóng đơn tuyển: ${existing.title}`,
    });

    res.json({ success: true, message: 'Đã đóng đơn tuyển' });
  } catch (error) {
    console.error('DeleteOrder error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PATCH /api/orders/:id/status
 */
async function changeOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['NEW', 'RECRUITING', 'FULFILLED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const existing = await prisma.recruitmentOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn tuyển' });

    const order = await prisma.recruitmentOrder.update({ where: { id: req.params.id }, data: { status } });

    await createAuditLog({
      userId: req.user.id, action: 'UPDATE', entity: 'recruitment_orders', entityId: req.params.id,
      oldData: { status: existing.status }, newData: { status },
      description: `Đổi trạng thái đơn: ${existing.title} → ${status}`,
    });

    res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: order });
  } catch (error) {
    console.error('ChangeOrderStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getOrders, getOrderById, createOrder, updateOrder, assignWorker, removeWorker, deleteOrder, changeOrderStatus };
