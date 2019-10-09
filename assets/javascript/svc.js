/*********************************************************
 * Simplicity Via Clarity
 * @package simplicityviaclarity
 * @subpackage svc server
 * @author Christopher C, Blake S, Sultan K
 * @version 2.1.1
 * ===============[ TABLE OF CONTENTS ]===================
 * 0. Globals
 * 
 * 1. Firebase
 *   1.1 Firebase Configuration
 *   1.2 Initialize Firebase
 *   1.3 Firebase Authentication
 *     1.3.1 Store CurrentUser as global
 *     1.3.2 Initialize the FirebaseUI Widget
 *     1.3.3 UI Configuration
 *     1.3.4 updateCurrentUser
 *     1.3.5 SignOut
 * 
 *   1.4 Active Viewers Watcher
 *     1.4.1 Watch for new connections
 *     1.4.2 Detect Connection Removed
 * 
 * 2. Helper Functions
 *   2.1 ajaxGET
 *   2.2 ajaxPOST
 *   2.3 alertMessage
 *   2.4 alertErrorMessage
 *   2.5 alertSuccessMessage
 *   2.6 startClock
 *   2.7 updateActiveVisitorsTable
 *   2.8 RemoveFromVisitorsTable
 *   2.9 updateVistorsTableDuration
 * 
 * 3. Slack API
 *   3.1 sendSlackMessage <---[ Disabled for now ]---
 * 
 * 4. Document Ready
 *   4.1 Check if User Logged In and update CurrentUser global
 *   4.2 Start Clock and Update Page
 * 
 * A. Debugging / Archived
 *   A.1 Delete All SVC Data
 *   A.2 searchGiphy
 *   A.3 updatePage
 *   A.4 deparam
 *********************************************************/
/* ===============[ 0. GLOBALS ]=========================*/
var lastQuery;
var lastAlarm=0;
var visitorsTableFields = ["site_url", "activePage", "page-duration", "ip-address", "geo-location"];

/* ===============[ 1. Firebase ]=========================*/
/**
 * 1.1 Firebase Configuration
 * https://firebase.google.com/docs/database/admin/retrieve-data
 */
var firebaseConfig = {
  apiKey: "AIzaSyAVj1DhT_LO-Nn_YcBVhpHRgGbn2JCth6E",
  authDomain: "ccollins-fall2019.firebaseapp.com",
  databaseURL: "https://ccollins-fall2019.firebaseio.com",
  projectId: "ccollins-fall2019",
  storageBucket: "",
  messagingSenderId: "541445299555",
  appId: "1:541445299555:web:d9ceca0430a78546108756"
};

// 1.2 Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

var fdb = firebase.database();
var dbRef = fdb.ref("/svc");

// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = fdb.ref("/svc/connections");

/**
 * 1.3 Firebase Authentication
 */
// 1.3.1 Store CurrentUser as global
var CurrentUser;

// 1.3.2 Initialize the FirebaseUI Widget
var ui = new firebaseui.auth.AuthUI(firebase.auth());

/**
 * 1.3.3 UI Configuration
 * Sets up the signInOptions and default UI on our target DOM element #firebaseui-auth-container.
 * Callbacks handle what happens on login success and login failure.
 */
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      // return true;

      console.log("Auth Result", authResult);
      updateCurrentUser();
      return false; // set to false because we are not redirecting to the signInSuccessUrl
    },

    // signInFailure callback must be provided to handle merge conflicts which
    // occur when an existing credential is linked to an anonymous user.
    signInFailure: function (error) {
      // For merge conflicts, the error.code will be
      // 'firebaseui/anonymous-upgrade-merge-conflict'.
      if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
        return Promise.resolve();
      }
      // The credential the user tried to sign in with.
      var cred = error.credential;
      // Copy data from anonymous user to permanent user and delete anonymous
      // user.
      // ...
      // Finish sign-in after data is copied.
      return firebase.auth().signInWithCredential(cred);
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },


  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',

  // Whether to upgrade anonymous users should be explicitly provided.
  // The user must already be signed in anonymously before FirebaseUI is
  // rendered.
  autoUpgradeAnonymousUsers: true,
  signInSuccessUrl: '/',
  signInOptions: [{
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: false
    },
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      scopes: [
        'https://www.googleapis.com/auth/contacts.readonly'
      ],
      customParameters: {
        // Forces account selection even when one account
        // is available.
        prompt: 'select_account'
      }
    },
    firebase.auth.GithubAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  // tosUrl: '<your-tos-url>',
  // Privacy policy url.
  // privacyPolicyUrl: '<your-privacy-policy-url>'
}; // END uiConfig

