/*********************************************************
 * RideWitch
 * @package RideWitch
 * @subpackage app-footer
 * @author Christopher C, Blake, Sultan
 * @version 1.1.1
 * @license none (public domain)
 * 
 * ===============[ TABLE OF CONTENTS ]===================
 * 0. Globals
 * 1. Functions
 *   1.1 ajaxGET
 *   1.2 alertMessage
 *   1.3 alertErrorMessage
 *   1.4 alertSuccessMessage
 *   1.5 updatePage
 *   1.6 deparam
 * 
 * 2. Document Ready
 *   2.1 Render Last Search
 *   2.2 Set Up Clickable elements
 * 
 * A. Debugging
 *********************************************************/
/* ===============[ 0. GLOBALS ]=========================*/
var lastQuery;

/* ===============[ 1. Functions ]================*/
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

/* ===============[ 2. Document Ready ]==================*/
$(function () {
  
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