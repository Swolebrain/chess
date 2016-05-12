/*!
 * chessboard.js v0.3.0
 *
 * Copyright 2013 Chris Oakman
 * Released under the MIT license
 * http://chessboardjs.com/license
 *
 * Date: 10 Aug 2013
 */

// start anonymous scope
;(function() {
'use strict';

//------------------------------------------------------------------------------
// Chess Util Functions
//------------------------------------------------------------------------------
var COLUMNS = 'abcdefgh'.split('');

function validMove(move) {
  // move should be a string
  if (typeof move !== 'string') return false;

  // move should be in the form of "e2-e4", "f6-d5"
  var tmp = move.split('-');
  if (tmp.length !== 2) return false;

  return (validSquare(tmp[0]) === true && validSquare(tmp[1]) === true);
}

function validSquare(square) {
  if (typeof square !== 'string') return false;
  return (square.search(/^[a-h][1-8]$/) !== -1);
}

function validPieceCode(code) {
  if (typeof code !== 'string') return false;
  return (code.search(/^[bw][KQRNBP]$/) !== -1);
}

// TODO: this whole function could probably be replaced with a single regex
function validFen(fen) {
  if (typeof fen !== 'string') return false;

  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '');

  // FEN should be 8 sections separated by slashes
  var chunks = fen.split('/');
  if (chunks.length !== 8) return false;

  // check the piece sections
  for (var i = 0; i < 8; i++) {
    if (chunks[i] === '' ||
        chunks[i].length > 8 ||
        chunks[i].search(/[^kqrbnpKQRNBP1-8]/) !== -1) {
      return false;
    }
  }

  return true;
}

function validPositionObject(pos) {
  if (typeof pos !== 'object') return false;

  for (var i in pos) {
    if (pos.hasOwnProperty(i) !== true) continue;

    if (validSquare(i) !== true || validPieceCode(pos[i]) !== true) {
      return false;
    }
  }

  return true;
}

// convert FEN piece code to bP, wK, etc
function fenToPieceCode(piece) {
  // black piece
  if (piece.toLowerCase() === piece) {
    return 'b' + piece.toUpperCase();
  }

  // white piece
  return 'w' + piece.toUpperCase();
}

// convert bP, wK, etc code to FEN structure
function pieceCodeToFen(piece) {
  var tmp = piece.split('');

  // white piece
  if (tmp[0] === 'w') {
    return tmp[1].toUpperCase();
  }

  // black piece
  return tmp[1].toLowerCase();
}

// convert FEN string to position object
// returns false if the FEN string is invalid
//MADE CHANGES HERE VM
//function fenToObj(fen) {
var fenToObj = function(fen){
  if (validFen(fen) !== true) {
    return false;
  }

  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  fen = fen.replace(/ .+$/, '');

  var rows = fen.split('/');
  var position = {};

  var currentRow = 8;
  for (var i = 0; i < 8; i++) {
    var row = rows[i].split('');
    var colIndex = 0;

    // loop through each character in the FEN section
    for (var j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-8]/) !== -1) {
        var emptySquares = parseInt(row[j], 10);
        colIndex += emptySquares;
      }
      // piece
      else {
        var square = COLUMNS[colIndex] + currentRow;
        position[square] = fenToPieceCode(row[j]);
        colIndex++;
      }
    }

    currentRow--;
  }

  return position;
}

// position object to FEN string
// returns false if the obj is not a valid position object
//more vm changes
function objToFen(obj) {
  if (validPositionObject(obj) !== true) {
    return false;
  }

  var fen = '';

  var currentRow = 8;
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      var square = COLUMNS[j] + currentRow;

      // piece exists
      if (obj.hasOwnProperty(square) === true) {
        fen += pieceCodeToFen(obj[square]);
      }

      // empty space
      else {
        fen += '1';
      }
    }

    if (i !== 7) {
      fen += '/';
    }

    currentRow--;
  }

  // squeeze the numbers together
  // haha, I love this solution...
  fen = fen.replace(/11111111/g, '8');
  fen = fen.replace(/1111111/g, '7');
  fen = fen.replace(/111111/g, '6');
  fen = fen.replace(/11111/g, '5');
  fen = fen.replace(/1111/g, '4');
  fen = fen.replace(/111/g, '3');
  fen = fen.replace(/11/g, '2');

  return fen;
}

window['ChessBoard'] = window['ChessBoard'] || function(containerElOrId, cfg) {
'use strict';

cfg = cfg || {};

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

var MINIMUM_JQUERY_VERSION = '1.7.0',
  START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
  START_POSITION = fenToObj(START_FEN);

// use unique class names to prevent clashing with anything else on the page
// and simplify selectors
var CSS = {
  alpha: 'alpha-d2270',
  black: 'black-3c85d',
  board: 'board-b72b1',
  chessboard: 'chessboard-63f37',
  clearfix: 'clearfix-7da63',
  highlight1: 'highlight1-32417',
  highlight2: 'highlight2-9c5d2',
  notation: 'notation-322f9',
  numeric: 'numeric-fc462',
  piece: 'piece-417db',
  row: 'row-5277c',
  sparePieces: 'spare-pieces-7492f',
  sparePiecesBottom: 'spare-pieces-bottom-ae20f',
  sparePiecesTop: 'spare-pieces-top-4028b',
  square: 'square-55d63',
  white: 'white-1e1d7'
};

//------------------------------------------------------------------------------
// Module Scope Variables
//------------------------------------------------------------------------------

// DOM elements
var containerEl,
  boardEl,
  draggedPieceEl,
  sparePiecesTopEl,
  sparePiecesBottomEl,
  animPieceElement;

// constructor return object
var widget = {};

//------------------------------------------------------------------------------
// Stateful
//------------------------------------------------------------------------------

var ANIMATION_HAPPENING = false,
  BOARD_BORDER_SIZE = 2,
  CURRENT_ORIENTATION = 'white',
  CURRENT_POSITION = {},
  SQUARE_SIZE,
  DRAGGED_PIECE,
  DRAGGED_PIECE_LOCATION,
  DRAGGED_PIECE_SOURCE,
  DRAGGING_A_PIECE = false,
  SPARE_PIECE_ELS_IDS = {},
  SQUARE_ELS_IDS = {},
  SQUARE_ELS_OFFSETS;
var animInterval = 400;
var INTERRUPT = false;
var WHITE_CAN_CASTLE = true;
var BLACK_CAN_CASTLE = true;

//------------------------------------------------------------------------------
// JS Util Functions
//------------------------------------------------------------------------------

// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
function createId() {
  return 'xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function(c) {
    var r = Math.random() * 16 | 0;
    return r.toString(16);
  });
}

function deepCopy(thing) {
  return JSON.parse(JSON.stringify(thing));
}

function parseSemVer(version) {
  var tmp = version.split('.');
  return {
    major: parseInt(tmp[0], 10),
    minor: parseInt(tmp[1], 10),
    patch: parseInt(tmp[2], 10)
  };
}

// returns true if version is >= minimum
function compareSemVer(version, minimum) {
  version = parseSemVer(version);
  minimum = parseSemVer(minimum);

  var versionNum = (version.major * 10000 * 10000) +
    (version.minor * 10000) + version.patch;
  var minimumNum = (minimum.major * 10000 * 10000) +
    (minimum.minor * 10000) + minimum.patch;

  return (versionNum >= minimumNum);
}

//------------------------------------------------------------------------------
// Validation / Errors
//------------------------------------------------------------------------------

function error(code, msg, obj) {
  // do nothing if showErrors is not set
  if (cfg.hasOwnProperty('showErrors') !== true ||
      cfg.showErrors === false) {
    return;
  }

  var errorText = 'ChessBoard Error ' + code + ': ' + msg;

  // print to console
  if (cfg.showErrors === 'console' &&
      typeof console === 'object' &&
      typeof console.log === 'function') {
    console.log(errorText);
    if (arguments.length >= 2) {
      console.log(obj);
    }
    return;
  }

  // alert errors
  if (cfg.showErrors === 'alert') {
    if (obj) {
      errorText += '\n\n' + JSON.stringify(obj);
    }
    window.alert(errorText);
    return;
  }

  // custom function
  if (typeof cfg.showErrors === 'function') {
    cfg.showErrors(code, msg, obj);
  }
}

