import { io } from '../server';

io.on('connection', (socket) => {
  socket.on('webrtc-offer', (data) => {
    const { peerSocketId, offer } = data;
    io.to(peerSocketId).emit('webrtc-offer', { peerSocketId: socket.id, offer });
  });

  socket.on('webrtc-answer', (data) => {
    const { peerSocketId, answer } = data;
    io.to(peerSocketId).emit('webrtc-answer', { peerSocketId: socket.id, answer });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { peerSocketId, candidate } = data;
    io.to(peerSocketId).emit('webrtc-ice-candidate', { peerSocketId: socket.id, candidate });
  });

});
