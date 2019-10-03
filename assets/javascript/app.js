/*********************************************************
 * RideWitch
 * @package RideWitch
 * @subpackage app-footer
 * @author Christopher C, Blake, Sultan
 * @version 1.1.2
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
 * 2. Google Functions
 *   2.1 initMap
 * 
 * 3. Document Ready
 *   3.1 Render Last Search
 *   3.2 Set Up Clickable elements
 * 
 * A. Debugging
 *********************************************************/
/* ===============[ 0. GLOBALS ]=========================*/
var lastQuery;

/* ===============[ 1. Functions ]=======================*/
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

/* ===============[ 2. Google Functions ]==================*/
/**
 * 2.1 initMap
 */
function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {
      lat: 40.569586,
      lng: -111.894364
    },
    zoom: 13
  });
  var card = document.getElementById('pac-card');
  var input = document.getElementById('pac-input');
  var types = document.getElementById('type-selector');
  var strictBounds = document.getElementById('strict-bounds-selector');

  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

  var autocomplete = new google.maps.places.Autocomplete(input);

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.
  autocomplete.bindTo('bounds', map);

  // Set the data fields to return when the user selects a place.
  autocomplete.setFields(
    ['address_components', 'geometry', 'icon', 'name']);

  var infowindow = new google.maps.InfoWindow();
  var infowindowContent = document.getElementById('infowindow-content');
  infowindow.setContent(infowindowContent);
  var marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  autocomplete.addListener('place_changed', function () {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17); // Why 17? Because it looks good.
    }
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    infowindowContent.children['place-icon'].src = place.icon;
    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-address'].textContent = address;
    infowindow.open(map, marker);
  });

  // Sets a listener on a radio button to change the filter type on Places
  // Autocomplete.
  function setupClickListener(id, types) {
    var radioButton = document.getElementById(id);
    radioButton.addEventListener('click', function () {
      autocomplete.setTypes(types);
    });
  }

  setupClickListener('changetype-all', []);
  setupClickListener('changetype-address', ['address']);
  setupClickListener('changetype-establishment', ['establishment']);
  setupClickListener('changetype-geocode', ['geocode']);

  document.getElementById('use-strict-bounds')
    .addEventListener('click', function () {
      console.log('Checkbox clicked! New state=' + this.checked);
      autocomplete.setOptions({
        strictBounds: this.checked
      });
    });
} // END initMap

/* ===============[ 3. Document Ready ]==================*/
$(function () {
  /**
   * 3.1 Render Last Search
   */

  /**
   * 3.2 Set Up Clickable elements
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