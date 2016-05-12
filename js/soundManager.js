window.onload = initSounds;
var context;
var bufferLoader;
var checkmarkBuffer, redxBuffer, winBuffer, lossBuffer;
var advSound = true;


function initSounds(){
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext();
	
	loadBuffers(
	[
		"sounds/buzz.mp3",
		"sounds/ding.mp3",
		"sounds/party.mp3",
		"sounds/scream-no.mp3"
	]
	);
}

var source = null;
function playSound(name){
	if (source) source.stop();
	else if (name == "redx") source.buffer = snd.redx;
	else if (name == "checkmark") source.buffer = snd.checkmark;
	else if (name == "win") source.buffer = snd.win;
	else if (name == "loss") source.buffer = snd.loss;
	else return;
	source.connect(context.destination);
	source.start();
	console.log("trying to play sound "+name);
}


	
function loadBuffers(u){
	var request = new XMLHttpRequest();
	request.open('GET', u[0], true);
	request.resposeType = 'arraybuffer';
	
	request.onload = function(){
		context.decodeAudioData(request.response, function(buffera){
			redxBuffer = buffera;
					var request1 = new XMLHttpRequest();
					request1.open('GET', u[1], true);
					request1.resposeType = 'arraybuffer';
					
					request1.onload = function(){
						context.decodeAudioData(request.response, function(bufferb){
							checkmarkBuffer = bufferb;
						});
					}
					request1.send();
		});
	}
	request.send();
	/*
	var request1 = new XMLHttpRequest();
	request1.open('GET', u[1], true);
	request1.resposeType = 'arraybuffer';
	
	request1.onload = function(){
		context.decodeAudioData(request.response, function(bufferb){
			checkmarkBuffer = bufferb;
		});
	}
	request1.send();
/*	
	var request2 = new XMLHttpRequest();
	request2.open('GET', u[2], true);
	request2.resposeType = 'arraybuffer';
	
	request2.onload = function(){
		context.decodeAudioData(request.response, function(bufferc){
			winBuffer = bufferc;
		});
	}
	request2.send();
	
	var request3 = new XMLHttpRequest();
	request3.open('GET', u[3], true);
	request3.resposeType = 'arraybuffer';
	
	request3.onload = function(){
		context.decodeAudioData(request.response, function(bufferd){
			lossBuffer = bufferd;
		});
	}
	request3.send();*/
}
