const prisma = require('../config/prisma');

/**
 * Ghi audit log
 */
async function createAuditLog({ userId, action, entity, entityId, oldData, newData, description }) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: String(entityId),
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        description,
      },
    });
  } catch (error) {
    console.error('AuditLog error:', error.message);
    // Không throw lỗi để không ảnh hưởng luồng chính
  }
}

module.exports = { createAuditLog };