// The start method will wait until the DOM is loaded.
ui.start('#firebaseui-auth-container', uiConfig);

/**
 * 1.3.4 updateCurrentUser
 * Gets the currently signed-in user if there is one. 
 */
var updateCurrentUser = function () {
  if (firebase.auth().currentUser !== null) {
    // User is signed in.
    CurrentUser = firebase.auth().currentUser;

    if ($(window).width() > 768) {
      $("#main-nav").slideDown();
    } else {
      $("#mobile-nav").slideDown();
    }

    $("#sign-out").show();
    $("#admin-login").hide();
    $("#active-visitors").show();
    $("#title-section").removeClass("jumbotron");
    var displayText = $("<h5>").html(CurrentUser.displayName);
    var displayImage = $("<img>").addClass("rounded").attr("src", CurrentUser.photoURL);
    displayImage = $("<div>").addClass("text-center d-flex justify-center align-self-start image_wrap").html(displayImage);

    if ($(window).width() > 768) {
      $("#main-avatar").append(displayText, displayImage);
    } else {
      $("#mobile-avatar").append(displayText, displayImage);
    }

  } else {
    // No user is signed in.
    CurrentUser = null; // Force this to be null

    if ($(window).width() > 768) {
      $("#main-nav").slideUp();
    } else {
      $("#mobile-nav").slideUp();
    }

    $("#sign-out").hide();
    $("#admin-login").show();
    $("#active-visitors").hide();
    $("#title-section").addClass("jumbotron");

    if ($(window).width() > 768) {
      $("#main-avatar").empty();
    } else {
      $("#mobile-avatar").empty();
    }
  }

  console.log("Current User:", CurrentUser);
  return;
}; // END CurrentUser

/**
 * 1.3.5 SignOut
 */
var SignOut = function () {
  firebase.auth().signOut().then(function () {
    // Sign-out successful.
    updateCurrentUser();

    // The start method will wait until the DOM is loaded.
    ui.start('#firebaseui-auth-container', uiConfig);
    console.log("Sign-out Successful");

  }).catch(function (error) {
    // An error happened.
    console.log("An Error happened", error);
  });

  return;
}; // END SignOut