// check dependencies
function checkDeps() {
  // if containerId is a string, it must be the ID of a DOM node
  if (typeof containerElOrId === 'string') {
    // cannot be empty
    if (containerElOrId === '') {
      window.alert('ChessBoard Error 1001: ' +
        'The first argument to ChessBoard() cannot be an empty string.' +
        '\n\nExiting...');
      return false;
    }

    // make sure the container element exists in the DOM
    var el = document.getElementById(containerElOrId);
    if (! el) {
      window.alert('ChessBoard Error 1002: Element with id "' +
        containerElOrId + '" does not exist in the DOM.' +
        '\n\nExiting...');
      return false;
    }

    // set the containerEl
    containerEl = $(el);
  }

  // else it must be something that becomes a jQuery collection
  // with size 1
  // ie: a single DOM node or jQuery object
  else {
    containerEl = $(containerElOrId);

    if (containerEl.length !== 1) {
      window.alert('ChessBoard Error 1003: The first argument to ' +
        'ChessBoard() must be an ID or a single DOM node.' +
        '\n\nExiting...');
      return false;
    }
  }

  // JSON must exist
  if (! window.JSON ||
      typeof JSON.stringify !== 'function' ||
      typeof JSON.parse !== 'function') {
    window.alert('ChessBoard Error 1004: JSON does not exist. ' +
      'Please include a JSON polyfill.\n\nExiting...');
    return false;
  }

  // check for a compatible version of jQuery
  if (! (typeof window.$ && $.fn && $.fn.jquery &&
      compareSemVer($.fn.jquery, MINIMUM_JQUERY_VERSION) === true)) {
    window.alert('ChessBoard Error 1005: Unable to find a valid version ' +
      'of jQuery. Please include jQuery ' + MINIMUM_JQUERY_VERSION + ' or ' +
      'higher on the page.\n\nExiting...');
    return false;
  }

  return true;
}

function validAnimationSpeed(speed) {
  if (speed === 'fast' || speed === 'slow') {
    return true;
  }

  if ((parseInt(speed, 10) + '') !== (speed + '')) {
    return false;
  }

  return (speed >= 0);
}

// validate config / set default options
function expandConfig() {
  if (typeof cfg === 'string' || validPositionObject(cfg) === true) {
    cfg = {
      position: cfg
    };
  }

  // default for orientation is white
  if (cfg.orientation !== 'black') {
    cfg.orientation = 'white';
  }
  CURRENT_ORIENTATION = cfg.orientation;

  // default for showNotation is true
  if (cfg.showNotation !== false) {
    cfg.showNotation = true;
  }

  // default for draggable is false
  if (cfg.draggable !== true) {
    cfg.draggable = false;
  }

  // default for dropOffBoard is 'snapback'
  if (cfg.dropOffBoard !== 'trash') {
    cfg.dropOffBoard = 'snapback';
  }

  // default for sparePieces is false
  if (cfg.sparePieces !== true) {
    cfg.sparePieces = false;
  }

  // draggable must be true if sparePieces is enabled
  if (cfg.sparePieces === true) {
    cfg.draggable = true;
  }

  // default piece theme is wikipedia
  if (cfg.hasOwnProperty('pieceTheme') !== true ||
      (typeof cfg.pieceTheme !== 'string' &&
       typeof cfg.pieceTheme !== 'function')) {
    cfg.pieceTheme = 'img/chesspieces/wikipedia/{piece}.png';
  }

  // animation speeds
  if (cfg.hasOwnProperty('appearSpeed') !== true ||
      validAnimationSpeed(cfg.appearSpeed) !== true) {
    cfg.appearSpeed = 200;
  }
  if (cfg.hasOwnProperty('moveSpeed') !== true ||
      validAnimationSpeed(cfg.moveSpeed) !== true) {
    cfg.moveSpeed = 200;
  }
  if (cfg.hasOwnProperty('snapbackSpeed') !== true ||
      validAnimationSpeed(cfg.snapbackSpeed) !== true) {
    cfg.snapbackSpeed = 50;
  }
  if (cfg.hasOwnProperty('snapSpeed') !== true ||
      validAnimationSpeed(cfg.snapSpeed) !== true) {
    cfg.snapSpeed = 25;
  }
  if (cfg.hasOwnProperty('trashSpeed') !== true ||
      validAnimationSpeed(cfg.trashSpeed) !== true) {
    cfg.trashSpeed = 100;
  }

  // make sure position is valid
  if (cfg.hasOwnProperty('position') === true) {
    if (cfg.position === 'start') {
      CURRENT_POSITION = deepCopy(START_POSITION);
    }

    else if (validFen(cfg.position) === true) {
      CURRENT_POSITION = fenToObj(cfg.position);
    }

    else if (validPositionObject(cfg.position) === true) {
      CURRENT_POSITION = deepCopy(cfg.position);
    }

    else {
      error(7263, 'Invalid value passed to config.position.', cfg.position);
    }
  }

  return true;
}

//------------------------------------------------------------------------------
// DOM Misc
//------------------------------------------------------------------------------

// calculates square size based on the width of the container
// got a little CSS black magic here, so let me explain:
// get the width of the container element (could be anything), reduce by 1 for
// fudge factor, and then keep reducing until we find an exact mod 8 for
// our square size
function calculateSquareSize() {
  var containerWidth = parseInt(containerEl.css('width'), 10);

  // defensive, prevent infinite loop
  if (! containerWidth || containerWidth <= 0) {
    return 0;
  }

  // pad one pixel
  var boardWidth = containerWidth - 1;

  while (boardWidth % 8 !== 0 && boardWidth > 0) {
    boardWidth--;
  }

  return (boardWidth / 8);
}

// create random IDs for elements
function createElIds() {
  // squares on the board
  for (var i = 0; i < COLUMNS.length; i++) {
    for (var j = 1; j <= 8; j++) {
      var square = COLUMNS[i] + j;
      SQUARE_ELS_IDS[square] = square + '-' + createId();
    }
  }

  // spare pieces
  var pieces = 'KQRBNP'.split('');
  for (var i = 0; i < pieces.length; i++) {
    var whitePiece = 'w' + pieces[i];
    var blackPiece = 'b' + pieces[i];
    SPARE_PIECE_ELS_IDS[whitePiece] = whitePiece + '-' + createId();
    SPARE_PIECE_ELS_IDS[blackPiece] = blackPiece + '-' + createId();
  }
}

//------------------------------------------------------------------------------
// Markup Building
//------------------------------------------------------------------------------

function buildBoardContainer() {
  var html = '<div class="' + CSS.chessboard + '">';

  if (cfg.sparePieces === true) {
    html += '<div class="' + CSS.sparePieces + ' ' +
      CSS.sparePiecesTop + '"></div>';
  }

  html += '<div class="' + CSS.board + '"></div>';

  if (cfg.sparePieces === true) {
    html += '<div class="' + CSS.sparePieces + ' ' +
      CSS.sparePiecesBottom + '"></div>';
  }

  html += '</div>';

  return html;
}

/*
var buildSquare = function(color, size, id) {
  var html = '<div class="' + CSS.square + ' ' + CSS[color] + '" ' +
  'style="width: ' + size + 'px; height: ' + size + 'px" ' +
  'id="' + id + '">';

  if (cfg.showNotation === true) {

  }

  html += '</div>';

  return html;
};
*/

function buildBoard(orientation) {
  if (orientation !== 'black') {
    orientation = 'white';
  }

  var html = '';

  // algebraic notation / orientation
  var alpha = deepCopy(COLUMNS);
  var row = 8;
  if (orientation === 'black') {
    alpha.reverse();
    row = 1;
  }

  var squareColor = 'white';
  for (var i = 0; i < 8; i++) {
    html += '<div class="' + CSS.row + '">';
    for (var j = 0; j < 8; j++) {
      var square = alpha[j] + row;

      html += '<div class="' + CSS.square + ' ' + CSS[squareColor] + ' ' +
        'square-' + square + '" ' +
        'style="width: ' + SQUARE_SIZE + 'px; height: ' + SQUARE_SIZE + 'px" ' +
        'id="' + SQUARE_ELS_IDS[square] + '" ' +
        'data-square="' + square + '">';

      if (cfg.showNotation === true) {
        // alpha notation
        if ((orientation === 'white' && row === 1) ||
            (orientation === 'black' && row === 8)) {
          html += '<div class="' + CSS.notation + ' ' + CSS.alpha + '">' +
            alpha[j] + '</div>';
        }

        // numeric notation
        if (j === 0) {
          html += '<div class="' + CSS.notation + ' ' + CSS.numeric + '">' +
            row + '</div>';
        }
      }

      html += '</div>'; // end .square

      squareColor = (squareColor === 'white' ? 'black' : 'white');
    }
    html += '<div class="' + CSS.clearfix + '"></div></div>';

    squareColor = (squareColor === 'white' ? 'black' : 'white');

    if (orientation === 'white') {
      row--;
    }
    else {
      row++;
    }
  }

  return html;
}

