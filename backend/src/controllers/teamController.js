const prisma = require('../config/prisma');
const { createAuditLog } = require('../utils/auditLog');

/**
 * GET /api/teams
 */
async function getTeams(req, res) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        lead: { select: { id: true, fullName: true, email: true } },
        members: { select: { id: true, fullName: true, email: true, role: true, isActive: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('GetTeams error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * POST /api/teams
 */
async function createTeam(req, res) {
  try {
    const { name, leadId } = req.body;

    if (!name || !leadId) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên nhóm và chọn trưởng nhóm' });
    }

    // Kiểm tra tên trùng
    const existingName = await prisma.team.findUnique({ where: { name: name.trim() } });
    if (existingName) {
      return res.status(400).json({ success: false, message: 'Tên nhóm đã tồn tại' });
    }

    // Kiểm tra lead đã là trưởng nhóm khác chưa
    const existingLead = await prisma.team.findUnique({ where: { leadId } });
    if (existingLead) {
      return res.status(400).json({ success: false, message: 'Người này đã là trưởng nhóm khác' });
    }

    const team = await prisma.team.create({
      data: { name: name.trim(), leadId },
      include: {
        lead: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Cập nhật role của lead thành TEAM_LEAD
    await prisma.user.update({
      where: { id: leadId },
      data: { role: 'TEAM_LEAD', teamId: team.id },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'teams',
      entityId: team.id,
      newData: { name: team.name, leadId },
      description: `Tạo nhóm: ${team.name}`,
    });

    res.status(201).json({ success: true, message: 'Tạo nhóm thành công', data: team });
  } catch (error) {
    console.error('CreateTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PUT /api/teams/:id
 */
async function updateTeam(req, res) {
  try {
    const { name, leadId } = req.body;

    const existing = await prisma.team.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
    }

    const data = {};
    if (name) data.name = name.trim();
    if (leadId) data.leadId = leadId;

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data,
      include: {
        lead: { select: { id: true, fullName: true, email: true } },
        _count: { select: { members: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'teams',
      entityId: team.id,
      oldData: { name: existing.name, leadId: existing.leadId },
      newData: data,
      description: `Cập nhật nhóm: ${team.name}`,
    });

    res.json({ success: true, message: 'Cập nhật nhóm thành công', data: team });
  } catch (error) {
    console.error('UpdateTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * DELETE /api/teams/:id — Soft delete (set isActive = false) + unset teamId for members
 */
async function deleteTeam(req, res) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: { members: { select: { id: true } } },
    });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
    }

    // Unset teamId for all members of this team
    await prisma.user.updateMany({
      where: { teamId: team.id },
      data: { teamId: null },
    });

    // Soft delete: set isActive = false
    await prisma.team.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'teams',
      entityId: team.id,
      oldData: { name: team.name, leadId: team.leadId },
      description: `Xóa nhóm: ${team.name}`,
    });

    res.json({ success: true, message: 'Xóa nhóm thành công' });
  } catch (error) {
    console.error('DeleteTeam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

/**
 * PATCH /api/teams/:id/toggle-active — Toggle isActive status
 */
async function toggleTeamActive(req, res) {
  try {
    const team = await prisma.team.findUnique({ where: { id: req.params.id } });

    if (!team) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
    }

    const newStatus = !team.isActive;

    // If deactivating, unset teamId for all members
    if (!newStatus) {
      await prisma.user.updateMany({
        where: { teamId: team.id },
        data: { teamId: null },
      });
    }

    const updated = await prisma.team.update({
      where: { id: req.params.id },
      data: { isActive: newStatus },
      include: {
        lead: { select: { id: true, fullName: true, email: true } },
        _count: { select: { members: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'teams',
      entityId: team.id,
      oldData: { isActive: team.isActive },
      newData: { isActive: newStatus },
      description: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} nhóm: ${team.name}`,
    });

    res.json({
      success: true,
      message: `${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} nhóm thành công`,
      data: updated,
    });
  } catch (error) {
    console.error('ToggleTeamActive error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
}

module.exports = { getTeams, createTeam, updateTeam, deleteTeam, toggleTeamActive };
