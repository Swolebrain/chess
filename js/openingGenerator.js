
var startPos = {
	a1: "wR",
	a2: "wP",
	a7: "bP",
	a8: "bR",
	b1: "wN",
	b2: "wP",
	b7: "bP",
	b8: "bN",
	c1: "wB",
	c2: "wP",
	c7: "bP",
	c8: "bB",
	d1: "wQ",
	d2: "wP",
	d7: "bP",
	d8: "bQ",
	e1: "wK",
	e2: "wP",
	e7: "bP",
	e8: "bK",
	f1: "wB",
	f2: "wP",
	f7: "bP",
	f8: "bB",
	g1: "wN",
	g2: "wP",
	g7: "bP",
	g8: "bN",
	h1: "wR",
	h2: "wP",
	h7: "bP",
	h8: "bR"
};

//loadOpening = function(jsonData){	
function loadOpening(jsonData){
	//console.log("loading opening from json object:");
	//console.log(JSON.stringify(jsonData));
	var theOpening = {};
	theOpening.moves = [];
	theOpening.name = jsonData.name;
	theOpening.positions = [];
	theOpening.format = jsonData.format;
	if (jsonData.format == "FENPGN"){
		theOpening.startPos = board.fenToObj(jsonData.startPos);
		theOpening.arr = jsonData.arr;
		for (var j = 0; j < theOpening.arr.length; j++){
			var key = theOpening.arr[j].substring(0,2);
			var value = theOpening.arr[j].substring(3);
			var objx = {};
			objx[key] = value;
			theOpening.moves.push(objx);
		}
	}
	else if (jsonData.format == "FENPGN2"){
		theOpening.startPos = board.fenToObj(jsonData.startPos);
		var parsed = parsePGN(jsonData.pgn);
		console.log("Answer: "+jsonData.pgn);
		theOpening.arr = parsed;
		for (var j = 0; j < theOpening.arr.length; j++){
			var key = theOpening.arr[j].substring(0,2);
			var value = theOpening.arr[j].substring(3);
			var objx = {};
			objx[key] = value;
			theOpening.moves.push(objx);
		}
	}
	else{ // format = importedJson
		theOpening.arr = [];
		theOpening.startPos = parseStartPos(jsonData);
		for (var i =0; i< jsonData.solutionData.moves.length; i++){
			var move = objToMove(jsonData.solutionData.moves[i]);
			//console.log ("pushing move:  "+JSON.stringify(move)+" into opening "+theOpening.name);
			theOpening.arr.push(move);
			var key = move.substring(0,2);
			theOpening.moves[i] = {};
			theOpening.moves[i][key] = move.substring(3);
		}
	}
	for (var j = 0; j < theOpening.arr.length; j++){
		var posx;
		if (theOpening.positions.length == 0)
			posx = board.calculatePos(theOpening.startPos,theOpening.moves[j]);
		else
			posx = board.calculatePos(theOpening.positions[j-1],theOpening.moves[j]);
		theOpening.positions.push(posx);
	}

	
	//console.log("final loaded object:");
	//console.log(JSON.stringify(theOpening));
	
	return theOpening;
}

function objToMove(obj){
	var retVal = "";
	var xAxis = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	retVal += xAxis[obj.start_x]+""+(obj.start_y+1)+"-";
	retVal += ""+xAxis[obj.finish_x]+(obj.finish_y+1);
	return retVal;
}

function parseStartPos(data){
	var retVal = {};
	var obj = data.setupData.pieces_setup;
	var xAxis = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
	for (var i in obj){
		var key = ""+xAxis[obj[i].x]+(obj[i].y+1);
		if (obj[i].type == "Knight")
			retVal[key] = obj[i].color.substring(0,1)+"N";
		else
			retVal[key] = obj[i].color.substring(0,1)+obj[i].type.substring(0,1);
		//console.log(JSON.stringify(obj[i]));
	}
	return retVal;
}

function parsePGN(pgn){
	pgn = $.trim(pgn).replace(/\n|\r/g, ' ').replace(/\s+/g, ' ');
	pgn = pgn.replace(/^\d+\.+/, '');
    pgn = pgn.replace(/\s\d+\.+/g, ' ');
    pgn = pgn.replace(/\s\s+/g, ' ');
    pgn = pgn.replace(/^\s+/g, '');
    pgn = pgn.replace(/\s+$/g, '');
	var chessgame = new Chess();
	var array = pgn.split(" ");
	//console.log("parsePGN: parsing array ");
	//console.log(array);
	var arr = [];
	for (var i in array){
		var mvRes = chessgame.move(array[i]);
		var stringifiedMove = mvRes.from+"-"+mvRes.to;
		if (stringifiedMove == 'e1-g1') arr.push('wO-O');
		else if (stringifiedMove == 'e1-c1') arr.push('wO-OO');
		else if (stringifiedMove == 'e8-g8') arr.push('bO-O');
		else if (stringifiedMove == 'e8-c8') arr.push('bO-OO');
		else arr.push(stringifiedMove);
	}
	return arr;
}

