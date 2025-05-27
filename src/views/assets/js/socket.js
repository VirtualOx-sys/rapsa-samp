const socket = io.connect("https://bv.botlist.es");

socket.on('userCount', userCount => {
      document.getElementById('connectionCount').innerHTML = userCount;
})