function buildPieceImgSrc(piece) {
  if (typeof cfg.pieceTheme === 'function') {
    return cfg.pieceTheme(piece);
  }

  if (typeof cfg.pieceTheme === 'string') {
    return cfg.pieceTheme.replace(/{piece}/g, piece);
  }

  // NOTE: this should never happen
  error(8272, 'Unable to build image source for cfg.pieceTheme.');
  return '';
}

function buildPiece(piece, hidden, id) {
  var html = '<img src="' + buildPieceImgSrc(piece) + '" ';
  if (id && typeof id === 'string') {
    html += 'id="' + id + '" ';
  }
  html += 'alt="" ' +
  'class="' + CSS.piece + '" ' +
  'data-piece="' + piece + '" ' +
  'style="width: ' + SQUARE_SIZE + 'px;' +
  'height: ' + SQUARE_SIZE + 'px;';
  if (hidden === true) {
    html += 'display:none;';
  }
  html += '" />';

  return html;
}

function buildSparePieces(color) {
  var pieces = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP'];
  if (color === 'black') {
    pieces = ['bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
  }

  var html = '';
  for (var i = 0; i < pieces.length; i++) {
    html += buildPiece(pieces[i], false, SPARE_PIECE_ELS_IDS[pieces[i]]);
  }

  return html;
}

//------------------------------------------------------------------------------
// Animations
//------------------------------------------------------------------------------

function animateSquareToSquare(src, dest, piece, completeFn) {
  //ANIMATION_HAPPENING = true;
  // get information about the source and destination squares
  //console.log("animatesquaretosquare("+src+", "+dest+", "+piece+", fn)");
  var srcSquareEl = $('#' + SQUARE_ELS_IDS[src]);
  var srcSquarePosition = srcSquareEl.offset();
  var destSquareEl = $('#' + SQUARE_ELS_IDS[dest]);
  var destSquarePosition = destSquareEl.offset();

  // create the animated piece and absolutely position it
  // over the source square
  var animatedPieceId = createId();
  var newPiece = buildPiece(piece, true, animatedPieceId);
  $('body').append(newPiece);
  //console.log("called animateSquareToSquare("+src+", "+dest+", "+piece+", onFinish)");
  var animatedPieceEl = $('#' + animatedPieceId);
  animatedPieceEl.css({
    display: '',
    position: 'absolute',
    top: srcSquarePosition.top,
    left: srcSquarePosition.left
  });
  animPieceElement = animatedPieceEl;
  // remove original piece from source square
  srcSquareEl.find('.' + CSS.piece).remove();

  // on complete
  var complete = function() {
    // add the "real" piece to the destination square
    destSquareEl.append(buildPiece(piece));

    // remove the animated piece
    animPieceElement = null;
    animatedPieceEl.remove();
	
    // run complete function
	
	drawPositionInstant();
    if (typeof completeFn === 'function') {
      		completeFn();
    }
    //animatedPieceEl.remove();
	//var str = buildPiece(piece);
	//destSquareEl.append(str);
  };

  // animate the piece to the destination square
  var opts = {
    duration: cfg.moveSpeed,
    complete: complete
  };
  //console.log("calling animate with ");
  //console.log(destSquarePosition);
  //console.log("---------------------------");
  if (numFinished == 0 ){
	  animatedPieceEl.animate(destSquarePosition, opts.duration, "linear", opts.complete);
	  //console.log("running animate without delay");
  }
  else 
  	animatedPieceEl.delay(animInterval).animate(destSquarePosition, opts.duration, "linear", opts.complete);
}

function animateSparePieceToSquare(piece, dest, completeFn) {
  var srcOffset = $('#' + SPARE_PIECE_ELS_IDS[piece]).offset();
  var destSquareEl = $('#' + SQUARE_ELS_IDS[dest]);
  var destOffset = destSquareEl.offset();

  // create the animate piece
  var pieceId = createId();
  $('body').append(buildPiece(piece, true, pieceId));
  var animatedPieceEl = $('#' + pieceId);
  animatedPieceEl.css({
    display: '',
    position: 'absolute',
    left: srcOffset.left,
    top: srcOffset.top
  });

  // on complete
  var complete = function() {
    // add the "real" piece to the destination square
    destSquareEl.find('.' + CSS.piece).remove();
    destSquareEl.append(buildPiece(piece));

    // remove the animated piece
    animatedPieceEl.remove();

    // run complete function
    if (typeof completeFn === 'function') {
      completeFn();
    }
  };

  // animate the piece to the destination square
  var opts = {
    duration: cfg.moveSpeed,
    complete: complete
  };
  animatedPieceEl.animate(destOffset, opts);
}

// execute an array of animations
function doAnimations(a, oldPos, newPos, cb) {
  if (a.length == 0){
	  ANIMATION_HAPPENING = false;
	  return;
  }
  //ANIMATION_HAPPENING = true;
  function onFinish() {
    
    //drawPositionInstant();
    //ANIMATION_HAPPENING = false;
    // run their onMoveEnd function
    if (cfg.hasOwnProperty('onMoveEnd') === true &&
      typeof cfg.onMoveEnd === 'function') {
      cfg.onMoveEnd(deepCopy(oldPos), deepCopy(newPos));
    }
	if (a.length >= 1){
		/*animateSquareToSquare(a[numFinished].source, a[numFinished].destination, a[numFinished].piece,
        onFinish);*/
		if (typeof cb == 'function')
			cb();
	}
    //ANIMATION_HAPPENING = false;
	//console.log("onFinish ran the whole way");
  }
  //run the first animation
  if (a[0].type === 'move') {
      //console.log("calling animateSquareToSquare("+a[0].source+", "+a[0].destination+", "+a[0].piece+")");
      animateSquareToSquare(a[0].source, a[0].destination, a[0].piece,
        onFinish);
  }

  for (var i = 0; i < a.length; i++) {
    // clear a piece
    if (a[i].type === 'clear') {
      $('#' + SQUARE_ELS_IDS[a[i].square] + ' .' + CSS.piece)
        .fadeOut(cfg.trashSpeed, onFinish);
    }

    // add a piece (no spare pieces)
    if (a[i].type === 'add' && cfg.sparePieces !== true) {
      $('#' + SQUARE_ELS_IDS[a[i].square])
        .append(buildPiece(a[i].piece, true))
        .find('.' + CSS.piece)
        .fadeIn(cfg.appearSpeed, onFinish);
    }

    // add a piece from a spare piece
    if (a[i].type === 'add' && cfg.sparePieces === true) {
      animateSparePieceToSquare(a[i].piece, a[i].square, onFinish);
    }

    // move a piece
    /*if (a[i].type === 'move') {
      animateSquareToSquare(a[i].source, a[i].destination, a[i].piece,
        onFinish);
    }*/
  }
}

// returns the distance between two squares
function squareDistance(s1, s2) {
  s1 = s1.split('');
  var s1x = COLUMNS.indexOf(s1[0]) + 1;
  var s1y = parseInt(s1[1], 10);

  s2 = s2.split('');
  var s2x = COLUMNS.indexOf(s2[0]) + 1;
  var s2y = parseInt(s2[1], 10);

  var xDelta = Math.abs(s1x - s2x);
  var yDelta = Math.abs(s1y - s2y);

  if (xDelta >= yDelta) return xDelta;
  return yDelta;
}

// returns an array of closest squares from square
function createRadius(square) {
  var squares = [];

  // calculate distance of all squares
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      var s = COLUMNS[i] + (j + 1);

      // skip the square we're starting from
      if (square === s) continue;

      squares.push({
        square: s,
        distance: squareDistance(square, s)
      });
    }
  }

  // sort by distance
  squares.sort(function(a, b) {
    return a.distance - b.distance;
  });

  // just return the square code
  var squares2 = [];
  for (var i = 0; i < squares.length; i++) {
    squares2.push(squares[i].square);
  }

  return squares2;
}

