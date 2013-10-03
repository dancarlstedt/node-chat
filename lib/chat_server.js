var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
	io = socketio.listen(server);
	io.set('log level', 1);

	io.sockets.on('connection', function(socket){
		guestNumber = assignGuestName(socket, guestNumber,nickNames, namesUsed);
		joinRoom(socket, 'Lobby');

		handleMessageBroadcasting(socket, nickNames);
		handleNameChangeAttempts(socket, nickNames, namesUsed);
		handleJoiningRoom(socket);

		socket.on('rooms', function(){
			var rooms = [];
			for(var room in io.sockets.manager.rooms) {
				if(room.indexOf('/') == 0){
					rooms.push(room.substring(1,room.length));
				}
			}
			socket.emit('rooms', rooms);
		})

		handleClientDisconnection(socket, nickNames, namesUsed);
	});
}

function assignGuestName(socket, guestNumber, nickNames, namesUsed){
	var name = 'Guest' + guestNumber;
	nickNames[socket.id] = name;

	socket.emit('nameResult',{
		success: true,
		name: name
	});

	namesUsed.push(name);
	return guestNumber + 1;
}

function joinRoom(socket, roomName){
	socket.join(roomName);
	currentRoom[socket.id] = roomName;

	socket.emit('joinResult', {
		room: roomName
	});

	socket.broadcast.to(roomName).emit('message', {
		text : nickNames[socket.id] + ' has joined ' + roomName + '.'
	});

	var usersInRoom = io.sockets.clients(roomName);
	if(usersInRoom.length > 0){
		var usersInRoomSummary = 'Users currently in room ' + roomName + ' : ';
		for(var index in usersInRoom){
			var userSocketId = usersInRoom[index].id;
			usersInRoomSummary += nickNames[userSocketId];
			if(userSocketId != socket.id){
				usersInRoomSummary += ', ';
			} 
			
		}	
	}
	usersInRoomSummary += '.';
	socket.emit('message', {text : usersInRoomSummary});
}

function handleNameChangeAttempts(socket, nickNames, namesUsed){
	socket.on('nameAttempt',function(name){
		if(name.indexOf('guest') == 0){
			socket.emit('nameResult', {
				success : false,
				message: 'Name must not start with guest'
			});
		} else {
			if(namesUsed.indexOf(name) == -1){
				var previousName = nickNames[socket.id];
				var previousNameIndex = namesUsed.indexOf(previousName);

				namesUsed.push(name);
				nickNames[socket.id] = name;

				delete nickNames[previousNameIndex];
				socket.emit('nameResult', {
					success: true,
					name : name
				});

				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text : previousName + ' is now known as ' + name + '.'
				});
			} else{
				socket.emit('nameResult', {
					success : false,
					message : 'That name is already in use.'
				});
			}
		}
	});
}

function handleMessageBroadcasting(socket){	
	socket.on('message', function(message){
		socket.broadcast.to(message.room).emit('message', {
			text : nickNames[socket.id] + ': ' + message.text
		});
	})
}

function handleJoiningRoom(socket){
	socket.on('join', function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}

function handleClientDisconnection(socket){
	socket.on('disconnect', function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}