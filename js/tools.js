var DELAY_TIME = 300;

$(document).ready(function() {
	// Generate select boxes for round generator
	var ul = $("#player_list");
	for (var i=0; i<players.length; i++) {
		var name = players[i][1];
		ul.append("<li><input type='checkbox' name='"+name+"'>"+name+"</li>");
	}
});

var FINAL_DRAWS;
var TIMEOUTS = [];
function clickGenMatches() {
	var drawAmount = $("#match_numbers").val();
	console.log(drawAmount);
	// Stop old timeout functions.
	for(var i=0; i<TIMEOUTS.length; i++) clearTimeout(TIMEOUTS[i]);
	// Start generating
	var attempts = 0;
	var players = ["fakedifferntsize"];
	var draws = [];
	while ((attempts<10)&&(players.length!=draws.length)) { // Attempts to make a perfect setup
		attempts++;
		console.log("------------ ATTEMPT "+attempts+" ------------");
		// Generate players list
		players = []; 
		$('#player_list').find('input:checked').each(function(index) {
			var name = $(this).attr( "name");
			players.push({name: name, matches: matchCount(name), drawn: 0});
		});
		// Draw matches
		draws = [];
		while (needsDrawCount(drawAmount, players)>1) {
			drawMatch(players, draws, drawAmount);
		}
		console.log("Drawn "+draws.length+" matches:");
		console.log(draws);
	}
	// Present the results
	FINAL_DRAWS = draws;
	var ul = $('#match_gen');
	$('#draw_status').html("Drawing... ");
	$('#draw_count').html("0/"+draws.length);
	ul.children().remove();
	for (var i=0; i<draws.length; i++) {
		var d = draws[i];
		TIMEOUTS.push(setTimeout("appendMatchItem(FINAL_DRAWS, "+i+")",DELAY_TIME*i));
	}
}

function appendMatchItem(draws, index) {
	var d = draws[index];
	var ul = $('#match_gen');
	ul.append('<li>'+d[0]+' v '+d[1]+'</li>');
	$('#draw_count').html((index+1)+"/"+draws.length);
}

function needsDrawCount(drawAmount, players) {
	var count = 0;
	for (var i=0; i<players.length; i++) {
		if (players[i].drawn < drawAmount) {
			count++;
		}
	}
	//console.log("Needs draw count: "+count);
	return count;
}

function drawMatch(players, draws, drawAmount) {
	// Find opponent A
	var listA = filterNoDrawn(players); // Priority those without matches this round.
	if (listA.length==0) { // Expanding search
		listA = filterLeastTot(players);
	}
	listA = filterMaxDrawAmount(listA, drawAmount);
	console.log(listA);
	var A = drawRandom(listA);
	A.drawn++;
	// Find opponent B
	// Filter 1: Don't allow player to play more matches than drawAmount.
	var listB = filterMaxDrawAmount(players, drawAmount);
	// Filter 2: Don't play against yourself
	listB = filterNotSelf(listB, A);
	// Filter 3: Max two matches against every player
	listB = filterMaxTwo(listB, draws, A);
	if (listB.length==0) {
		console.log("Failed finding opponent.");
		return;
	}
	// Filter 4: Priority players with no matches this round.
	var newlistB = filterNoDrawn(listB);
	if (newlistB.length>0) {
		listB = newlistB;
	}
	// Filter 5: Don't play against same player twice an round
	var newlistB = filterUniqueForRound(listB, draws, A);
	if (newlistB.length>0) {
		listB = newlistB;
	}
	// Filter 6: Prioritize people who played the least versus A.
	var newlistB = filterByVersusCount(listB, draws, A);
	if (newlistB.length>0) {
		listB = newlistB;
	}
	console.log(listB);
	var B = drawRandom(listB);
	console.log("*MATCH*"+A.name+" v "+B.name);
	B.drawn++;
	draws.push([A.name, B.name]);
}

function filterNoDrawn(players) {
	// Priority 1: Got no drawn matches
	var list = [];
	for (var i=0; i<players.length; i++) {
		if (players[i].drawn == 0) {
			list.push(players[i]);
		}
	}
	return list;
}

