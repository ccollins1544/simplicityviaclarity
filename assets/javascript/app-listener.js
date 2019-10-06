/*********************************************************
 * Simplicity Via Clarity
 * @package simplicityviaclarity
 * @subpackage app listener
 * @author Christopher C, Blake, Sultan
 * @version 2.0.0
 * ===============[ TABLE OF CONTENTS ]===================
 * 0. Globals
 * 
 * 1. Helper Functions
 *   1.1 loadXMLDoc
 *   1.2 consoleResults
 *   1.3 formatDate
 *   1.4 getHeaders
 *   1.5 getSiteURL
 * 
 * 2. svcData Functions
 *   2.1 build_svcData
 *   2.2 ipGeoLocation
 * 
 * 3. Collect Site Data
 *   3.1 Set svcData.ip
 *   3.2 Set svcData.site_url and svcData.pages
 *   3.3 Push svcData to firebase
 * 
 * A. Debugging
 *********************************************************/
/* ===============[ 0. GLOBALS ]=========================*/
var svcData = (localStorage.getItem("svc_data") === null) ? {} : JSON.parse(localStorage.getItem("svc_data"));

/** ===============[ 1. Helper Functions ]================
 * 1.1 loadXMLDoc
 * Uses GET method to fetch JSON object from ajaxURL.
 * @param {string} ajaxURL 
 * @param {function} cb - callback function on success. 
 * @param {function} cbErr  - callback function on error.
 */
function loadXMLDoc(ajaxURL, cb, cbErr) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
      if (xmlhttp.status == 200) {
        //document.getElementById("myDiv").innerHTML = xmlhttp.responseText;
        var json = JSON.parse(xmlhttp.responseText);
        cb(json);

      } else if (xmlhttp.status == 400) {
        var errorMessage = "There was an error 400.";
        console.log("Error Message: ", errorMessage);
        cbErr(errorMessage);

      } else {
        var errorMessage = "Something else other than 200 was returned.";
        console.log("Response: ", JSON.parse(xmlhttp.responseText));
        console.log("Error Message: ", errorMessage);
        cbErr(errorMessage);
      }
    }
  };

  xmlhttp.open("GET", ajaxURL, true);
  xmlhttp.send();

  return;
} // END loadXMLDoc

/**
 * 1.2 consoleResults
 * @param {*} data 
 */
function consoleResults(data) {
  console.log("results", data);
}

/**
 * 1.3 formatDate
 * @param {string} datetime
 * @param {string} format - long or short
 * @return {string} formatedDate
 */
formatDate = function (unformatedDate, format = "long", time = true) {
  const monthNamesLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var unformatedDate = new Date(unformatedDate);
  var day = unformatedDate.getDate();
  var month = (format === "long") ? monthNamesLong[unformatedDate.getMonth()] : monthNamesShort[unformatedDate.getMonth()];
  var year = unformatedDate.getFullYear();

  var hours = unformatedDate.getHours();
  var ampm = "AM";
  if (hours > 12) {
    hours -= 12;
    ampm = "PM";
  }

  var minutes = unformatedDate.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  var formatedDate = (format === "long") ? month + " " + day + ", " + year : month + "/" + day + "/" + year;

  if (time) {
    formatedDate += " [" + hours + ":" + minutes + " " + ampm + "]";
  }

  return formatedDate;
};

/**
 * 1.4 getHeaders
 */
function getHeaders() {
  var req = new XMLHttpRequest();
  req.open('GET', document.location, false);
  req.send(null);

  // associate array to store all values
  var data = new Object();

  // get all headers in one call and parse each item
  var headers = req.getAllResponseHeaders().toLowerCase();
  var aHeaders = headers.split('\n');
  var i = 0;
  for (i = 0; i < aHeaders.length; i++) {
    var thisItem = aHeaders[i];
    var key = thisItem.substring(0, thisItem.indexOf(':'));
    var value = thisItem.substring(thisItem.indexOf(':') + 1);
    data[key] = value;
  }

  // get referer
  var referer = document.referrer;
  data["Referer"] = referer;

  //get useragent
  var useragent = navigator.userAgent;
  data["UserAgent"] = useragent;


  //extra code to display the values in html
  var display = "";
  for (var key in data) {
    if (key != "")
      display += "<b>" + key + "</b> : " + data[key] + "<br>";
    console.log(key + " : " + data[key]);
  }
  // document.getElementById("dump").innerHTML = display;
  return display;
}

/**
 * 1.5 getSiteURL
 * @param {string} url_piece - full, site, or page
 */
function getSiteURL(url_piece = "full") {
  var fullURL = window.location.href;

  switch (url_piece) {
    case "page":
      return "/" + fullURL.split("/").pop();

    case "site":
      var page = "/" + fullURL.split("/").pop();
      return fullURL.replace(page, "");

    default:
      return fullURL;
  }
}

/**===============[ 2. svcData Functions ]===============
 * These functions will build the following object and 
 * save it to localStorage,
 * 
 * svcData = {
 *   ip: ipGeoLocation
 *   site_url : window.location.href,
 *   pages : [
 *     '0': {
 *       page: index.html,
 *       date_added: 1570326345946,
 *     },
 *   ],
 * };
 ********************************************************
 /**
  * 2.1 build_svcData
  */
