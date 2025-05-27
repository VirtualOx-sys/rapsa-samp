const socket = io.connect("");

socket.on('userCount', userCount => {
      document.getElementById('connectionCount').innerHTML = userCount;
})