function filterLeastTot(players) {
	var list = [];
	var min = players[0].matches + players[0].drawn;
	for (var i=1; i<players.length; i++) {
		var tot = players[i].matches + players[i].drawn;
		if (tot<min) {
			min = tot;
		}
	}
	for (var i=0; i<players.length; i++) {
		var tot = players[i].matches + players[i].drawn;
		if (tot==min) {
			list.push(players[i]);
		}
	}
	return list;	
}

function filterMaxTwo(players, draws, playerA) {
	var list = [];
	for (var y=0; y<players.length; y++) {
		var A = playerA.name;
		var B = players[y].name;
		var played = versusCount(A, B, draws);
		console.log(A+" played vs "+B+":"+played);
		if (played<2) {
			list.push(players[y]);
		}
	}
	return list;
}

function filterByVersusCount(players, draws, playerA) {
	var list = [];
	var A = playerA.name;
	var min = versusCount(players[0].name, A, draws);
	for (var i=1; i<players.length; i++) {
		var B = players[i].name;
		var played = versusCount(A, B, draws);
		if (played<min) {
			min = played;
		}
	}
	for (var i=0; i<players.length; i++) {
		var B = players[i].name;
		var played = versusCount(A, B, draws);
		if (played==min) {
			list.push(players[i]);
		}
	}
	return list;
}

function filterNotSelf(players, self) {
	var list = [];
	for (var i=0; i<players.length; i++) {
		if (players[i] != self) {
			list.push(players[i]); 
		}
	}
	return list;
}

function filterMaxDrawAmount(players, drawMax) {
	var list = [];
	for (var i=0; i<players.length; i++) {
		if (players[i].drawn<drawMax) {
			list.push(players[i]);
		}
	}
	return list;
}

function filterUniqueForRound(players, draws, A) {
	var list = [];
	var nameA = A.name;
	for (var i=0; i<players.length; i++) {
		var nameB = players[i].name;
		if ((nameA==draws[0])&&(nameB=draws[1])) {
			continue;
		}
		else if ((nameA==draws[1])&&(nameB=draws[0])) {
			continue;
		}
		else {
			list.push(players[i]);
		}
	}
	return list;
}

function drawRandom(list) {
	var random =Math.floor(Math.random()*list.length);
	return list[random];		
}

function matchCount(name) {
	var count = 0;
	for (var i=0; i<matches.length; i++) {
		if (matches[i][0] == name) {
			count++;
		}
		else if (matches[i][3] == name) {
			count++;
		}
	}
	for (var i=0; i<unplayed_matches.length; i++) {
		if (unplayed_matches[i][1] == name) {
			count++;
		}
		else if (unplayed_matches[i][2] == name) {
			count++;
		}
	}
	return count;
}

function versusCount(A, B, draws) {
	var played = 0;
	// Played
	for (var i=0; i<matches.length; i++) {
		if ((matches[i][0] == A)&&(matches[i][3] == B)) {
			played++;
		}
		else if ((matches[i][0] == B)&&(matches[i][3] == A)) {
			played++;
		}
	}
	// Unplayed
	for (var i=0; i<unplayed_matches.length; i++) {
		if ((unplayed_matches[i][1] == A)&&(unplayed_matches[i][2] == B)) {
			played++;
		}
		else if ((unplayed_matches[i][1] == B)&&(unplayed_matches[i][2] == A)) {
			played++;
		}
	}
	// Draws (matches this round)
	for (var i=0; i<draws.length; i++) {
		if ((draws[i][0] == A)&&(draws[i][1] == B)) {
			played++;
		}
		else if ((draws[i][0] == B)&&(draws[i][1] == A)) {
			played++;
		}
	}
	return played;
}


function toggleAll(element) {
	var checked = $(element).attr('checked');
	if (!checked) checked = false;
	console.log(checked);
	$("#player_list").find('input[type=checkbox]').attr('checked', checked);
}