// returns the square of the closest instance of piece
// returns false if no instance of piece is found in position
function findClosestPiece(position, piece, square) {
  // create array of closest squares from square
  var closestSquares = createRadius(square);

  // search through the position in order of distance for the piece
  for (var i = 0; i < closestSquares.length; i++) {
    var s = closestSquares[i];

    if (position.hasOwnProperty(s) === true && position[s] === piece) {
      return s;
    }
  }

  return false;
}

// calculate an array of animations that need to happen in order to get
// from pos1 to pos2
function calculateAnimations(pos1, pos2) {
  // make copies of both
  pos1 = deepCopy(pos1);
  pos2 = deepCopy(pos2);

  var animations = [];
  var squaresMovedTo = {};

  // remove pieces that are the same in both positions
  for (var i in pos2) {
    if (pos2.hasOwnProperty(i) !== true) continue;

    if (pos1.hasOwnProperty(i) === true && pos1[i] === pos2[i]) {
      delete pos1[i];
      delete pos2[i];
    }
  }

  // find all the "move" animations
  for (var i in pos2) {
    if (pos2.hasOwnProperty(i) !== true) continue;

    var closestPiece = findClosestPiece(pos1, pos2[i], i);
    if (closestPiece !== false) {
      animations.push({
        type: 'move',
        source: closestPiece,
        destination: i,
        piece: pos2[i]
      });

      delete pos1[closestPiece];
      delete pos2[i];
      squaresMovedTo[i] = true;
    }
  }

  // add pieces to pos2
  for (var i in pos2) {
    if (pos2.hasOwnProperty(i) !== true) continue;

    animations.push({
      type: 'add',
      square: i,
      piece: pos2[i]
    })

    delete pos2[i];
  }

  // clear pieces from pos1
  for (var i in pos1) {
    if (pos1.hasOwnProperty(i) !== true) continue;

    // do not clear a piece if it is on a square that is the result
    // of a "move", ie: a piece capture
    if (squaresMovedTo.hasOwnProperty(i) === true) continue;

    animations.push({
      type: 'clear',
      square: i,
      piece: pos1[i]
    });

    delete pos1[i];
  }

  return animations;
}

//------------------------------------------------------------------------------
// Control Flow
//------------------------------------------------------------------------------

function drawPositionInstant() {
  // clear the board
  boardEl.find('.' + CSS.piece).remove();

  // add the pieces
  for (var i in CURRENT_POSITION) {
    if (!CURRENT_POSITION.hasOwnProperty(i)) continue;

    $('#' + SQUARE_ELS_IDS[i]).append(buildPiece(CURRENT_POSITION[i]));
  }
}

function drawBoard() {
  boardEl.html(buildBoard(CURRENT_ORIENTATION));
  drawPositionInstant();

  if (cfg.sparePieces === true) {
    if (CURRENT_ORIENTATION === 'white') {
      sparePiecesTopEl.html(buildSparePieces('black'));
      sparePiecesBottomEl.html(buildSparePieces('white'));
    }
    else {
      sparePiecesTopEl.html(buildSparePieces('white'));
      sparePiecesBottomEl.html(buildSparePieces('black'));
    }
  }
}

// given a position and a set of moves, return a new position
// with the moves executed

//old header:
//function calculatePositionFromMoves(position, moves) {
var calculatePositionFromMoves = function(position, moves){
  position = deepCopy(position);
  //console.log("calculatePositionFromMoves: ");
  for (var i in moves) {
		//console.log(i);
    if (moves.hasOwnProperty(i) !== true) continue;

    // skip the move if the position doesn't have a piece on the source square
    if (position.hasOwnProperty(i) !== true ){  //COMMENTED OUT STUFF FROM CASTLING
		if (i != "bO" && i != "wO")
			continue;
	}
	/*if (position.hasOwnProperty(i) !== true ){ 
		continue;
	}*/
	
	if (i == "bO"){
		var king = position["e8"];
		delete position["e8"];
		
		if (moves[i] == "OO"){
			var rook = position["a8"];
			delete position["a8"];
		}
		else if (moves[i] == "O"){
			var rook = position["h8"];
			delete position["h8"];
		}
		else 
			console.error("error trying to castle the black king!");
		
		position["g8"] = king;
		position["f8"] = rook;
		
	}
	else if (i == "wO"){
		var king = position["e1"];
		delete position["e1"];
		
		if (moves[i] == "OO"){
			var rook = position["a1"];
			delete position["a1"];
			position["c1"] = king;
			position["d1"] = rook;
			console.log("queenside castle on white king");
		}
		else if (moves[i] == "O"){
			var rook = position["h1"];
			delete position["h1"];
			position["g1"] = king;
			position["f1"] = rook;
		}
		else 
			console.error("error trying to castle the white king!");
		
	}
	else{ //regular move built into chessboardJS
		var piece = position[i];
		delete position[i];
		position[moves[i]] = piece;
	}
  }

  return position;
}
//this is mine (VM)
widget.calculatePos = calculatePositionFromMoves;
widget.fenToObj = fenToObj;
widget.setAnimInterval = function(newInterval){ 
	animInterval = newInterval; 
	//console.log("setting interval to "+newInterval);
};

function setCurrentPosition(position) {
  var oldPos = deepCopy(CURRENT_POSITION);
  var newPos = deepCopy(position);
  var oldFen = objToFen(oldPos);
  var newFen = objToFen(newPos);

  // do nothing if no change in position
  if (oldFen === newFen) return;

  // run their onChange function
  if (cfg.hasOwnProperty('onChange') === true &&
    typeof cfg.onChange === 'function') {
    cfg.onChange(oldPos, newPos);
  }

  // update state
  CURRENT_POSITION = position;
}

function isXYOnSquare(x, y) {
  for (var i in SQUARE_ELS_OFFSETS) {
    if (SQUARE_ELS_OFFSETS.hasOwnProperty(i) !== true) continue;

    var s = SQUARE_ELS_OFFSETS[i];
    if (x >= s.left && x < s.left + SQUARE_SIZE &&
        y >= s.top && y < s.top + SQUARE_SIZE) {
      return i;
    }
  }

  return 'offboard';
}

// records the XY coords of every square into memory
function captureSquareOffsets() {
  SQUARE_ELS_OFFSETS = {};

  for (var i in SQUARE_ELS_IDS) {
    if (SQUARE_ELS_IDS.hasOwnProperty(i) !== true) continue;

    SQUARE_ELS_OFFSETS[i] = $('#' + SQUARE_ELS_IDS[i]).offset();
  }
}

function removeSquareHighlights() {
  boardEl.find('.' + CSS.square)
    .removeClass(CSS.highlight1 + ' ' + CSS.highlight2);
}

function snapbackDraggedPiece() {
  // there is no "snapback" for spare pieces
  if (DRAGGED_PIECE_SOURCE === 'spare') {
    trashDraggedPiece();
    return;
  }

  removeSquareHighlights();

  // animation complete
  function complete() {
    drawPositionInstant();
    draggedPieceEl.css('display', 'none');

    // run their onSnapbackEnd function
    if (cfg.hasOwnProperty('onSnapbackEnd') === true &&
      typeof cfg.onSnapbackEnd === 'function') {
      cfg.onSnapbackEnd(DRAGGED_PIECE, DRAGGED_PIECE_SOURCE,
        deepCopy(CURRENT_POSITION), CURRENT_ORIENTATION);
    }
  }

  // get source square position
  var sourceSquarePosition =
    $('#' + SQUARE_ELS_IDS[DRAGGED_PIECE_SOURCE]).offset();

  // animate the piece to the target square
  var opts = {
    duration: cfg.snapbackSpeed,
    complete: complete
  };
  draggedPieceEl.animate(sourceSquarePosition, opts);

  // set state
  DRAGGING_A_PIECE = false;
}

function trashDraggedPiece() {
  removeSquareHighlights();

  // remove the source piece
  var newPosition = deepCopy(CURRENT_POSITION);
  delete newPosition[DRAGGED_PIECE_SOURCE];
  setCurrentPosition(newPosition);

  // redraw the position
  drawPositionInstant();

  // hide the dragged piece
  draggedPieceEl.fadeOut(cfg.trashSpeed);

  // set state
  DRAGGING_A_PIECE = false;
}