function build_svcData() {

  // Set site_url
  var siteFound = false;
  if (svcData.hasOwnProperty('site_url')) {
    if (svcData.site_url !== getSiteURL("site")) {
      svcData.site_url = getSiteURL("site");

    } else {
      siteFound = true;
    }

  } else {
    svcData.site_url = getSiteURL("site");
  }

  // Set pages
  var pageFound = false;
  if (svcData.hasOwnProperty('pages')) {
    if (typeof (svcData.pages) == 'object' && svcData.pages instanceof Array) {
      var thisPage = getSiteURL("page");

      for (var i = 0; i < svcData.pages.length; i++) {
        if (svcData.pages[i].hasOwnProperty('page')) {
          if (svcData.pages[i].page === thisPage) {
            pageFound = true;
          }
        } // if(svcData.pages[i].hasOwnProperty('page')){
      } // END for(var i=0; i < svcData.pages.length; i++ ){
    } // END if(typeof(svcData.pages) == 'object' && svcData.pages instanceof Array){
  } // if(svcData.hasOwnProperty('pages')){

  if (pageFound === false) {
    var d = new Date();
    var timestamp = d.getTime();
    var pageObj = {
      "page": getSiteURL("page"),
      "date_added": timestamp,
    };

    svcData.pages = [];
    svcData.pages.push(pageObj);
  }; // if(pageFound === false){

  if (siteFound === false || pageFound === false) {
    // Save svcData to LocalStorage
    localStorage.setItem("svc_data", JSON.stringify(svcData));
    console.log("build_svcData", svcData);
  } else {
    console.log("Already saved site", svcData.site_url);
  }

} // END build_svcData

/**
 * 2.2 ipGeoLocation
 * @param {*} ip 
 * @todo prevent from re-querying every time if ip is the same
 */
function ipGeoLocation(ip) {
  // Get IP if it's undefined
  if (ip === undefined) {
    var _ip = function (r) {
      ipGeoLocation(r.ip);
    };

    var _c = function (r) {
      console.log(r);
    };

    loadXMLDoc("https://api.ipify.org?format=json", _ip, _c);
    return;
  } else if (svcData.hasOwnProperty('ip')) {
    // Check if locally stored IP is the same as current ip
    if (svcData.ip.hasOwnProperty('address')) {
      if (svcData.ip.address === ip) {
        console.log('Already saved this ip', ip);
        return;
      }
    }
  }

  // Fetch IPGeoLocation data and save it
  var data = null;
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === this.DONE) {
      var res = JSON.parse(this.responseText)
      svcData.ip = res.ip;

      // Save svcData to LocalStorage
      localStorage.setItem("svc_data", JSON.stringify(svcData));
      console.log("ipGeoLocation", svcData);
    }
  });

  var API_KEY = "0acc44c0f4msh221a1ccbfc7d4d9p13dc6bjsn4e0e4d40f033";
  var queryURL = "https://apility-io-ip-geolocation-v1.p.rapidapi.com/" + ip;

  xhr.open("GET", queryURL);
  xhr.setRequestHeader("x-rapidapi-host", "apility-io-ip-geolocation-v1.p.rapidapi.com");
  xhr.setRequestHeader("x-rapidapi-key", API_KEY);
  xhr.setRequestHeader("accept", "application/json");

  xhr.send(data);
  return;
} // ipGeoLocation


/** ===============[ 2. Collect Site Data ]===============
 * Will run the svcData functions to collect site data and
 * push changes to firebase.
 ********************************************************/
// 3.1 Set svcData.ip
build_svcData();

// 3.2 Set svcData.site_url and svcData.pages
ipGeoLocation();

// 3.3 Push svcData to firebase




















/* ===============[ A. Debugging ]=======================*/
/*
if( typeof(ip) == 'object' ){
  console.log("Success");
  _c(ip);
  return; 
}

 console.log("IP IS: " + ip);
 var API_KEY = "9dcaf7e227e24109890d880e7511da7b";
 var queryURL = "https://api.ipgeolocation.io/ipgeo?";
 var queryParamsObj = {}; 
 queryParamsObj.api_key = API_KEY;
 queryParamsObj.ip = ip;
 
 // $.param equivalent 
 var urlParam = function(params) { 
   return new URLSearchParams(Object.entries(params));
 };
 
 // Build Query URL
 queryURL = queryURL + urlParam(queryParamsObj);
 console.log("URL", queryURL); 
 loadXMLDoc(queryURL, ipGeoLocation, _c); 
 */
/* Table Columns: 
Active Page, 
Page Duration, --> local storage
Site Duration (min), 
IP, 
GeoLocation */

/***************************************
console.log("The URL of this page is: " + window.location.href);
console.log("Location: " + document.location);

var d = new Date();
var n = d.getTime();
consoleResults(n);
consoleResults(formatDate(n));

var d = getHeaders();

*/