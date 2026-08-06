/**
 * Socket.IO Real-Time Helper
 * Manages WebSocket connections and broadcasts slot updates (slotStatusUpdate)
 * to all connected clients and facility rooms.
 */

const socketIo = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('joinFacility', (facilityId) => {
      if (facilityId) {
        socket.join(`facility_${facilityId}`);
      }
    });

    socket.on('leaveFacility', (facilityId) => {
      if (facilityId) {
        socket.leave(`facility_${facilityId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const emitSlotStatusUpdate = (slotData) => {
  if (io) {
    io.emit('slotStatusUpdate', slotData);
    if (slotData && (slotData.facilityId || slotData.location)) {
      const facId = slotData.facilityId || slotData.location;
      io.to(`facility_${facId}`).emit('slotStatusUpdate', slotData);
    }
  }
};

const getIo = () => io;

module.exports = { initSocket, emitSlotStatusUpdate, getIo };