function dropDraggedPieceOnSquare(square) {
  removeSquareHighlights();
  var complete = function() {
    drawPositionInstant();
    draggedPieceEl.css('display', 'none');

    // execute their onSnapEnd function
    if (cfg.hasOwnProperty('onSnapEnd') === true &&
      typeof cfg.onSnapEnd === 'function') {
      cfg.onSnapEnd(DRAGGED_PIECE_SOURCE, square, DRAGGED_PIECE);
    }
  };
  
  var finishMove = function(){
	  delete newPosition[DRAGGED_PIECE_SOURCE];
	  newPosition[square] = DRAGGED_PIECE;
	  setCurrentPosition(newPosition);
  }

  // update position
  var newPosition = deepCopy(CURRENT_POSITION);
  //console.log("dragged_piece_source: "+DRAGGED_PIECE_SOURCE+", dest(square): "+square);
  //console.log("dragged piece: "+DRAGGED_PIECE);
  if (DRAGGED_PIECE_SOURCE == "e1" && !(square =="c1" || square == "g1" || square == "e1")){
	 WHITE_CAN_CASTLE = false; 
  }
  if (DRAGGED_PIECE_SOURCE == "e8" && !(square =="c8" || square =="g8" || square == "e8")){
	 BLACK_CAN_CASTLE = false; 
  }
  if (DRAGGED_PIECE_SOURCE == "e1" && square =="c1" && WHITE_CAN_CASTLE){
	  newPosition["d1"] = "wR";
	  delete newPosition["a1"];
	 WHITE_CAN_CASTLE = false; 
	  //animateSquareToSquare("a1", "d1", "wR", complete, true);//castle white queenside
	  //finishMove();
  }
  
  if (DRAGGED_PIECE_SOURCE == "e1" && square =="g1" && WHITE_CAN_CASTLE){
	  newPosition["f1"] = "wR";
	  delete newPosition["h1"];//castle white kingside
	 WHITE_CAN_CASTLE = false; 
	  //finishMove();
  }
	  
  if (DRAGGED_PIECE_SOURCE == "e8" && square =="c8" && BLACK_CAN_CASTLE){
	  newPosition["d8"] = "bR";
	  delete newPosition["a8"];
	 BLACK_CAN_CASTLE = false; 
	  //finishMove();//castle black queenside
  }
  
  if (DRAGGED_PIECE_SOURCE == "e8" && square =="g8" && BLACK_CAN_CASTLE){
	  newPosition["f8"] = "bR";
	  delete newPosition["h8"];
	 BLACK_CAN_CASTLE = false; 
	  //finishMove();//castle black kingside
  }
  
  finishMove();

  // get target square information
  var targetSquarePosition = $('#' + SQUARE_ELS_IDS[square]).offset();

  // animation complete

	/*if (cfg.hasOwnProperty('afterDrop') === true &&
  typeof cfg.afterDrop === 'function') {
     cfg.afterDrop(); 
  }*/

  // snap the piece to the target square
  var opts = {
    duration: cfg.snapSpeed,
    complete: complete
  };
  draggedPieceEl.animate(targetSquarePosition, opts);

  // set state
  DRAGGING_A_PIECE = false;
  
}
/*	DROP CLICKED PIECE 
*	THIS IS METHOD TO IMPLEMENT CLICKING ON THE BOARD
*	location is the output from isXYonSquare
*	square is the jquery element for the target square
*/
var CLICKED_PIECE_SOURCE;
var CLICKED_PIECE;
function dropClickedPieceOnSquare(square){
	var action = 'drop';
	if (square === 'offboard') {
		action = 'none';
	}
  
	// run their onDrop function, which can potentially change the drop action
	if (cfg.hasOwnProperty('onDrop') === true &&
		typeof cfg.onDrop === 'function') {
		var newPosition = deepCopy(CURRENT_POSITION);
	
		// source piece is a spare piece and position is off the board
		//if (DRAGGED_PIECE_SOURCE === 'spare' && location === 'offboard') {...}
		// position has not changed; do nothing
	
		// source piece is a spare piece and position is on the board
		if (CLICKED_PIECE_SOURCE === 'spare' && validSquare(location) === true) {
			// add the piece to the board
			newPosition[square] = CLICKED_PIECE;
		}
	
		// source piece was on the board and position is off the board
		if (validSquare(CLICKED_PIECE_SOURCE) === true && square === 'offboard') {
			// remove the piece from the board
			delete newPosition[CLICKED_PIECE_SOURCE];
		}
	
		// source piece was on the board and position is on the board
		if (validSquare(CLICKED_PIECE_SOURCE) === true &&
			validSquare(location) === true) {
			// move the piece
			delete newPosition[CLICKED_PIECE_SOURCE];
			newPosition[location] = CLICKED_PIECE;
		}
	
		var result = cfg.onDrop(CLICKED_PIECE_SOURCE, square);
		if (result === 'snapback' || result === 'trash') {
			action = "none";
		}
	}
	console.log("dropClickedPieceOnSquare action = "+action+ " because of result = "+result);
	// do it!
	if (action === 'none') {
		//END STOPDRAGGEDPIECE
		CLICKED_PIECE_SOURCE = null;
		CLICKED_PIECE = null;
	}
	else if (action === 'drop'){
		removeSquareHighlights();
		var complete = function() {
			drawPositionInstant();
			draggedPieceEl.css('display', 'none');
		
			// execute their onSnapEnd function
			if (cfg.hasOwnProperty('onSnapEnd') === true &&
				typeof cfg.onSnapEnd === 'function') {
				cfg.onSnapEnd(DRAGGED_PIECE_SOURCE, square, DRAGGED_PIECE);
			}
		};
		
		var finishMove = function() {
			delete newPosition[CLICKED_PIECE_SOURCE];
			newPosition[square] = CLICKED_PIECE;
			setCurrentPosition(newPosition);
		}
		
		// update position
		var newPosition = deepCopy(CURRENT_POSITION);
		//castling
		if (CLICKED_PIECE_SOURCE == "e1" && !(square == "c1" || square == "g1" || square == "e1")) {
			WHITE_CAN_CASTLE = false;
		}
		if (CLICKED_PIECE_SOURCE == "e8" && !(square == "c8" || square == "g8" || square == "e8")) {
			BLACK_CAN_CASTLE = false;
		}
		if (CLICKED_PIECE_SOURCE == "e1" && square == "c1" && WHITE_CAN_CASTLE) {
			newPosition["d1"] = "wR";
			delete newPosition["a1"];
			WHITE_CAN_CASTLE = false;
			//animateSquareToSquare("a1", "d1", "wR", complete, true);//castle white queenside
			//finishMove();
		}
		
		if (CLICKED_PIECE_SOURCE == "e1" && square == "g1" && WHITE_CAN_CASTLE) {
			newPosition["f1"] = "wR";
			delete newPosition["h1"]; //castle white kingside
			WHITE_CAN_CASTLE = false;
			//finishMove();
		}
		
		if (CLICKED_PIECE_SOURCE == "e8" && square == "c8" && BLACK_CAN_CASTLE) {
			newPosition["d8"] = "bR";
			delete newPosition["a8"];
			BLACK_CAN_CASTLE = false;
			//finishMove();//castle black queenside
		}
		
		if (CLICKED_PIECE_SOURCE == "e8" && square == "g8" && BLACK_CAN_CASTLE) {
			newPosition["f8"] = "bR";
			delete newPosition["h8"];
			BLACK_CAN_CASTLE = false;
			//finishMove();//castle black kingside
		}
		
		finishMove();
		
		// get target square information
		var targetSquarePosition = $('#' + SQUARE_ELS_IDS[square]).offset();
		
		// snap the piece to the target square
		var opts = {
			duration: cfg.snapSpeed,
			complete: complete
		};
		draggedPieceEl.animate(targetSquarePosition, opts);
	}

}

