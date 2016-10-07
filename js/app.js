
/*	ENTER YOUR APP'S JAVASCRIPT CODE HERE!	*/

// this function fires at the ready state, which is when the DOM is
// ready for Javascript to execute
$(document).ready(function() {

	// Initialize Firebase
	// NOTE: you can also copy and paste this information from your project
	//       after you initialize it
	var config = {
	    apiKey: "AIzaSyCrH7bYvuX_YyF6e8AQz39IoocB98wsyxw",
	    authDomain: "livecodeoct7.firebaseapp.com",
	    databaseURL: "https://livecodeoct7.firebaseio.com",
	    storageBucket: "",
	    messagingSenderId: "90684144599"
	  };
	  firebase.initializeApp(config);

	// some firebase variables
	var facebookProvider = new firebase.auth.FacebookAuthProvider(); // facebook-specific auth provider
	
	// built-in firebase handlers (required)
	var auth = new firebase.auth();
	var database = new firebase.database();

	var loggedUser = {};

	// refs for firebase (starting points)
	var profileRef = database.ref('/profiles');
	var userCreatedEventsRef = database.ref('/usercreatedevents');
	var eventRef = database.ref('/events');
	var eventRSVPRef = database.ref('/eventrsvps');
	var profileRSVPRef = database.ref('/profilersvps');

	// persistently listen for changes to the events
	eventRef.on('value', function(snapshot) {

		// get a readable value (snapshot is initially sent back as an unreadable object)
		var snapshotValue = snapshot.val();

		// all of the snapshot keys
		var keys = Object.keys(snapshotValue);

		// populate the div with the id 'events-list'
		$("#events-list").html("");
		for (var i = 0; i < keys.length; i++) {

			// append a new list item
			$("#events-list").append(`
				<div class="row">
					<div class="col-sm-2">
						<button class="event-rsvp" type="button" data-id="${keys[i]}">RSVP</button>
					</div>
					<div class="col-sm-10">
						${snapshotValue[keys[i]].name} (${snapshotValue[keys[i]].date})
					</div>
				</div>
			`);
		}

		// listen for rsvps
		$(".event-rsvp").click(function() {
			
			var eventId = $(this).data('id');

			// add the rsvp to the profile rsvps
			profileRSVPRef.child(loggedUser.id).push(snapshotValue[eventId].name);

			// add the rsvp to the event list
			eventRSVPRef.child(eventId).push(loggedUser.name);
		});
	});

	// add a new event
	$("#new-event-button").click(function() {

		// get the event values from the input elements
		var newName = $("#new-event-name").val();
		var newDate = $("#new-event-date").val();

		// do an error check
		if (newName == "" || newDate == "") {
			alert("Please enter all new event information.");
		}
		else {
			// error check passes

			// new event
			var newEvent = {
				name: newName,
				date: newDate
			};

			// push to the events and usercreatedevents tables 
			// (they will be created if they aren't there already)
			eventRef.push(newEvent);
			userCreatedEventsRef.child(loggedUser.id).push(newEvent);

			// reset the values so the user doesn't have to if they
			// want to add another event
			$("#new-event-name").val('');
			$("#new-event-date").val('');
		}
	});

	// event listener for the login button
	$("#btn-login").click(function() {

		// sign in via popup
		// PRO TIP: remember, .then usually indicates a promise!
		auth.signInWithPopup(facebookProvider).then(function(result) {

			$(".login-window").hide();
			$(".main-window").show();
			console.log(result);

			// check for your profile
			profileRef.once("value").then(function(snapshot) {

				// get the snapshot value
				var snapshotValue = snapshot.val();

				// if no values present, just add the user
				if (snapshotValue == undefined || snapshotValue == null) {
					loggedUser = addNewUser(result, profileRef);
				}
				else {

					// iterate through the object, and determine if the
					// profile is present
					var keys = Object.keys(snapshotValue);
					var found = false;
					for (var i = 0; i < keys.length; i++) {

						// accessing objects:
						// way 1: objectname.objectvalue
						// way 2: objectname['objectvalue']
						if (snapshotValue[keys[i]].email == result.user.email) {
							
							// found the profile, access it
							loggedUser = snapshotValue[keys[i]];
							loggedUser.id = keys[i];
							found = true;
						}
					}

					// profile is not found, add a new one
					if (!found) {
						loggedUser = addNewUser(result, profileRef);
					}

					// listen for our events
					profileRSVPRef.child(loggedUser.id).on('value', function(snapshot) {

						var snapshotValue = snapshot.val();
						var keys = Object.keys(snapshotValue);
						for (var i = 0; i < keys.length; i++) {

							$("#rsvp-list").append(`
								<p>${snapshotValue[keys[i]]}</p>
							`);
						}


					});
				}
			});

		}, function(error) {
			console.log("Oops! There was an error");
			console.log(error);
		});
	});
});


// add new user function
// this is a function because we repeat the process and we don't want
// to repeat the code
function addNewUser(result, ref) {
	var user = {
		name: result.user.displayName,
		email: result.user.email
	};

	var newUser = ref.push(user);
	user.id = newUser.key;
	return user;
}