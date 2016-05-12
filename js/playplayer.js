var board;

function playerInit(){
	var cfg = {
		draggable: true,
		position: 'start'
	};
	board = new ChessBoard('board', cfg);
	$("#load-btn").click(loadData);
	$("#run-btn").click(runSequence);
}

function playAnims(moves, delays){
	
	var first = moves.slice(0,1);
	var firstd = delays.slice(0,1);
	var moves2 = moves.slice(1);
	var delays2 = delays.slice(1);
	setTimeout(function(){
		if (first[0].length < 8){
			console.log("running anim for moves["+0+"]: "+first+" bc first.length is "+first[0].length);
			board.move.apply(board,first);
		}
		else{
			console.log("running board pos for FEN: "+first);
			board.position.apply(board, first, true);
		}
		if (moves2.length > 0)
			playAnims(moves2, delays2);
		else return;
	}, firstd);
	
}

function loadData(){
	var retVal = {"delays":[],"moves":[]};
	var inputArr = $('textarea').val().split('\n');
	for (var i = 0; i < inputArr.length; i++){
		var regex = /^(\S+) (\d+):(\d+):(\d+)\.(\d+)$/;
		var matched = regex.exec(inputArr[i]); //array: [move/fen, hour, min, sec, ms]
		if (!matched ){
			$("#run-output").append("Failed to recognize line "+i+"<br>");
			console.log("matched regex for"+i+":");
			console.log(matched);
		}
		else{
			var timeStamp = parseInt(matched[2])*60*60*1000 + 
					parseInt(matched[3])*60000 + 
					parseInt(matched[4])*1000 + 
					parseInt(matched[5]);
			var cumDelay = 0;
			for (var j = 0; j < i; j++)
				cumDelay += retVal.delays[j];
			var curDelay = timeStamp - cumDelay;
			retVal.delays.push(curDelay);
			retVal.moves.push(matched[1]);
			if (matched[1].length > 5) $("#run-output").append("FEN will be loaded after delay of "+curDelay+"<br>");
			else $("#run-output").append("MOVE "+matched[1]+" will be loaded after delay of "+curDelay+"<br>");
		}
	}
	return retVal;
}

function runSequence(){
	var md = loadData();
	if (md){
		playAnims(md.moves, md.delays);
	}
	else{
		$("#run-output").append("something fucked up when loading the sequence");
	}
}