function beginDraggingPiece(source, piece, x, y) {
  // run their custom onDragStart function
  // their custom onDragStart function can cancel drag start
  if (typeof cfg.onDragStart === 'function' &&
      cfg.onDragStart(source, piece,
        deepCopy(CURRENT_POSITION), CURRENT_ORIENTATION) === false) {
    return;
  }

  // set state
  DRAGGING_A_PIECE = true;
  DRAGGED_PIECE = piece;
  DRAGGED_PIECE_SOURCE = source;

  // if the piece came from spare pieces, location is offboard
  if (source === 'spare') {
    DRAGGED_PIECE_LOCATION = 'offboard';
  }
  else {
    DRAGGED_PIECE_LOCATION = source;
  }

  // capture the x, y coords of all squares in memory
  captureSquareOffsets();

  // create the dragged piece
  draggedPieceEl.attr('src', buildPieceImgSrc(piece))
    .css({
      display: '',
      position: 'absolute',
      left: x - (SQUARE_SIZE / 2),
      top: y - (SQUARE_SIZE / 2)
    });

  if (source !== 'spare') {
    // highlight the source square and hide the piece
    $('#' + SQUARE_ELS_IDS[source]).addClass(CSS.highlight1)
      .find('.' + CSS.piece).css('display', 'none');
  }
}

function updateDraggedPiece(x, y) {
  // put the dragged piece over the mouse cursor
  draggedPieceEl.css({
    left: x - (SQUARE_SIZE / 2),
    top: y - (SQUARE_SIZE / 2)
  });

  // get location
  var location = isXYOnSquare(x, y);

  // do nothing if the location has not changed
  if (location === DRAGGED_PIECE_LOCATION) return;

  // remove highlight from previous square
  if (validSquare(DRAGGED_PIECE_LOCATION) === true) {
    $('#' + SQUARE_ELS_IDS[DRAGGED_PIECE_LOCATION])
      .removeClass(CSS.highlight2);
  }

  // add highlight to new square
  if (validSquare(location) === true) {
    $('#' + SQUARE_ELS_IDS[location]).addClass(CSS.highlight2);
  }

  // run onDragMove
  if (typeof cfg.onDragMove === 'function') {
    cfg.onDragMove(location, DRAGGED_PIECE_LOCATION,
      DRAGGED_PIECE_SOURCE, DRAGGED_PIECE,
      deepCopy(CURRENT_POSITION), CURRENT_ORIENTATION);
  }

  // update state
  DRAGGED_PIECE_LOCATION = location;
}

function stopDraggedPiece(location) {
  // determine what the action should be
  var action = 'drop';
  if (location === 'offboard' && cfg.dropOffBoard === 'snapback') {
    action = 'snapback';
  }
  if (location === 'offboard' && cfg.dropOffBoard === 'trash') {
    action = 'trash';
  }

  // run their onDrop function, which can potentially change the drop action
  if (cfg.hasOwnProperty('onDrop') === true &&
    typeof cfg.onDrop === 'function') {
    var newPosition = deepCopy(CURRENT_POSITION);

    // source piece is a spare piece and position is off the board
    //if (DRAGGED_PIECE_SOURCE === 'spare' && location === 'offboard') {...}
    // position has not changed; do nothing

    // source piece is a spare piece and position is on the board
    if (DRAGGED_PIECE_SOURCE === 'spare' && validSquare(location) === true) {
      // add the piece to the board
      newPosition[location] = DRAGGED_PIECE;
    }

    // source piece was on the board and position is off the board
    if (validSquare(DRAGGED_PIECE_SOURCE) === true && location === 'offboard') {
      // remove the piece from the board
      delete newPosition[DRAGGED_PIECE_SOURCE];
    }

    // source piece was on the board and position is on the board
    if (validSquare(DRAGGED_PIECE_SOURCE) === true &&
      validSquare(location) === true) {
      // move the piece
      delete newPosition[DRAGGED_PIECE_SOURCE];
      newPosition[location] = DRAGGED_PIECE;
    }

    var oldPosition = deepCopy(CURRENT_POSITION);

    var result = cfg.onDrop(DRAGGED_PIECE_SOURCE, location, DRAGGED_PIECE,
      newPosition, oldPosition, CURRENT_ORIENTATION);
    if (result === 'snapback' || result === 'trash') {
      action = result;
    }
  }

  // do it!
  if (action === 'snapback') {
    snapbackDraggedPiece();
  }
  else if (action === 'trash') {
    trashDraggedPiece();
  }
  else if (action === 'drop') {
    dropDraggedPieceOnSquare(location);
  }

}

//------------------------------------------------------------------------------
// Public Methods
//------------------------------------------------------------------------------

// clear the board
widget.clear = function(useAnimation) {
  widget.position({}, useAnimation);
};

/*
// get or set config properties
// TODO: write this, GitHub Issue #1
widget.config = function(arg1, arg2) {
  // get the current config
  if (arguments.length === 0) {
    return deepCopy(cfg);
  }
};
*/

// remove the widget from the page
widget.destroy = function() {
  // remove markup
  containerEl.html('');
  draggedPieceEl.remove();

  // remove event handlers
  containerEl.unbind();
};

// shorthand method to get the current FEN
widget.fen = function() {
  return widget.position('fen');
};

// flip orientation
widget.flip = function() {
  widget.orientation('flip');
};

/*
// TODO: write this, GitHub Issue #5
widget.highlight = function() {

};
*/


var numFinished = 0;
//more changes by vm
// move pieces
//widget.move = function() {
function movement(){
	//console.log("widget.move being called with arguments: ");
	//console.log(arguments);
	ANIMATION_HAPPENING = true;
  // no need to throw an error here; just do nothing
  if (arguments.length === 0|| !arguments || INTERRUPT == true){
	numFinished = 0;
	ANIMATION_HAPPENING = false;
	INTERRUPT = false;
	return;
  }

  var useAnimation = true;
  
  // collect the moves into an object
  var moves = {};
  for (var i = 0; i < arguments.length; i++) {
    // any "false" to this function means no animations
    if (arguments[i] === false) {
      useAnimation = false;
      continue;
    }

    // skip invalid arguments
    if (validMove(arguments[i]) !== true) {
      error(2826, 'Invalid move passed to the move method.', arguments[i]);
      continue;
    }

    //var tmp = arguments[i].split('-');
    //moves[tmp[0]] = tmp[1];
  }
  var movex = arguments[0];
  var tmp = movex.split('-');
  moves[tmp[0]] = tmp[1];
  var newPos = calculatePositionFromMoves(CURRENT_POSITION, moves);
  var argz = arguments;
  function cb(){
	  numFinished++;
	  var arr = new Array(argz.length-1);
	  for (var q = 1; q < argz.length; q++)
		arr[q-1] = argz[q];
	  movement.apply(this, arr);
	  if (arr.length == 1) numFinished = 0;
  };
  //console.log("call to widget.position");
  widget.position(newPos, useAnimation, cb); 
  

  return newPos;

  
};
widget.move=movement;

function orientation(arg) {
  // no arguments, return the current orientation
  if (arguments.length === 0) {
    return CURRENT_ORIENTATION;
  }

  // set to white or black
  if (arg === 'white' || arg === 'black') {
    CURRENT_ORIENTATION = arg;
    drawBoard();
    return;
  }

  // flip orientation
  if (arg === 'flip') {
    CURRENT_ORIENTATION = (CURRENT_ORIENTATION === 'white') ? 'black' : 'white';
    drawBoard();
    return;
  }

  error(5482, 'Invalid value passed to the orientation method.', arg);
};
widget.orientation = orientation;

widget.position = function(position, useAnimation, cb) {
  // no arguments, return the current position
  if (arguments.length === 0) {
    return deepCopy(CURRENT_POSITION);
  }

  // get position as FEN
  if (typeof position === 'string' && position.toLowerCase() === 'fen') {
    return objToFen(CURRENT_POSITION);
  }

  // start position
  if (typeof position === 'string' && position.toLowerCase() === 'start') {
    position = deepCopy(START_POSITION);
	WHITE_CAN_CASTLE = true;
	BLACK_CAN_CASTLE=true;
  }

  // convert FEN to position object
  if (validFen(position) === true) {
    position = fenToObj(position);
	if (START_POSITION == fenToObj(position)){
		WHITE_CAN_CASTLE = true;
		BLACK_CAN_CASTLE=true;
	}
	
  }
  else{
	  if (typeof position === 'string' && position.length > 10)
		console.log("widget.position called with invalid FEN!");
  }
  
  if (deepCompare(START_POSITION, position)){
		WHITE_CAN_CASTLE = true;
		BLACK_CAN_CASTLE=true;
  }

  // validate position object
  if (validPositionObject(position) !== true) {
    error(6482, 'Invalid value passed to the position method.', position);
    return;
  }

  if (useAnimation == true) {
    // start the animations
	var anims = calculateAnimations(CURRENT_POSITION, position);
	//console.log("animations just calculated");
	//console.log(anims);
    doAnimations(anims, CURRENT_POSITION, position, cb);
	
    // set the new position
	setCurrentPosition(position);				
	//console.log(CURRENT_POSITION);
  }
  // instant update
  else {
    setCurrentPosition(position);
    drawPositionInstant();
  }
};

