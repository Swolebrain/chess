// JavaScript Document


var board;
var game;
var playerMoves = 0;
var theOpening;
var loadedJson;	
var whitePower = true;
var gameMode = false;
var gameModeData = { plays: {}, playKeys: {}, currentPlayIndex : 0 , lives: 5};


var finishedDropping = function(){
	//console.log("finished drag and drop. playerMoves = "+playerMoves);
	onSnapEnd();
	var boardpos = board.position();
	if (playerMoves > 0 && comparePositions(boardpos, theOpening.positions[playerMoves-1]))
		return;
	if ( comparePositions(boardpos, theOpening.startPos))
		return;
	var correctpos = theOpening.positions[playerMoves];
	if (comparePositions(boardpos, correctpos)){
		if (playerMoves < theOpening.positions.length-1){
			runOpponentMove();
		}
		if (playerMoves == theOpening.positions.length-1 ){
			if (gameModeData.currentPlayIndex < gameModeData.playKeys.length-1 || !gameMode){
				board.colorBorder("green");
				playFeedbackAnimation("win");
				if (!advSound) window.ding1.play();
				else playSound("checkmark");
				board.setDraggable(false);
				if (!gameMode) $("#startOver").html("Go again");
			}
			if (gameMode){
				setTimeout(function(){
					startNewPlay();
				}, 1000);
			}
		}
	}
	else{
		board.colorBorder("red");
		if (gameMode){
			gameModeData.lives--;
			if (gameModeData.lives == 0) gameOver();
		}
		if (!gameMode || gameModeData.lives > 0){
			playFeedbackAnimation("loss");
			//set to non draggable
			board.setDraggable(false);
			$("#startOver").css("display", "");
			$("#startOver").html("Try again");
			if (!advSound) window.buzz1.play();
			else playSound("redx");
		}
		
		return;
	}
	playerMoves++;
}

function start(){ 
	var cfg = {
	  draggable: false,
	  dropOffBoard: 'snapback', 
	  showErrors: true,
	  onDragStart : onDragStart,
	  onDrop: detectIllegalMove,
	  onSnapEnd: finishedDropping,
	  position: 'start'
	  //afterDrop: finishedDropping
	};
	board = new ChessBoard('board', cfg); 
	game = new Chess();
	setMoveSpeed();
	//loadNewOpening("evans_gambit_accepted");
	createCanvas();
	drawCanvas();
	$("input[name=speed]:radio").change(function () {
		setMoveSpeed();
	});
	
	$("input[name=boardColor]:radio").change(function () {
		setBoardOrientation();
	});
	$("#startOver").on('click', startOver);
	$("#startOver2").on('click', startOver);
	$("#viewOpening").on('click', executeOpening);
	//$("#startGameMode").on('click', startGameMode);
	$("#startGameMode").on('click', levelSelect);
	$("#backToTraining").on('click', function(){ window.location.href = 'index.html'; });
}


function startOver(){
	game = new Chess();
	board.interrupt();
	//in here i need to do if (whitePower) board.orientation("white")
	//else board.orientation("black")
	if (whitePower && board.orientation() == 'black')
		board.orientation('white');
	if (!whitePower && board.orientation() == 'white')
		board.orientation('black');
	board.setDraggable(true);
	board.position(theOpening.startPos);
	playerMoves = 0;
	//$("#feedback").html("");
	if (!whitePower){
		playerMoves = -1;
		runOpponentMove();
		playerMoves++;
	}
	if (gameMode){
		$("#startOver").css("display", "none");
	}
}


//old main
function main(){
	/*start();
	$("#startOver").on('click', startOver);
	$("#viewOpening").on('click', executeOpening);*/

	
}


function executeOpening(param){
	board.interrupt();
	//console.log("hello world");
	//console.log("executeOpening: board.isPlayingAnimation() (v7 int above chanced from else) = "+board.isPlayingAnimation());
	if (!board.isPlayingAnimation()){
		//board.interrupt();
		board.setDraggable(true);
		board.position(theOpening.startPos);
		playerMoves = 0;
		$("#feedback").html("");
		var newpos=board.move.apply(board,theOpening.arr);
	}
}

