function divEscapedContentElementLink(message){
	return $('<div class="btn btn-link"></div>').text(message);
}

function divEscapedContentElement(message){
	return $('<div></div>').text(message);
}

function divSystemConentElement(message){
	return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket){
	var message = $('#send-message').val();
	var systemMessage;

	if(message.charAt(0) == '/'){
		systemMessage = chatApp.processCommand(message);
		if(systemMessage){
			$('#messages').append(divSystemConentElement(systemMessage));
		}		
	}else{
			chatApp.sendMessage($('#room').text(), message);
			$('#messages').append(divEscapedContentElement(message));
			$('#messages').scrollTop($('#messages').prop('scrollHeight'));
		}

		$('#send-message').val('');
	}