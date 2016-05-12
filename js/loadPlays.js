
function loadNewOpening(op){
	loadedJson = $.getJSON('http://www.swolebrain.com:8080/api/openings/'+op,
				function(data, textStatus){
					theOpening = loadOpening(data);
					board.interrupt();
					board.setDraggable(true);
					board.position(theOpening.startPos);
					playerMoves = 0;
					$("#playName").html(theOpening.name);
					$("#startOver").html("Let me Try");	
					startOver();
					//console.log("loaded opening ");
					//console.log(theOpening);
				}).error(function(e){
					console.log("ajax request to load new opening resulted in error:");
					console.log(e.getAllResponseHeaders());
					
				});
}

//this loads all the plays in a given category. Param is a string with a 
//category name
function loadPlays(cat){
	var ajaxArg;
	if (cat == "all")
		ajaxArg = 'http://www.swolebrain.com:8080/api/openings/all';
	else
		ajaxArg = 'http://www.swolebrain.com:8080/api/openings/cat'+cat;
	var plays = $.getJSON(ajaxArg,
				function(data, textStatus){
					//console.log("Requested all plays, received:");
					//console.log(data);
					if (!gameMode){
						$("#play-selection-col").html("<h4>Choose the Opening you want to practice</h4>");
						$("#play-selection-col").append("<ul>");
						for (var i in data)
							$("#play-selection-col").append('<li><a href="#" class="play-selector" id="'+i+'">'+
									data[i].name+'</a></li>');
						$("#play-selection-col").append('<br>');
						$("#play-selection-col").append('<li><a href="#" id="back-to-cat">'+
									'Back to Categories</a></li>');
						$("#play-selection-col").append("</ul>");
						assignPlayClickHandlers();
						$("#back-to-cat").click(function(e){
							loadCategories();
						});
					}
					else{
						startLevel(data);
					}
				}).error(function(e){
					console.log("ajax request for plays resulted in error:");
					console.log(e.getAllResponseHeaders());
					
				});
	
	
}

function loadCategories(){
	var plays = $.getJSON('http://www.swolebrain.com:8080/api/openings/categories',
				function(data, textStatus){
					if (!gameMode){
						$("#play-selection-col").html("<h3>Choose your Category Group:</h3>");
						$("#play-selection-col").append("<ul>");
						for (var i in data){
							//console.log ("loadCategories: var i: "+i+", data[i]: "+data[i]);
							$("#play-selection-col").append('<li><a href="#" class="cat-selector" id="'+data[i]+'">'+
									data[i]+' Openings</a></li>');
						}
						$("#play-selection-col").append("</ul>");
						assignCatClickHandlers();
					}
					else{
						$("#play-selection-col").html("<h3>Choose the level you wish to play:</h3>");
						$("#play-selection-col").append("<ul>");
						for (var i in data){
							//console.log ("loadCategories: var i: "+i+", data[i]: "+data[i]);
							$("#play-selection-col").append('<li class="btn level-selector" id="'+data[i]+'">'+
									data[i]+'</li>');
						}
						$("#play-selection-col").append('<li class="btn level-selector" id="all">All</li>');
						$("#play-selection-col").append("</ul>");
						assignCatClickHandlers();
					}
				}).error(function(e){
					console.log("ajax request for Categories resulted in error:");
					console.log(e.getAllResponseHeaders());
					
				});
}

function assignPlayClickHandlers(){
	var items = $(".play-selector");
	items.click(function(e){
		loadNewOpening($(this).attr('id'));
		
	});
}
function assignCatClickHandlers(){
	if (!gameMode){
		var items = $(".cat-selector");
		items.click(function(e){
			loadPlays($(this).attr('id'));
			
		});
	}
	else{
		var items = $(".level-selector");
		items.css("display", "block");
		items.click(function(e){
			startGameMode($(this).attr('id'));
		});
	}
}

loadCategories();


