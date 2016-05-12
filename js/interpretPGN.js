
var retVal = [];
var pgnStr = "1.e4 c6 2.d4 d5 3.e5 Bf5 4.Nf3 e6 5.Be2 "
var cols = {'a':1, 'b':2, 'c':3, 'd':4, 'e':5, 'f':6, 'g':7, 'h':8};
var startPos = {a1: "wR",a2: "wP",a7: "bP",a8: "bR",b1: "wN",b2: "wP",b7: "bP",b8: "bN",c1: "wB",c2: "wP",c7: "bP",c8: "bB",d1: "wQ",d2: "wP",d7: "bP",d8: "bQ",e1: "wK",e2: "wP",e7: "bP",e8: "bK",f1: "wB",f2: "wP",f7: "bP",f8: "bB",g1: "wN",g2: "wP",g7: "bP",g8: "bN",h1: "wR",h2: "wP",h7: "bP",h8: "bR"};


var interpretPGN = function(pgn, pos){
    var ctr = 1;
    var newPos = pos;
    while (ctr != -1){
 	if (pgn.indexOf(""+ctr+".") != -1){
	    var chunk;
	    if (pgn.indexOf(""+(ctr+1)+".") != -1)
		chunk = pgn.substring(pgn.indexOf(ctr+"."),pgn.indexOf((ctr+1)+"."));
	    else
		chunk = pgn.substring(pgn.indexOf(ctr+"."));
	    if (chunk){
		chunk = chunk.substring(2);
	    }
	    var white = chunk.substring(0, chunk.indexOf(" "));
	    var black = chunk.substring(chunk.indexOf(" ")+1);
	    newPos  = handleWhiteMove(white, newPos);
	    newPos = handleBlackMove(black, newPos);
	}
	else
	     break;
	
        ctr++;
    }

}

function handleWhiteMove(wm, pos){
	wm = wm.trim();
	if (wm.length == 2){
		var col = wm.substring(0,1);
		for (var i in pos){
			if (i.substring(0,1) == col && pos[i] == 'wP'){
				delete pos[i];
				pos[wm] = 'wP';
				console.log("found white move: "+i+"-"+wm);
				return pos;
			}
		}
		console.log("couldn't find white move "+wm);
	}
}
function handleBlackMove(bm, pos){
	bm = bm.trim();
        if (bm.length == 2){
                var col = bm.substring(0,1);
                for (var i in pos){
                        if (i.substring(0,1) == col && pos[i] == 'bP'){
                                delete pos[i];
                                pos[bm] = 'bP';
				console.log("found black move: "+i+"-"+bm);
                                return pos;
                        }
                }
                console.log("couldn't find black move "+wm);
        }
}


interpretPGN(pgnStr, startPos);
//console.log(interpretPGN(pgnStr));


