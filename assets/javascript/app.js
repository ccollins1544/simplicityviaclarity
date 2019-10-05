/*********************************************************
 * Simplicity Via Clarity
 * @package simplicityviaclarity
 * @subpackage app
 * @author Christopher C, Blake, Sultan
 * @version 2.0.0
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
 *     1.3.4 Persist Authentication
 * 
 * 2. Functions
 *   1.1 ajaxGET
 *   1.2 alertMessage
 *   1.3 alertErrorMessage
 *   1.4 alertSuccessMessage
 *   1.5 updatePage
 *   1.6 deparam
 * 
 * 3. Document Ready
 *   3.1 Render Last Search
 *   3.2 Set Up Clickable elements
 * 
 * A. Debugging
 *********************************************************/
/* ===============[ 0. GLOBALS ]=========================*/
var lastQuery;
var visitorsTableFields = ["count" , "active-page", "page-duration", "site-duration", "ip", "geo-location"];

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
firebase.initializeApp(firebaseConfig);
var fdb = firebase.database();
var dbRef = fdb.ref("/svc");

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
 * 1.3.4 Persist Authentication
 * https://firebase.google.com/docs/auth/web/auth-state-persistence
 * NOTE: The default is Persistance.LOCAL which means we don't need to worry about setting persistance
 * unless we want to persist when the current tab is open. The main issue I was having before was 
 * I needed to delay the function updateCurrentUser by 500milliseconds before page load in order 
 * to capture the CurrentUser.
 *************************************************************************************************
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(function () {
  // Existing and future Auth states are now persisted in the current
  // session only. Closing the window would clear any existing state even
  // if a user forgets to sign out.
  // ...
  // New sign-in will be persisted with session persistence.
  return firebase.auth().signInWithEmailAndPassword(email, password);

}).catch(function (error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
});
*/

/**
 * 2.9 updateCurrentUser
 * Gets the currently signed-in user if there is one. 
 */
var updateCurrentUser = function () {
  if (firebase.auth().currentUser !== null) {
    // User is signed in.
    CurrentUser = firebase.auth().currentUser;
    
    if($(window).width() > 768 ){
      $("#main-nav").slideDown();
    }else{
      $("#mobile-nav").slideDown();
    }

    $("#sign-out").show();
    $("#admin-login").hide();
    $("#user-display-name").html("Hello, " + CurrentUser.displayName + "&nbsp;&nbsp;&nbsp;|");

  } else {
    // No user is signed in.
    CurrentUser = null; // Force this to be null
  
    if($(window).width() > 768 ){
      $("#main-nav").slideUp();
    }else{
      $("#mobile-nav").slideUp();
    }

    $("#sign-out").hide();
    $("#admin-login").show();
    $("#user-display-name").empty();
  }

  // updateTrainSchedule();
  return;
}; // END CurrentUser

/**
 * 2.10 SignOut
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
}; // END SignOut

/* ===============[ 2. Functions ]=======================*/
/**
 * 1.1 ajaxGET
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
      console.log("response: ", response);
      console.log("textStatus: ", textStatus);
      console.log("errorThrown: ", errorThrown);

      var errorMessage = "<strong>Text Status</strong> " + textStatus + "<br />";
      errorMessage += "<strong>Error Thrown</strong> " + errorThrown + ".<br />";
      errorMessage += "See console for more info.";
      cbErr(errorMessage);
    }
  }).then(cb);

  return;
};

/**
 * 1.2 alertMessage
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
}

/**
 * 1.3 alertErrorMessage
 */
function alertErrorMessage() {
  if (arguments.length === 1) {
    return alertMessage(arguments[0], "danger");
  }

  for (var i = 0; i < arguments.length; i++) {
    return alertErrorMessage(arguments[i]);
  }
}

/**
 * 1.4 alertSuccessMessage
 */
function alertSuccessMessage() {
  if (arguments.length === 1) {
    return alertMessage(arguments[0], "success");
  }

  for (var i = 0; i < arguments.length; i++) {
    return alertSuccessMessage(arguments[i]);
  }
}

/**
 * 1.5 updatePage
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
}

/**
 * 1.6 deparam
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

/* ===============[ 3. Document Ready ]==================*/
$(function () {
  // 3.1 Check if User Logged In and update CurrentUser global
  // $("#sign-in").show();
  $("#sign-out").hide();
  $("#user-display-name").empty();
  setTimeout(updateCurrentUser, 1000);
  
  /**
   * 3.2 Render Last Search
   */

  /**
   * 3.3 Set Up Clickable elements
   */
});

/* ===============[ A. Debugging ]=======================*/
/**
 * searchGiphy
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
}

var testparamsObj = {
  "q": "blink 182",
};

// searchGiphy(testparamsObj);