function comparePositions(pos1, pos2){
	if (!pos1 || !pos2) return false;
	if (pos1.length != pos2.length) return false;
	for (i in pos1){
		if (!pos2.hasOwnProperty(i)){
			//sconsole.log("param 2 didn't have property "+i);
			 return false;
		}
		if (pos1[i] != pos2[i]){
			 console.log (i+": board has "+pos1[i]+" theOpening.positions has"+pos2[i]);
			 return false;
		}else{
			//console.log(i+": matched board's "+pos1[i]+" to theOpening.position[i]'s "+pos2[i]);
		}
	}
	return true;
}


function setMoveSpeed(){
	var x = 0.5;
	if ($("#medium-radio").is(':checked'))
		 x = 1.25;
	if ($("#slow-radio").is(':checked')) x = 2;
	board.setAnimInterval(x*1000);
	
}

function setBoardOrientation(){
	if ($("#black-radio").is(":checked")){
			//board.orientation("black");
			whitePower = false;
	}
	else if ($("#white-radio").is(":checked")){
		//board.orientation("white");
			whitePower = true;
	}
}

function runOpponentMove(){
	playerMoves++;
	/* Translation from plain move to chessboardjs notation
	'e1-g1' <--> 'wO-O'
	'e1-c1' <--> 'wO-OO'
	'e8-g8' <--> 'bO-O'
	'e8-c8' <--> 'bO-OO'
	*/
	var cMove = theOpening.arr[playerMoves];
	if (cMove == 'wO-O') game.move({from:"e1", to: "g1"});
	else if (cMove == 'wO-OO') game.move({from:"e1", to: "c1"});
	else if (cMove == 'bO-O') game.move({from:"e8", to: "g8"});
	else if (cMove == 'bO-OO') game.move({from:"e8", to: "c8"});
	else
		game.move({
			from : cMove.substring(0,2),
			to : cMove.substring(3)
		});
	var newpos=board.move.apply(board,[cMove]);
}

//setting up chess.js
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
};

var detectIllegalMove = function(source, dest) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: dest,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });
  console.log("main.detectIllegalMove called with "+source+", "+dest);
  // illegal move
  if (move === null) return 'snapback';
  
};

var onSnapEnd = function() {
  board.position(game.fen());
};

function levelSelect(){
	gameMode = true;
	loadCategories();
	//$("#play-selection-col").html("");
	$(".options").css("display", "none");
	$("#viewOpening").css("display", "none");
	$("#backToTraining").toggle();
	$("#startGameMode").toggle();
	$("#startOver").css("display", "none");
}

function startGameMode(opCat){
	if (typeof opCat != 'string') opCat = 'A';
	loadPlays(opCat);	
	$("#play-selection-col").html("");
	console.log("starting game mode:");
	gameModeData.lives = 5;
	gameModeData.currentPlayIndex = 0;
	
}

function startLevel(plays){
	//At this point, plays are loaded. Here is where we sort by difficulty
	gameModeData.plays = plays;
	gameModeData.playKeys = Object.keys(gameModeData.plays);
	startNewPlay();
}

function startNewPlay(){
	if (gameModeData.currentPlayIndex < gameModeData.playKeys.length){
		theOpening = loadOpening(gameModeData.plays[gameModeData.playKeys[gameModeData.currentPlayIndex++]]);
		if (Math.random() > 0.5 ){
			whitePower = false;
		}
		else whitePower = true;
		$("#playName").html(theOpening.name);
		startOver();
		/*var cheatSheet = "SEQUENCE TO WIN: ";
		for (var j = 0; j < theOpening.arr.length; j++){
			if (j%2 == 0) cheatSheet+=theOpening.arr[j]+"     ";
		}
		console.log(cheatSheet);
		console.log(theOpening.pgn);*/
	}
	else{
		//game over you win
		$("#youWinImg").css("z-index", "3");
		if (!advSound) window.win.play();
		else playSound("win");
		$("#startGameMode").toggle();
		$("#youWinImg")
			.animate({opacity: "1", width: "100%"},1500, function(){ 
				$("#youWinImg").animate({opacity: "0", width: "50%", height:"50%"},750,
					function(){
						$("#youWinImg").css("width", "100%");
						$("#youWinImg").css("height", "100%");
						$("#youWinImg").css("z-index", "-2");
					}
				);
			});		
	}
}

function gameOver(){
	board.setDraggable(false);
	if (!advSound) window.lose.play();
	else playSound("loss");
	$("#youLoseImg").css("z-index", "3");
		$("#youLoseImg")
			.animate({opacity: "1", width: "100%"},1500, function(){ 
				setTimeout( function(){
					window.location.href = "index.html";
					}, 2000);
				});		
}
