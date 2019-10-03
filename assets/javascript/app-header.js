/*********************************************************
 * RideWitch
 * @package RideWitch
 * @subpackage app-header
 * @author Christopher C, Blake, Sultan
 * @version 1.1.1
 * @license none (public domain)
 * 
 * ===============[ TABLE OF CONTENTS ]===================
 * 0. Globals
 * 1. Google Functions
 *   1.1 initMap
 *   1.2 createMarker
 * 
 *********************************************************
NOTES: This example requires the Places library. Include the libraries=places parameter when you first load the API. For example:
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var GOOGLE_API_KEY = "AIzaSyB6N-d2LB_HWEFqRiQ1LsHVowDR1aSbyIg"
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB6N-d2LB_HWEFqRiQ1LsHVowDR1aSbyIg&libraries=places&callback=initMap" async defer></script> 
/* ===============[ 0. GLOBALS ]=========================*/
var map;
var service;
var infowindow;

/* ===============[ 1. Google Functions ]================*/
/**
 * 1.1 initMap
 */
function initMap() {
  var bootcampClass = new google.maps.LatLng(40.569586, -111.894364);

  infowindow = new google.maps.InfoWindow();

  map = new google.maps.Map(
    document.getElementById('map'), {
      center: bootcampClass,
      zoom: 15
    });

  var request = {
    query: '10011 Centennial Parkway, Sandy, UT',
    fields: ['name', 'geometry'],
  };

  service = new google.maps.places.PlacesService(map);

  service.findPlaceFromQuery(request, function (results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      for (var i = 0; i < results.length; i++) {
        createMarker(results[i]);
      }

      map.setCenter(results[0].geometry.location);
    }
  });
}

/**
 * 1.2 createMarker
 * @param {*} place 
 */
function createMarker(place) {
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}