widget.resize = function() {
  // calulate the new square size
  SQUARE_SIZE = calculateSquareSize();

  // set board width
  boardEl.css('width', (SQUARE_SIZE * 8) + 'px');

  // set drag piece size
  draggedPieceEl.css({
    height: SQUARE_SIZE,
    width: SQUARE_SIZE
  });

  // spare pieces
  if (cfg.sparePieces === true) {
    containerEl.find('.' + CSS.sparePieces)
      .css('paddingLeft', (SQUARE_SIZE + BOARD_BORDER_SIZE) + 'px');
  }

  // redraw the board
  drawBoard();
};

widget.setDraggable = function(bool){ cfg.draggable = bool; };
widget.interrupt = function(){ 
	//console.log("called widget.interrupt with ANIM at "+ANIMATION_HAPPENING);
	if (INTERRUPT){
		INTERRUPT = false;
		return;
	}
	if (animPieceElement || ANIMATION_HAPPENING){
		if (animPieceElement){
			animPieceElement.stop();
			animPieceElement.remove();
			animPieceElement = null;
			ANIMATION_HAPPENING = false;
		}
		INTERRUPT = true;
		return;
	}
	
	
	/*if (ANIMATION_HAPPENING) 
		INTERRUPT = true;
	else
		INTERRUPT = false;*/
	console.log("widget.INTERRUPT is "+INTERRUPT);
};

// set the starting position
widget.start = function(useAnimation) {
  widget.position('start', useAnimation);
};

widget.colorBorder = function(clr){
	//box-shadow: inset 0px 0px 12px 12px rgba(26,214,92,1);
	//$("."+CSS.board).stop().animate({ boxShadow: "inset 0px 0px 12px 12px rgba(26,214,92,1)"},200);
	/*for (var i =1; i < 9; i++)
		$("#square-a"+i).css("box-shadow", "10px 10px 12px 12px #0F5");*/
	if ( ($("."+CSS.board).css("animation").indexOf(clr+"-pulse-2") > 0 ||
		$("."+CSS.board).css("animation").indexOf(clr+"-pulse") == -1) && 
		$("."+CSS.board).attr("style").indexOf("animation") < 0){
		console.log("colorBorder ran pulse1 bc animation value was "+$("."+CSS.board).css("animation"));
		console.log("colorBorder ran pulse1 bc style value was "+$("."+CSS.board).attr("style"));
		$("."+CSS.board).css("animation", clr+"-pulse-1 1.4s");
	}
	else if ($("."+CSS.board).attr("style").indexOf(clr+"-pulse-1") > 0){
		$("."+CSS.board).css("animation", clr+"-pulse-2 1.4s");
	}
	else if ($("."+CSS.board).attr("style").indexOf(clr+"-pulse-2") > 0){
		$("."+CSS.board).css("animation", clr+"-pulse-1 1.4s");
	}
	else{
		console.log("colorBorder ran pulse2 bc animation value was "+$("."+CSS.board).css("animation"));
		$("."+CSS.board).css("animation", clr+"-pulse-2 1.4s");
	}
	//$("."+CSS.board).css("transition", "all 0.1s linear");
	//$("."+CSS.board).css("box-shadow", "");
	//$("."+CSS.board).css("transition", "");
	//$("."+CSS.board).css("box-shadow", "");
	//see github at http://codepen.io/olam/pen/zcqea for animation
};

widget.isPlayingAnimation = function(){
	if (animPieceElement)
		return ANIMATION_HAPPENING;
	else
		return false;
}

//------------------------------------------------------------------------------
// Browser Events
//------------------------------------------------------------------------------

function isTouchDevice() {
  return ('ontouchstart' in document.documentElement);
}

// reference: http://www.quirksmode.org/js/detect.html
function isMSIE() {
  return (navigator && navigator.userAgent &&
      navigator.userAgent.search(/MSIE/) !== -1);
}

function stopDefault(e) {
  e.preventDefault();
}

/*
	MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN 
	MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN 
	MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN MOUSE DOWN 
	Click logic 1.0: turn clicking into dragging. Done by timestamp.
	Click logic 2.0: turn clicking into teleporting and call ondragstart
	and ondragend at appropriate times.
	
*/
var clickTimeStamp = -1;
var mousedown_square_vm;
var isMouseDown = false;
function mousedownSquare(e) {
  // do nothing if we're not draggable
  isMouseDown = true;
  if (cfg.draggable !== true || ANIMATION_HAPPENING == true ) return;
  
  var square = $(this).attr('data-square');
  // no piece on this square
  if (validSquare(square)) {
		if (!CURRENT_POSITION.hasOwnProperty(square) || orientation().slice(0,1) != CURRENT_POSITION[square].slice(0,1)) { //clicked empty box or opponent
		  //piece was clicked already, need to drop off
		  if ( CLICKED_PIECE_SOURCE !== null && CLICKED_PIECE !== null ){
			  console.log("moving piece "+CLICKED_PIECE+": "+CLICKED_PIECE_SOURCE+" - "+square);
			  dropClickedPieceOnSquare(square);
		  }
		  mousedown_square_vm = null;
		  CLICKED_PIECE_SOURCE = null;
		  CLICKED_PIECE = null;
		  return;
		}
	  	else { //clicked own color
			mousedown_square_vm = square;
			CLICKED_PIECE_SOURCE = square;
			CLICKED_PIECE = CURRENT_POSITION[square];
		}
	     
  }
  
  //this assignment needs to only happen whenever we are playing the right color
  
  //clickTimeStamp = Date.now();
  //normally this is the place where I call begindraggingpiece and then function ends
  //beginDraggingPiece(square, CURRENT_POSITION[square], e.pageX, e.pageY);
  
}


function clickHandler(e){
	var square = $(this).attr('data-square');
	/*if (validSquare(square) !== true )
      //|| CURRENT_POSITION.hasOwnProperty(square) !== true) 
    		return;
	FOCUSED_PIECE_LOC = square;*/
	//console.log("clickHandler : FOCUSED_PIECE_LOC is "+square);
}


function touchstartSquare(e) {
	
  // do nothing if we're not draggable
  if (cfg.draggable !== true || ANIMATION_HAPPENING == true || DRAGGING_A_PIECE) return;

  var square = $(this).attr('data-square');

  // no piece on this square
  if (validSquare(square) !== true ||
      CURRENT_POSITION.hasOwnProperty(square) !== true) {
    return;
  }

  
  e = e.originalEvent;
  beginDraggingPiece(square, CURRENT_POSITION[square], e.changedTouches[0].pageX, e.changedTouches[0].pageY);
  //beginDraggingPiece(square, CURRENT_POSITION[square], e.touches[0].pageX, e.touches[0].pageY);
}

function mousedownSparePiece(e) {
  // do nothing if sparePieces is not enabled
  if (cfg.sparePieces !== true) return;

  var piece = $(this).attr('data-piece');

  beginDraggingPiece('spare', piece, e.pageX, e.pageY);
}

function touchstartSparePiece(e) {
  // do nothing if sparePieces is not enabled
  if (cfg.sparePieces !== true) return;

  var piece = $(this).attr('data-piece');

  e = e.originalEvent;
  beginDraggingPiece('spare', piece, e.changedTouches[0].pageX, e.changedTouches[0].pageY);
}

function mousemoveWindow(e) {
  // do nothing if we are not dragging a piece
  if (DRAGGING_A_PIECE !== true){ 
  	//begin dragging if need be
	if (isMouseDown)
		beginDraggingPiece(mousedown_square_vm, CURRENT_POSITION[mousedown_square_vm], e.pageX, e.pageY);
  	return;
  }

  updateDraggedPiece(e.pageX, e.pageY);
}

