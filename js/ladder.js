// OBS: matches variable stores in matches.js
$(document).ready(function() {
	$('#ladder').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="laddertable"></table>' );
	var table = $('#laddertable').dataTable( {
		"bPaginate": false,
		"aaData": generate_stats(matches),
		"aoColumns": [
			{ "sTitle": "Rank" },
			{ "sTitle": "Name" },
			{ "sTitle": "Played" },
			{ "sTitle": "Streak" },
			{ "sTitle": "Win" },
			{ "sTitle": "Loss", "sClass": "center" },
			{ "sTitle": "SetsWon", "sClass": "center" },
			{ "sTitle": "SetsLost", "sClass": "center" },
			{ "sTitle": "SetsDiff", "sClass": "center" },
			{ "sTitle": "Points", "sClass": "center" },
		],
        "fnDrawCallback": function ( oSettings ) {
            /* Need to redo the counters if filtered or sorted */
            if ( oSettings.bSorted || oSettings.bFiltered )
            {
                for ( var i=0, iLen=oSettings.aiDisplay.length ; i<iLen ; i++ )
                {
                    $('td:eq(0)', oSettings.aoData[ oSettings.aiDisplay[i] ].nTr ).html( i+1 );
                }
            }
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": [ 0 ] }
        ],
	});
	table.fnSort( [ [9,'desc'], [8,'desc'], [2,'asc'] ] );
});

function generate_stats(matches) {
	var list = players;
	for (var i=0; i<matches.length; i++) {
		var m = matches[i];
		// Check if players allready are in list
		if (player_exist(list, m[0])==false) {
			list.push([0, m[0],0,0,0,0,0,0,0,0]);
		}
		if (player_exist(list, m[3])==false) {
			list.push([0, m[3],0,0,0,0,0,0,0,0]);
		}
		// Fetch players from list
		var aplayer = list[get_id(list,m[0])];
		var bplayer = list[get_id(list,m[3])];
		update_player(aplayer, m[1], m[2]);
		update_player(bplayer, m[2], m[1]);
	}
	return list;
}

// Check if player exists in given list, returns the index if so.
function player_exist(list, player) {
	for (var i=0; i<list.length; i++) {
		if (player==list[i][1]) {
			return true;
		}
	}
	return false;
}

function get_id(list, player) {
	for (var i=0; i<list.length; i++) {
		if (player==list[i][1]) {
			return i;
		}
	}
	alert("player not found in list, should not happen");
}

// Update the player list item
function update_player(player, won, lost) {
	if (won > lost) {
		player[3]++;
		player[4]++;
		player[9] += 3;
	}
	else if (won < lost){
		player[3] = 0;
		player[5]++;
	}
	else {
		alert('DRAW DETECTED, ERROR!');
	}
	player[2]++;
	player[6] += won;
	player[7] += lost;
	player[8] = player[6] - player[7];
}