//-------------------------------------[ 1.4 Active Viewers Watcher - START ]---------------------------
// 1.4.1 Watch for new connections
connectionsRef.on("value", function (snapshot) {
  // Display the viewer count in the html.
  // The number of online users is the number of children in the connections list.
  $("#watchers").text(snapshot.numChildren());

  var tableData = {};
  var uniqueKey = false;
  for (var i in snapshot.val()) {
    if (snapshot.val().hasOwnProperty(i)) {
      // console.log(i + " : " + snapshot.val()[i]);
      for (var property in snapshot.val()[i]) {
        uniqueKey = i;

        if (visitorsTableFields.includes(property)) {
          tableData[property] = snapshot.val()[i][property];

        } else if (property === "ip" && snapshot.val()[i][property].hasOwnProperty('address')) {
          tableData["ip-address"] = snapshot.val()[i][property]['address'];

          if (snapshot.val()[i][property].hasOwnProperty('city')) {
            tableData["geo-location"] = snapshot.val()[i][property]['city'];

            if (snapshot.val()[i][property].hasOwnProperty('latitude') && snapshot.val()[i][property].hasOwnProperty('longitude')) {
              tableData["latitude"] = snapshot.val()[i][property]['latitude'];
              tableData["longitude"] = snapshot.val()[i][property]['longitude'];
            }

          } else {
            tableData["geo-location"] = "unknown";
          }

        } else if (property === "dateAdded") {
          tableData["page-duration"] = moment(snapshot.val()[i][property]).fromNow(true);
          tableData["date_added"] = snapshot.val()[i][property];

        } else if (property === "pages" && snapshot.val()[i][property].length > 0) {
          var all_pages = "";
          for (var p in snapshot.val()[i][property]) {
            all_pages += snapshot.val()[i][property][p]['page'] + ", ";
          }

          all_pages = all_pages.replace(/,\s*$/, "");
          tableData["pages"] = all_pages;
        }
      }
    }
  } // END for(var property in snapshot.val()){

  tableData['key'] = uniqueKey;
  AddToVisitorsTable(tableData);

  // Send Slack Message when alarms are hit
  var alarm1 = 10;
  var alarm2 = 15;
  var alarm3 = 25;

  // Going Up...
  if( snapshot.numChildren() >= alarm1 && lastAlarm < alarm1 ){
    sendSlackMessage("You have currently have " + snapshot.numChildren() + " visitors viewing your sites.");
    console.log("Alarm 1 Hit: " + alarm1 + " < " + snapshot.numChildren());
    lastAlarm = snapshot.numChildren();
    
  } else if( snapshot.numChildren() >= alarm2 && lastAlarm < alarm2 ){
    sendSlackMessage("You have currently have " + snapshot.numChildren() + " visitors viewing your sites.");
    console.log("Alarm 2 Hit: " + alarm2 + " < " + snapshot.numChildren());
    lastAlarm = snapshot.numChildren();
    
  } else if( snapshot.numChildren() >= alarm3 && lastAlarm < alarm3 ){
    sendSlackMessage("You have currently have " + snapshot.numChildren() + " visitors viewing your sites.");
    console.log("Alarm 3 Hit: " + alarm3 + " < " + snapshot.numChildren());
    lastAlarm = snapshot.numChildren();
  }

  // RESET ALARMS when numChildren < alarm1...and after we already hit alarm3
  if( snapshot.numChildren() < alarm1 && lastAlarm === alarm3 ) {
    lastAlarm=0;
    console.log("Alarm Reset");
  }

}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});

// 1.4.2 Detect Connection Removed
connectionsRef.on('child_removed', function (oldChildSnapshot) {
  var keyRemoved = oldChildSnapshot.key;
  $("#" + keyRemoved).remove();
});
//-------------------------------------[ Active Viewers Watcher - END ]----------------------------------

/* ===============[ 2. Functions ]=======================*/
/**
 * 2.1 ajaxGET
 * @param {string} ajaxURL 
 * @param {function} cb - callback function on finish.
 * @param {function} cbErr - callback function on error.
 */
var ajaxGET = function (ajaxURL, cb, cbErr) {
  $.ajax({
    url: ajaxURL,
    method: "GET",
    // success: function (json) {
    //   cb(json);
    // },
    error: function (response, textStatus, errorThrown) {
      console.log("Response:", response);
      console.log("TextStatus:", textStatus);
      console.log("ErrorThrown:", errorThrown);

      var errorMessage = "<strong>Text Status</strong> " + textStatus + "<br />";
      errorMessage += "<strong>Error Thrown</strong> " + errorThrown + ".<br />";
      errorMessage += "See console for more info.";
      cbErr(errorMessage);
    }
  }).then(cb);

  return;
}; // END ajaxGET

/**
 * 2.2 ajaxPOST
 * @param {string} ajaxURL 
 * @param {object} dataObj - data to be sent via type: 'POST'
 * @param {function} cb - callback function on success.
 * @param {function} cbError - callback function on error.
 */
var ajaxPOST = function(ajaxURL, dataObj, cb, cbError){
  // If callback error function is not defined than set it to an empty function.
  if(!cbError){
    cbError = function(){};
  }

  $.ajax({
    type: 'POST',
    url: ajaxURL,
    dataType: 'text',
    data: dataObj,
    success: function(data){
      console.log("result: " + data);
      cb(data);
    },
    error: function(xhr, status, error){
      console.log(arguments);
      console.log("Response:", xhr);
      console.log("TextStatus:", status);
      console.log("ErrorThrough:", error);
      cbError();
    }
  });
  return;
}; // END ajaxPOST

/**
 * 2.3 alertMessage
 * @param {string} message 
 * @param {string} addThisClass 
 */
