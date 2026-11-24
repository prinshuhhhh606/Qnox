/**
 * Socket.IO / WebSocket Central Dispatcher
 * Initializes namespaces for chat and notification broadcasting
 */

const { initChatSocket } = require('./chatSocket');
const { initNotificationSocket } = require('./notificationSocket');

let ioInstance = null;

const initSockets = (server) => {
  try {
    // If socket.io is installed, initialize it gracefully
    const socketIo = require('socket.io');
    const io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    initChatSocket(io);
    const notifications = initNotificationSocket(io);

    ioInstance = io;
    console.log('[Sockets] Real-time WebSockets initialized successfully.');
    return { io, notifications };
  } catch (err) {
    // Graceful fallback if socket.io is not installed
    console.log('[Sockets] Running in native REST polling mode (Socket.IO optional module).');
    return {
      io: null,
      notifications: {
        broadcastAdminAlert: () => {},
        sendTrainerAlert: () => {}
      }
    };
  }
};

const getIO = () => ioInstance;

module.exports = {
  initSockets,
  getIO
};
