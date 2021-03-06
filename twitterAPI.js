//constants
const consumerKey = "n9tuklQ7vCvdyEjVm7Nts9uNc";
const consumerSecretKey = "2GciZDmg4pDoOD8BfnKOsUUssqixf8my4FewOz0Cb1GHG1VHyq";
const accessToken = "1275421014852337672-6mKsYvcidkbFWWzXTH8qS48vJSfwLM";
const accessTokenSecret = "gXo35SEf2Rlsc4Dnc6LLMhJsTRb88kp0wBxHY9JRxxu6u";
const canadaWoeid = 23424775;
const defaultNumTrends = 10;
const twitterTrendsContentElement = $(".twitter-trends-content");
const countryToWoeid = 
{
    "World" : 1,
    "Austrialia" : 23424748,
    "Canada" : 23424775,
    "United Kingdom" : 23424975,
    "United States": 23424977,
    "Japan": 23424856, 
    "India": 23424848,
    "Brazil":23424768,
    "Turkey": 23424969
}
const latitude = 0;
const longitude = 0;

//global variables
var numTrendsGlobal = defaultNumTrends;

//no need to use Codebird anymore; invoking twitter API on server side
//var cb = new Codebird();

function addNewElement(trend, count) {
    var trendDiv = $("<div>");
    trendDiv.addClass("twitter-article-item");
    trendDiv.addClass("card blue-grey darken-1");
    var trendNum = $("<div>").text("#" + count);
    trendNum.addClass("card-content white-text");
    var trendNameUrl = $("<a>").text(trend.name).prop("href", trend.url).prop("target", "_blank");
    trendNameUrl.addClass("card-title");
    var pinImage = $("<img>").prop("src", "https://img.icons8.com/color/48/000000/pin.png").prop("width", 20).prop("height", 20);
    var saveBtn = $("<a>").addClass("saveBtn").append(pinImage).on("click", saveBtnClick);
    trendDiv.append(trendNum); 
    trendDiv.append(trendNameUrl, "&nbsp;", saveBtn);
    if (trend.tweet_volume) {
        var tweetVolume = $("<span>").text("Tweet Volume: " + trend.tweet_volume)
        var trendTweetVolumeDiv = $("<div>");
        trendTweetVolumeDiv.append(tweetVolume);
        trendDiv.append(trendTweetVolumeDiv.addClass("card-action white-text"));
    }

    twitterTrendsContentElement.append(trendDiv);
}

function saveBtnClick(event) {
    var trendDiv = $(this).parent().find(".card-title");
    var trendName = trendDiv.text(); 
    var trendUrl = trendDiv.prop("href");

    saveBookmark(trendName, trendUrl);
    sidenav.open();
}

function fetchTwitterTrends(numItems, woeid) {
    twitterTrendsContentElement.empty();
    //initially used codebird, but it turned out to not be reliable (stopped working on July 3rd, 2020),
    //so switch to having the backend (python) do the actual query to the twitter API
    /*
    cb.setConsumerKey(consumerKey, consumerSecretKey);
    cb.setToken(accessToken, accessTokenSecret);
    cb.__call("trends/place", {id: woeid}, function (reply, rate, err) {
        var count = 0;
        reply[0].trends.some(function(trend, index) {
            if (count++ === numItems) {
                return true;
            }

            addNewElement(trend, count);
        });
    });
    */    
    $.ajax({
        url: `https://highlycaffeinated.ca:5002/trends/place?id=${woeid}`,
        method: 'GET'
    }).then(function (reply) {
        var count = 0;
        reply[0].trends.some(function(trend, index) {
            if (count++ === numItems) {
                return true;
            }

            addNewElement(trend, count);
        });
    })
}

function fetchTwitterTrendsLongLat(numItems, latitude, longitude) {
    //initially used codebird, but it turned out to not be reliable (stopped working on July 3rd, 2020),
    //so switch to having the backend (python) do the actual query to the twitter API
    /* 
     cb.setConsumerKey(consumerKey, consumerSecretKey);
     cb.setToken(accessToken, accessTokenSecret);
     cb.__call("trends/closest", {lat: latitude, long: longitude}, function (reply, rate, err) {
         var woeid = reply[0].woeid;
         console.log(woeid);
         fetchTwitterTrends(numItems, woeid); 
     });
     */
    $.ajax({
        url: `https://highlycaffeinated.ca:5002/trends/closest?lat=${latitude}&long=${longitude}`,
        method: 'GET'
    }).then(function (reply) {
        var woeid = reply[0].woeid;
        fetchTwitterTrends(numItems, woeid); 
    })
}

function geoSuccess(position) {
    const latitude  = position.coords.latitude;
    const longitude = position.coords.longitude;
    fetchTwitterTrendsLongLat(numTrendsGlobal, latitude, longitude);
}

function geoError() {
    console.log("error getting the geolocation!")
}

$(".ddl-item").on("click", function (event) {
    event.preventDefault();
    numTrendsGlobal = parseInt($(this).attr("id"));
    var country = $(".dropdown-trigger-country").attr("data-country");
    if (country.includes("Current")) {
        getGeoLocation(geoSuccess, geoError);
    }
    else {
        var woeid = countryToWoeid[country];
        fetchTwitterTrends(numTrendsGlobal, woeid);
    }
});

$(".country-item").on("click", function (event) {
    event.preventDefault();
    var country = $(this).attr("id");
    var numTrendsGlobal = parseInt($(".dropdown-trigger").attr("data-article-num"));

    if (country.includes("Current")) {
        getGeoLocation(geoSuccess, geoError);
    }
    else {
        var woeid = countryToWoeid[country];
        fetchTwitterTrends(numTrendsGlobal, woeid);
    }
});

$(document).ready(function () {
    numTrendsGlobal = parseInt(localStorage.getItem("numberOfTopics"));
    if (!numTrendsGlobal) {
        numTrendsGlobal = defaultNumTrends;
    }

    var countryWoeid = canadaWoeid;
    var savedCountry = localStorage.getItem("currentCountry");
    if (savedCountry) {
        if (savedCountry.includes("Current")) {
            getGeoLocation(geoSuccess, geoError);
        }
        else {
            countryWoeid = countryToWoeid[savedCountry];
            fetchTwitterTrends(numTrendsGlobal, countryWoeid);
        }
    }
});