function alertMessage(message = "", addThisClass = "info") {
  var alertElement = $("<div>").addClass("col-12 alert").attr("id", "alert_message");

  // RESET Alert Message
  if (message === "") {
    $("#alert_message").remove();
    return;

  } else if (addThisClass === "info") {
    // Default alert
    addThisClass = "alert-info";

  } else if (addThisClass === "danger") {
    addThisClass = "alert-danger";

  } else if (addThisClass === "success") {
    addThisClass = "alert-success";
  }

  // IF same alert message keeps getting spammed then add ! and change color red
  if ($("#alert-messages").html() !== undefined && $("#alert-messages").html() === message) {
    message += "!";
    addThisClass = "alert-danger";
  }

  // Add the new class
  alertElement.addClass(addThisClass);

  // Display the alert message
  alertElement.html(message);
  $("#main-section").prepend(alertElement);
  return;
} // END alertMessage

/**
 * 2.4 alertErrorMessage
 */
function alertErrorMessage() {
  if (arguments.length === 1) {
    return alertMessage(arguments[0], "danger");
  }

  for (var i = 0; i < arguments.length; i++) {
    return alertErrorMessage(arguments[i]);
  }
} // END alertErrorMessage

/**
 * 2.5 alertSuccessMessage
 */
function alertSuccessMessage() {
  if (arguments.length === 1) {
    return alertMessage(arguments[0], "success");
  }

  for (var i = 0; i < arguments.length; i++) {
    return alertSuccessMessage(arguments[i]);
  }
} // END alertSuccessMessage

/**
 * 2.6 startClock
 * Displays current time and continues counting the seconds. 
 * @param {string} divSelector - defaults to #clock
 */
var startClock = function (divSelector) {
  divSelector = (divSelector === undefined) ? "#clock" : divSelector;
  setInterval(function () {
      $(divSelector).html(moment().format('MMMM D, YYYY H:mm:ss A'));
    },
    1000);
}; // END startClock

/**
 * 2.7 AddToVisitorsTable
 * Adds a row to #active-visitors-table table body. 
 * @param {object} tableRowObj - properties in this object must be inside the global visitorsTableFields
 */
function AddToVisitorsTable(tableRowObj) {
  if (CurrentUser === undefined && CurrentUser === null) {
    return;
  }

  var newRow = $("<tr>");

  for (var i in visitorsTableFields) {
    var KEY = visitorsTableFields[i];

    if (tableRowObj.hasOwnProperty(KEY)) {
      var VALUE = tableRowObj[KEY];

      if (KEY === "page-duration" && tableRowObj.hasOwnProperty('date_added')) {
        newRow.append(
          $("<td>").attr("data-date-added", tableRowObj['date_added']).text(VALUE)
        );

      } else {

        newRow.append(
          $("<td>").text(VALUE)
        );
      }

    } else {
      newRow.append(
        $("<td>").text(" ")
      );
    }
  } // loop through visitorsTableFields

  if (tableRowObj.hasOwnProperty('key')) {
    newRow.attr("id", tableRowObj['key']);

    if ($("#" + tableRowObj['key']).length === 0) {
      $("#active-visitors-table > tbody").append(newRow);
    }
  }

  return;
} // END AddToVisitorsTable

/**
 * 2.8 RemoveFromVisitorsTable
 * Removes a row from #active-visitors-table table body. 
 * @param {object} tableRowObj - properties in this object must be inside the global visitorsTableFields
 */
function RemoveFromVisitorsTable(uniqueKey) {
  if (CurrentUser === undefined && CurrentUser === null) {
    return;
  }

  var childRef = dbRef.child(uniqueKey);

  childRef.remove().then(function () {
    console.log("Remove succeeded.");

  }).catch(function (error) {
    console.log("Remove failed: " + error.message);
  });

  var trID = "#" + uniqueKey;
  $(trID).remove();
  
  return;
} // END RemoveFromVisitorsTable

/**
 * 2.9 updateVistorsTableDuration
 * Updates the page duration column based on date-added.
 */
function updateVistorsTableDuration() {
  $("#active-visitors-table > tbody tr").each(function (i, el) {
    var page_duration = $(el).find("td:nth-child(3)").data("date-added");

    // page_duration = moment().diff(moment(page_duration), "minutes");
    page_duration = moment(page_duration).fromNow(true);
    $(el).find("td:nth-child(3)").text(page_duration);
    // console.log("page_duration:", page_duration);
  });

  return;
} // END updateVistorsTableDuration

