var canvas;
var ctx;
var checkImg;
var xImg;
var image;
var kingIcon;

function createCanvas(){
	var canvasPos = $("#board").offset();
	var boardw = $("#board").width();
	//$("#board-holder").append('<canvas id="canvas-feedback" width="'+boardw+'" height="'+boardw+'"></canvas>')
	canvas = document.querySelector("#canvas-feedback");
	ctx = canvas.getContext("2d");
	checkImg = new Image();
	checkImg.src = "img/check-sm.gif";
	xImg = new Image();
	xImg.src = "img/redx.png";
	kingIcon = new Image();
	kingIcon.src = "img/king.png";
	ctx.font="16px Georgia";
}

function drawCanvas(){
	requestAnimationFrame(drawCanvas);
	ctx.clearRect(0,0,canvas.width,canvas.height);
	//ctx.globalAlpha -= .013;
	//if (ctx.globalAlpha < .2) ctx.globalAlpha = 0.0;
	if (image ) ctx.drawImage(image,0,75);
	if (gameMode) drawGameMode();
}

function drawGameMode(){
	if (theOpening){
		ctx.fillText("Lives:", 0, 16);
		for (var i =0; i < gameModeData.lives; i++){
			ctx.drawImage(kingIcon,i*36, 18, 32, 55);
		}
		var lvl = gameModeData.currentPlayIndex;
		var length = gameModeData.plays.length+1;
		//ctx.fillText("Level "+lvl, 0, 85);
		wrapText("Level "+lvl+": "+theOpening.name, 0, 100, canvas.width, 18);
	}
}

function playFeedbackAnimation(type){
	if (type == "win"){
		$("#checkMark").toggle().delay(500).animate({opacity: "-0.13"}, 1400, function(){ 
			$("#checkMark").toggle(); 
			$("#checkMark").css("opacity", "1");
			});
	}
	if (type == "loss"){
		$("#redX").toggle().delay(500).animate({opacity: "-0.13"}, 1400, function(){ 
			$("#redX").toggle(); 
			$("#redX").css("opacity", "1");
			});
	}
}

function wrapText(text, x, y, maxWidth, lineHeight) {
	var words = text.split(' ');
	var line = '';
	
	for(var n = 0; n < words.length; n++) {
		var testLine = line + words[n] + ' ';
		var metrics = ctx.measureText(testLine);
		var testWidth = metrics.width;
		if (testWidth > maxWidth && n > 0) {
		ctx.fillText(line, x, y);
		line = words[n] + ' ';
		y += lineHeight;
		}
		else {
		line = testLine;
		}
	}
	ctx.fillText(line, x, y);
}
			

