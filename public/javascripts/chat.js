var Chat = function(socket) {
	this.socket = socket;
}

Chat.prototype.sendMessage = function(room, text){
	var message = {
		room : room,
		text : text
	};
	this.socket.emit('message', message);
}

Chat.prototype.changeRoom = function(room){
	this.socket.emit('join', {
		newRoom : room
	});
}

Chat.prototype.processCommand = function(command){
	var words = command.split(' ');
	var command = words[0]
					.substring(1,words[0].length)
					.toLowerCase();

	var message = false;
	switch(command){
		case "join":
			words.shift();
			var room = words.join(' ');
			this.changeRoom(room);
			break;
		case "nick":
			words.shift();
			var name = words.join(' ');
			this.socket.emit('nameAttempt', name);
			break;
		default:
			message = 'Unrecognized command';
			break;
	}
	return message;
}

var socket = io.connect();
$(document).ready(function(){
	var chatApp = new Chat(socket);

	socket.on('nameResult', function(result){
		var message;

		if(result.success){
			message = 'You are now known as ' + result.name + '.';
		} else {
			message = result.message;
		}

		 $('#messages').append(divSystemConentElement(message));
	});

	socket.on('joinResult', function(result){
		$('#room').text(result.room);
		$('#messages').append(divSystemConentElement('Room Changed'));
	});

	socket.on('message', function(message){
		var newElement = $('<div></div>').text(message.text);
		$('#messages').append(newElement);
	});

	socket.on('rooms', function(rooms){
		$('#room-list').empty();

		for(var index in rooms){
			if(rooms[index] != ''){
				$('#room-list').append(divEscapedContentElementLink(rooms[index]));
			}
		}

		$('#room-list div').click(function() {
			chatApp.processCommand('/join ' + $(this).text());
			$('#send-message').focus();
		});
	});

	setInterval(function() {
		socket.emit('rooms');
	}, 1000);

	$('#send-message').focus();

	$('#send-form').submit(function(){
		processUserInput(chatApp, socket);
		return false;
	});
}); 	 	