/* ===============[ 3. Slack API ]=======================*/
/**
 * 3.1 sendSlackMessage
 * @param {string} message - The message to be posted.
 * @param {string} channel - The slack channel to post the message in. 
 * @param {string} as_user - From User. If the provided user doesn't exist than the message will be sent from oauthToken owner. 
 */
function sendSlackMessage(message, as_user="simplicityviaclarity", channel="simplicityviaclarity") {
  var ajaxURL = "https://slack.com/api/chat.postMessage";
  var oauthToken_user = "xoxp-685838559649-715501489959-774346859890-00d61a81cc77046ca724abf6c0b45f06";
  var oauthToken_bot = "xoxb-685838559649-789027187543-4NppAjFkus9INeWWROSI4Duf";
  
  if(message === undefined) {
    return;
  }

  var data_object= {
    "token": oauthToken_user,
    "channel": channel,
    "text": message,
    "as_user": as_user
  };

  var _success = function(x){
    console.log("Results:", x);
  };

  var _fail = function(y){
    console.log("Error:", y);
  };

  console.log(data_object);
  return; // <-------------------[ DISABLED FOR NOW ]------------------------
  ajaxPOST( ajaxURL, data_object, _success, _fail );
} // END sendSlackMessage

/* ===============[ 4. Document Ready ]==================*/
$(function () {
  // 4.1 Check if User Logged In and update CurrentUser global
  $("#sign-out").hide();
  setTimeout(updateCurrentUser, 1000);

  /**
   * 4.2 Start Clock and Update Page
   */
  startClock();
  setInterval(updateVistorsTableDuration, 30 * 1000);
}); // END document ready

/* ===============[ A. Debugging / Archived ]=======================*/
/**
 * A.1 Delete All SVC Data
 * If something goes wrong and we have too many entries in the database
 * we need a way to delete them to improve performance.
 * Usage: 
 * setTimeout(deleteAllSVCData, 10 * 1000);
 **/
function deleteAllSVCData() {
  if (CurrentUser === undefined || CurrentUser === null) {
    // Restrict access to logged in users only. 
    return;
  }

  dbRef.remove().then(function () {
    console.log("Removed All SVC Data from firebase");
  }).catch(function (error) {
    console.log("Failed to remove SVC Data. Error: " + error.message);
  });
  return;
} // END deleteAllSVCData

/**
 * A.2 searchGiphy
 * @param {*} queryParamsObj 
 */
function searchGiphy(queryParamsObj) {
  var API_KEY = "vDNhAtsL0DjaOu02FRzz7DeVLn12EtZD";
  var queryURL = "https://api.giphy.com/v1/gifs/search?";

  queryParamsObj = (queryParamsObj === undefined) ? {} : queryParamsObj;
  queryParamsObj.api_key = API_KEY;

  // Build Query URL
  queryURL = queryURL + $.param(queryParamsObj);
  lastQuery = queryURL;

  // Call our ajax function
  ajaxGET(queryURL, updatePage, alertErrorMessage);
  return;
} // END searchGiphy

var testparamsObj = {
  "q": "blink 182",
};

// searchGiphy(testparamsObj);

/**
 * A.3 updatePage
 * @param {JSON} response 
 */
function updatePage(response) {
  var resultsDiv = $("#results");

  var queryParams = deparam(lastQuery);
  alertSuccessMessage("<strong>updatePage called!</strong>");
  console.log(response);
  console.log(lastQuery);
  console.log(queryParams);

  if (lastQuery.split("/").indexOf("maps.googleapis.com") !== -1) {
    // var DIV = $("div>").html()
    // resultsDiv.prepend(DIV);
  }

  return;
} // END updatePage

/**
 * A.4 deparam
 * returns the reverse of $.param
 */
deparam = function (querystring) {
  // remove any preceding url and split
  querystring = querystring.substring(querystring.indexOf('?') + 1).split('&');
  var params = {},
    pair, d = decodeURIComponent,
    i;
  // march and parse
  for (i = querystring.length; i > 0;) {
    pair = querystring[--i].split('=');
    params[d(pair[0])] = d(pair[1]);
  }

  return params;
}; // END deparam