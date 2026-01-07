import prisma from '../config/db.js';

export const createNotification = async (userId, activityId, activityType, message) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        activityId,
        activityType,
        message,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // We don't want to crash the request if notification fails
  }
};

export const createBulkNotifications = async (userIds, activityId, activityType, message) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      activityId,
      activityType,
      message,
    }));
    
    await prisma.notification.createMany({
      data: notifications,
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
  }
};
