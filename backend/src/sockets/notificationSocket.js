/**
 * Real-time Admin & Trainer Notifications Socket Handler
 * Broadcasts instant alerts for new bookings, inquiries, and applications
 */

const initNotificationSocket = (io) => {
  if (!io) return;

  const notificationNamespace = io.of('/notifications');

  notificationNamespace.on('connection', (socket) => {
    console.log(`[Socket] Notification listener connected: ${socket.id}`);

    socket.on('join_admin_feed', () => {
      socket.join('admin_feed');
    });


    
    socket.on('join_trainer_feed', ({ trainerId }) => {
      socket.join(`trainer_${trainerId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Notification listener disconnected: ${socket.id}`);
    });
  });

  return {
    broadcastAdminAlert: (alert) => {
      notificationNamespace.to('admin_feed').emit('admin_alert', alert);
    },
    sendTrainerAlert: (trainerId, alert) => {
      notificationNamespace.to(`trainer_${trainerId}`).emit('trainer_alert', alert);
    }
  };
};

module.exports = { initNotificationSocket };