function touchmoveWindow(e) {
  // do nothing if we are not dragging a piece
  if (DRAGGING_A_PIECE !== true) return;

  // prevent screen from scrolling
  e.preventDefault();

  updateDraggedPiece(e.originalEvent.changedTouches[0].pageX, e.originalEvent.changedTouches[0].pageY);
  //updateDraggedPiece(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY);
}
/*
	MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP
	MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP
	MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP MOUSE UP
*/
function mouseupWindow(e) {
	isMouseDown = false;
  	console.log("vm: "+mousedown_square_vm+", CLICKED_PIECE: "+CLICKED_PIECE+", "+CLICKED_PIECE_SOURCE);
	if (!DRAGGING_A_PIECE) return;
	var location = isXYOnSquare(e.pageX, e.pageY);
	var square = location;
	/*if (mousedown_square_vm === square ){
	  CLICKED_PIECE_SOURCE = square;
	  CLICKED_PIECE = CURRENT_POSITION[square];
	  console.log("mouse up: setting picked up piece");
	  mousedown_square_vm = null;
	}*/
	/*if (DRAGGING_A_PIECE !== true){
	  if ( CLICKED_PIECE_SOURCE !== null && CLICKED_PIECE !== null ){
		  var location = isXYOnSquare(e.pageX, e.pageY);
		  dropClickedPieceOnSquare(location, square);
		  mousedown_square_vm = null;
	  }
	  return;
	}
	else if (mousedown_square_vm === square ){
	  CLICKED_PIECE_SOURCE = square;
	  CLICKED_PIECE = CURRENT_POSITION[square];
	  console.log("mouse up: setting picked up piece");
	  mousedown_square_vm = null;
	}*/
	
	stopDraggedPiece(location);
  
  /*
   if (DRAGGING_A_PIECE !== true) return;
  //if (Date.now() - clickTimeStamp > 300){ 
  // get the location
  	var location = isXYOnSquare(e.pageX, e.pageY);
  	stopDraggedPiece(location);
  //}*/
  
}

function touchendWindow(e) {
  // do nothing if we are not dragging a piece
  if (DRAGGING_A_PIECE !== true) return;

  // get the location
  //var location = isXYOnSquare(e.originalEvent.touches[0].pageX, e.originalEvent.touches[0].pageY);
var location = isXYOnSquare(e.originalEvent.changedTouches[0].pageX, e.originalEvent.changedTouches[0].pageY);
  stopDraggedPiece(location);
}

function mouseenterSquare(e) {
  // do not fire this event if we are dragging a piece
  // NOTE: this should never happen, but it's a safeguard
  if (DRAGGING_A_PIECE !== false) return;

  if (cfg.hasOwnProperty('onMouseoverSquare') !== true ||
    typeof cfg.onMouseoverSquare !== 'function') return;

  // get the square
  var square = $(e.currentTarget).attr('data-square');

  // NOTE: this should never happen; defensive
  if (validSquare(square) !== true) return;

  // get the piece on this square
  var piece = false;
  if (CURRENT_POSITION.hasOwnProperty(square) === true) {
    piece = CURRENT_POSITION[square];
  }

  // execute their function
  cfg.onMouseoverSquare(square, piece, deepCopy(CURRENT_POSITION),
    CURRENT_ORIENTATION);
}

function mouseleaveSquare(e) {
  // do not fire this event if we are dragging a piece
  // NOTE: this should never happen, but it's a safeguard
  if (DRAGGING_A_PIECE !== false) return;

  if (cfg.hasOwnProperty('onMouseoutSquare') !== true ||
    typeof cfg.onMouseoutSquare !== 'function') return;

  // get the square
  var square = $(e.currentTarget).attr('data-square');

  // NOTE: this should never happen; defensive
  if (validSquare(square) !== true) return;

  // get the piece on this square
  var piece = false;
  if (CURRENT_POSITION.hasOwnProperty(square) === true) {
    piece = CURRENT_POSITION[square];
  }

  // execute their function
  cfg.onMouseoutSquare(square, piece, deepCopy(CURRENT_POSITION),
    CURRENT_ORIENTATION);
}

function soundmanagerTouchLoad(){
	if (!smLoaded){
		/*window.ding1 = new Audio("sounds/ding.mp3");
		window.buzz1 = new Audio("sounds/buzz.mp3");
		window.win = new Audio("sounds/party.mp3");
		window.lose = new Audio("sounds/scream-no.mp3");*/
		soundManager.setup({
			url : 'swf/',
			preferFlash : true,
			flashVersion : 9,
			debugMode: false,
			onready : function(){
				window.ding1 = soundManager.createSound({ url: 'sounds/ding.mp3', autoLoad : true });
				window.buzz1 = soundManager.createSound({ url: 'sounds/buzz.mp3', autoLoad : true });
				window.win = soundManager.createSound({ url: 'sounds/party.mp3', autoLoad : true });
				window.lose = soundManager.createSound({ url: 'sounds/scream-no.mp3', autoLoad : true });
				smLoaded = true;
				//window.ding1.play();
			},
		});
	}
}

//------------------------------------------------------------------------------
// Initialization
//------------------------------------------------------------------------------

function addEvents() {
  // prevent browser "image drag"
  $('body').on('mousedown mousemove', '.' + CSS.piece, stopDefault);

  // mouse drag pieces
  boardEl.on('mousedown', '.' + CSS.square, mousedownSquare);
  boardEl.on('click', '.' + CSS.square, clickHandler);
  containerEl.on('mousedown', '.' + CSS.sparePieces + ' .' + CSS.piece,
    mousedownSparePiece);

  // mouse enter / leave square
  boardEl.on('mouseenter', '.' + CSS.square, mouseenterSquare);
  boardEl.on('mouseleave', '.' + CSS.square, mouseleaveSquare);

  // IE doesn't like the events on the window object, but other browsers
  // perform better that way
  if (isMSIE() === true) {
    // IE-specific prevent browser "image drag"
    document.ondragstart = function() { return false; };

    $('body').on('mousemove', mousemoveWindow);
    $('body').on('mouseup', mouseupWindow);
  }
  else {
    $(window).on('mousemove', mousemoveWindow);
    $(window).on('mouseup', mouseupWindow);
  }

  // touch drag pieces
  if (isTouchDevice() === true) { //soundmanagerTouchLoad
    boardEl.on('touchstart', '.' + CSS.square, touchstartSquare);
    containerEl.on('touchstart', '.' + CSS.sparePieces + ' .' + CSS.piece,
      touchstartSparePiece);
    $(window).on('touchmove', touchmoveWindow);
    $(window).on('touchend', touchendWindow);
	//$(window).on('touchstart', soundmanagerTouchLoad);
	boardEl.on('touchstart', soundmanagerTouchLoad);
  }
}

function initDom() {
  // build board and save it in memory
  containerEl.html(buildBoardContainer());
  boardEl = containerEl.find('.' + CSS.board);

  if (cfg.sparePieces === true) {
    sparePiecesTopEl = containerEl.find('.' + CSS.sparePiecesTop);
    sparePiecesBottomEl = containerEl.find('.' + CSS.sparePiecesBottom);
  }

  // create the drag piece
  var draggedPieceId = createId();
  $('body').append(buildPiece('wP', true, draggedPieceId));
  draggedPieceEl = $('#' + draggedPieceId);

  // get the border size
  BOARD_BORDER_SIZE = parseInt(boardEl.css('borderLeftWidth'), 10);

  // set the size and draw the board
  widget.resize();
}

function init() {
  if (checkDeps() !== true ||
      expandConfig() !== true) return;

  // create unique IDs for all the elements we will create
  createElIds();

  initDom();
  addEvents();
}

// go time
init();

// return the widget object
return widget;

}; // end window.ChessBoard

// expose util functions
window.ChessBoard.fenToObj = fenToObj;
window.ChessBoard.objToFen = objToFen;

})(); // end anonymous wrapper

function deepCompare(obj1, obj2){
	for (var i in obj1){
		if (!obj2.hasOwnProperty(i)) return false;
		if (obj1.i != obj2.i) return false;
	}
	for (var i in obj2){
		if (!obj1.hasOwnProperty(i)) return false;
		if (obj1.i != obj2.i) return false;
	}
	return true;
}