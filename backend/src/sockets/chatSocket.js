/**
 * Real-time Chat Socket Event Handler
 * Handles real-time messaging between members and trainers
 */

const initChatSocket = (io) => {
  if (!io) return;

  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    console.log(`[Socket] Member/Trainer connected to chat: ${socket.id}`);

    // Join member-specific room
    socket.on('join_chat', ({ roomId, userId }) => {
      socket.join(roomId);
      console.log(`[Socket] User ${userId} joined room ${roomId}`);
    });

    // Handle incoming chat message
    socket.on('send_message', (data) => {
      const { roomId, message, senderId, senderRole } = data;
      chatNamespace.to(roomId).emit('receive_message', {
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected from chat: ${socket.id}`);
    });
  });
};

module.exports = { initChatSocket };
