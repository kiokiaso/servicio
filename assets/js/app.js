window.addEventListener('beforeunload', function () {
  
  if (io.socket && io.socket.isConnected()) {
    io.socket.disconnect(); // Esto dispara afterDisconnect en el servidor al instante
  }
});