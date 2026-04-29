/*io.socket.on('connect', function onConnect(){
    console.log('El socket esta conectado al servidor.');
  });*/

  io.socket.on('connect', function() {
    
    io.socket.get('/revisar', function(messages) {
      console.log(messages);
    });

    io.socket.on('chatRoom', function(newMessage) {
        alert(newMessage);
        console.log(newMessage);
      //this.setState({messages: this.state.messages.concat([newMessage])});
    });
    
  });