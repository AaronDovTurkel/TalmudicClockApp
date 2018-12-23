//'use strict';

/*Pseudo Coded*/


/*The API Side - Basic*/

//API Info Objects// --> 'A'
// Object that will contain all the necessary info
// for API calls. (keys, url's, etc.).
const ip_loc_api_data = {
	apiKey: '04160a00359cbf', 
	searchURL: 'https://ipinfo.io/json',
};

const sun_rise_set_api_data = {
	searchURL: 'https://api.sunrise-sunset.org/json',
};

//Resuable FETCH function and Json conversion// --> 'B'
// A reusable function to call an API and convert the response to JSON.
function json_fetcher(url) {
  return fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      throw new Error(response.statusText);
    })
    .catch(err => {
      $('#js-error-message').text(`Something went wrong: ${err.message}`);
    });
}
//Reusable format query parameters function// --> 'C'
// A reusable function that will format query params in a suitable manner
// for API fetch calls. (use boiler plate).
function formatQueryParams(params) {
  const queryItems = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  return queryItems.join('&');
};

//Initial IP Geolocator API Fetch// --> 'D'
// 1. Three 'const' that will store:
//     a. const w/ params needed - 'A'
//     b. querystring const that calls function above - 'B'.
//     c. url const that concatenates the query and url for API
// 2. Fetch to 'https://ipinfo.io/json' which will return json object 
// (using the function above) with location info.
function ip_geolocator_fetch() {
  const params = {
    token: ip_loc_api_data.apiKey
  };
  const queryString = formatQueryParams(params)
  const url = ip_loc_api_data.searchURL + '?' + queryString;

  return json_fetcher(url);
}

//Initial Sunset and Sunrise API Fetch// --> 'E'
// 1. Three 'const' that will store:
//     a. const w/ params needed - 'A'.
//     b. querystring const that calls function above - 'B'.
//     c. url const that concatenates the query and url for API
// 2. Fetch to 'https://api.sunrise-sunset.org/json' which will return json object 
// (using the function above) with location info.
function sun_rise_set_fetch(lat_lng) {
  const params = {
    lat: lat_lng.loc.split(",")[0],
	lng: lat_lng.loc.split(",")[1]
  };

  const queryString = formatQueryParams(params)
  const url = sun_rise_set_api_data.searchURL + '?' + queryString;

  return json_fetcher(url);
}

function sun_rise_set_fetch_alt(lat_lng) {
  const params = {
    lat: lat_lng.loc.split(",")[0],
	lng: lat_lng.loc.split(",")[1],
	date: 'yesterday'
  };

  const queryString = formatQueryParams(params)
  const url = sun_rise_set_api_data.searchURL + '?' + queryString;

  return json_fetcher(url);
}

//Variable creator function for fetch results//
let api_results = '0'; 

function fetch_results_store(results) {
	return new Promise (function(resolve, reject) {
		api_results = results;
		resolve(results);	
	});
}

//Come Together Function//
// 1. Call 'D'
// 2. .then Call 'E' (w/ response from 'D')
// 3. function that creates variable that stores the results...
function first_promise() {
	ip_geolocator_fetch()
		.then(lat_lng => sun_rise_set_fetch(lat_lng))
		.then(results => fetch_results_store(results)) // Do I need this???
		.then(results => {
			console.log(`this worked on 111`);
			if (
				((((((parseInt((api_results.results.sunrise.split(":"))[0])) - clock.regularTime.timezoneOffset) * 60) + (parseInt((api_results.results.sunrise.split(":"))[1]))) * 60) + (parseInt((api_results.results.sunrise.split(":"))[2]))) >= clock.regularTime.regDayCurrentInSeconds
			) {
				console.log(`this 'if' worked on 115`);
				ip_geolocator_fetch()
					.then(lat_lng => sun_rise_set_fetch_alt(lat_lng))
					.then(results => fetch_results_store(results))
					.then(results => day_night_length_calculator(results))
					.then(clock => {
						time_sync(clock);
						if (clock.day_clock.dayLengthInSeconds > ((86400 - (((((((parseInt((api_results.results.sunset.split(":"))[0])) - clock.regularTime.timezoneOffset) + 12) * 60) + (parseInt((api_results.results.sunset.split(":"))[1]))) * 60) + (parseInt((api_results.results.sunset.split(":"))[2])))) + (clock.regularTime.regDayCurrentInSeconds))) {
							console.log(`this 'if' is being called on 123`);
							day_ticker_trigger(clock);
						} else {
							console.log(`this 'else' is being called on 126`);
							night_ticker_trigger(clock);
						}
					})
			} else {
				console.log(`this 'else' worked on 131`);
				ip_geolocator_fetch()
					.then(lat_lng => sun_rise_set_fetch(lat_lng))
					.then(results => fetch_results_store(results))
					.then(results => day_night_length_calculator(results))
					.then(clock => {
						time_sync(clock);
						if (clock.day_clock.dayLengthInSeconds > ((86400 - (((((((parseInt((api_results.results.sunset.split(":"))[0])) - clock.regularTime.timezoneOffset) + 12) * 60) + (parseInt((api_results.results.sunset.split(":"))[1]))) * 60) + (parseInt((api_results.results.sunset.split(":"))[2])))) + (clock.regularTime.regDayCurrentInSeconds))) {
							day_ticker_trigger(clock);
						} else {
							night_ticker_trigger(clock);
						}
					})
			}
		})
}

/*The Math Behind the Talmudic Clock Side (TMBTCS)*/

//A. Create clock variables for day and night clocks, respectively.//
let clock =
	{
		day_clock:
			{
				hours: 00,
				minutes: 00,
				seconds: 00,
				milliseconds: 0000,
				talmudicDayMinute: 0,
				dayLengthInSeconds: 0,
				currentTalmudicSecondFromSunrise: 0
			},
		night_clock:
			{
				hours: 00,
				minutes: 00,
				seconds: 00,
				milliseconds: 0000,
				talmudicNightMinute: 0,
				nightLengthInSeconds: 0,
				currentTalmudicSecondFromSunset: 0
			},
		regularTime:
			{
				hours: 00,
				minutes: 00,
				seconds: 00,
				milliseconds: 0000,
				regDayCurrentInSeconds: 0,
				timezoneOffset: 0,
				sunriseToday: 0,
				sunsetToday: 0
			}
	}



//B. Calculate day length and night length in seconds from "The API Side- Basic".//
function day_night_length_calculator() {
	return new Promise (function(resolve, reject) { // is there a way to clean this all up?
		let currentSunsetInSeconds = (((((((parseInt((api_results.results.sunset.split(":"))[0])) - clock.regularTime.timezoneOffset) + 12) * 60) + (parseInt((api_results.results.sunset.split(":"))[1]))) * 60) + (parseInt((api_results.results.sunset.split(":"))[2])));
		clock.regularTime.sunsetToday = currentSunsetInSeconds;
		let currentSunriseInSeconds = ((((((parseInt((api_results.results.sunrise.split(":"))[0])) - clock.regularTime.timezoneOffset) * 60) + (parseInt((api_results.results.sunrise.split(":"))[1]))) * 60) + (parseInt((api_results.results.sunrise.split(":"))[2])));
		clock.regularTime.sunriseToday = currentSunriseInSeconds;
		let dayLength = api_results.results.day_length;
		let splitDayLength = dayLength.split(":");
		clock.day_clock.dayLengthInSeconds = ((((parseInt(splitDayLength[0]) * 60) + (parseInt(splitDayLength[1]))) * 60) + (parseInt(splitDayLength[2])));
		clock.night_clock.nightLengthInSeconds = ((86400) - (clock.day_clock.dayLengthInSeconds));
		let twelvePartsDay = clock.day_clock.dayLengthInSeconds / 12;
		let twelvePartsNight = clock.night_clock.nightLengthInSeconds / 12;
		clock.day_clock.talmudicDayMinute = ((twelvePartsDay) / 60);
		clock.night_clock.talmudicNightMinute = ((twelvePartsNight) / 60);
		if (((clock.regularTime.regDayCurrentInSeconds) - (currentSunriseInSeconds)) >= 0) {
			console.log(`this 'if' worked on 204`);
			let currentTalmudicSecondFromSunset = ( (clock.day_clock.currentTalmudicSecondFromSunrise) - (clock.day_clock.dayLengthInSeconds) );
			clock.night_clock.currentTalmudicSecondFromSunset = currentTalmudicSecondFromSunset;
		} else {
			console.log(`this 'else' worked on 208`);
			let currentTalmudicSecondFromSunset = ((86400 - currentSunsetInSeconds) + (clock.regularTime.regDayCurrentInSeconds));
			clock.night_clock.currentTalmudicSecondFromSunset = currentTalmudicSecondFromSunset;
		};
		if ((clock.regularTime.regDayCurrentInSeconds) - (currentSunriseInSeconds) >= 0) {
			let currentTalmudicSecondFromSunrise = (clock.regularTime.regDayCurrentInSeconds) - (currentSunriseInSeconds);
			clock.day_clock.currentTalmudicSecondFromSunrise = currentTalmudicSecondFromSunrise;
		} else {
			let currentTalmudicSecondFromSunrise = ((86400 - currentSunriseInSeconds) + (clock.regularTime.regDayCurrentInSeconds));
			clock.day_clock.currentTalmudicSecondFromSunrise = currentTalmudicSecondFromSunrise;
		};
		resolve(clock);
	});
}


//C. Create function that uses the above second calculation that will make a 
// minute ticker (timeout) for day and night.//
//D. Create function that will use minute ticker (timeout) and increment the 
// clock variables.//
let dayTicker = '';
let nightTicker = '';

function day_ticker_trigger(clock) {
	return new Promise ((resolve, reject) => {
		dayTicker = setInterval(() => {
			clock.day_clock.seconds = clock.day_clock.seconds + 1;
			console.log(dayClockArray);
			day_minute_hour_ticker_checker(clock);
			reg_time_pull();
			dayClockArray = `This is the current Talmudic day time: ${clock.day_clock.hours}:${clock.day_clock.minutes}:${clock.day_clock.seconds}`;
			console.log(regClockArray);
		}, 1000)
		dayTicker;	
		resolve(resultsTwo);	
	})
}

function night_ticker_trigger(clock) {
	nightTicker = setInterval(() => {
		clock.night_clock.seconds = clock.night_clock.seconds + 1;
		console.log(nightClockArray);
		night_minute_hour_ticker_checker(clock);
		reg_time_pull();
		nightClockArray = `This is the current Talmudic night time: ${clock.night_clock.hours}:${clock.night_clock.minutes}:${clock.night_clock.seconds}`;
		console.log(regClockArray);
	}, 1000)
	nightTicker;
}

function day_minute_hour_ticker_checker(clock) {
	if (clock.day_clock.seconds >= (clock.day_clock.talmudicDayMinute - 1)) {
		clock.day_clock.minutes = clock.day_clock.minutes + 1;
		clock.day_clock.seconds = 00;
		console.log(clock);
	};
	if (clock.day_clock.minutes >= 59) {
		clock.day_clock.hours = clock.day_clock.hours + 1;
		clock.day_clock.minutes = 00;
		console.log(clock.day_clock);
	};
	if (clock.day_clock.hours >= 12) {
		clock.day_clock.hours = 00;
		clock.day_clock.minutes = 00;
		clock.day_clock.seconds = 00;
		console.log(clock.day_clock);
		clearInterval(dayTicker);
		night_ticker_trigger(clock);
	};
}

function night_minute_hour_ticker_checker(clock) {
	if (clock.night_clock.seconds >= (clock.night_clock.talmudicNightMinute - 1)) {
		clock.night_clock.minutes = clock.night_clock.minutes + 1;
		clock.night_clock.seconds = 00;
		console.log(clock);
	};
	if (clock.night_clock.minutes >= 59) {
		clock.night_clock.hours = clock.night_clock.hours + 1;
		clock.night_clock.minutes = 00;
		console.log(clock.night_clock);
	};
	if (clock.night_clock.hours >= 12) {
		clock.night_clock.hours = 00;
		clock.night_clock.minutes = 00;
		clock.night_clock.seconds = 00;
		console.log(clock.day_clock);
		clearInterval(nightTicker);
		day_ticker_trigger(clock); 
	};
}

//E. Create function that will take current day time from location 
// (possibly retrived from ip-loc function above) and calculate what time of day 
// (or night) the talmudic time is currently up to and set the clock varaibles with
// that info as its base time. (should load on start of page and reload button).//
let regClockArray = '';

function reg_time_pull() {
	let regularTimePull = new Date();
	clock.regularTime.hours = regularTimePull.getHours();
	clock.regularTime.minutes = regularTimePull.getMinutes();
	clock.regularTime.seconds = regularTimePull.getSeconds();
	clock.regularTime.milliseconds = regularTimePull.getMilliseconds();
	clock.regularTime.timezoneOffset = ((regularTimePull.getTimezoneOffset()) / 60);
	clock.regularTime.regDayCurrentInSeconds = convertTimeToSeconds(clock.regularTime.hours, clock.regularTime.minutes, clock.regularTime.seconds);
	regClockArray = `This is the current regular time: ${clock.regularTime.hours}:${clock.regularTime.minutes}:${clock.regularTime.seconds}`;
}

let nightClockArray = '';
let dayClockArray = '';


function time_sync(clock) {
	return new Promise ((resolve, reject) => {	
		if (clock.night_clock.currentTalmudicSecondFromSunset > clock.night_clock.nightLengthInSeconds) {
			let currentTalmudicDayTimeInMinutes = (clock.day_clock.currentTalmudicSecondFromSunrise / clock.day_clock.talmudicDayMinute);
			let currentTalmudicDayTimeInMinutesSplit = currentTalmudicDayTimeInMinutes.toString().split('.');
			let currentTalmudicDayHour = (currentTalmudicDayTimeInMinutesSplit[0] / 60);
			let currentTalmudicDayHourSplit = currentTalmudicDayHour.toString().split('.');
			clock.day_clock.hours = parseInt(currentTalmudicDayHourSplit[0]);
			if (currentTalmudicDayTimeInMinutes <= 59) {
				clock.day_clock.minutes = parseInt(currentTalmudicDayTimeInMinutesSplit[0]);
			} else {
				clock.day_clock.minutes = parseInt((String(((parseInt(currentTalmudicDayHourSplit[1].substring(0, 3))) * 600) / 1000)).substring(0, 2));
			};
			clock.day_clock.seconds = parseInt((String(((parseInt(currentTalmudicDayTimeInMinutesSplit[1].substring(0, 2))) * clock.day_clock.talmudicDayMinute) / 100)).substring(0, 2));
			console.log(clock.day_clock);
		} else {
			let currentTalmudicNightTime = (clock.night_clock.currentTalmudicSecondFromSunset);
			let currentTalmudicNightTime_secondsPerHour = currentTalmudicNightTime / clock.night_clock.talmudicNightMinute;
			let currentTalmudicNightTime_secondsPerHourSplit = currentTalmudicNightTime_secondsPerHour.toString().split('.');
			let currentTalmudicNightHour = (currentTalmudicNightTime_secondsPerHourSplit[0] / 60);
			let currentTalmudicNightHourSplit = currentTalmudicNightHour.toString().split('.');
			clock.night_clock.hours = parseInt(currentTalmudicNightHourSplit[0]);
			if (currentTalmudicNightTime_secondsPerHourSplit[0] <= 59) {
				clock.night_clock.minutes = parseInt(currentTalmudicNightTime_secondsPerHourSplit[0]);
			} else {
				clock.night_clock.minutes = parseInt((String(((parseInt(currentTalmudicNightHourSplit[1].substring(0, 3))) * 600) / 1000)).substring(0, 2));
			};
			clock.night_clock.seconds = parseInt((String(((parseInt(currentTalmudicNightTime_secondsPerHourSplit[1].substring(0, 2))) * clock.night_clock.talmudicNightMinute) / 100)).substring(0, 2));
			console.log(clock.night_clock);
		}
	resolve(clock);
	})
}

/*Other Functions to be inserted above*/
// A. Insert dif location
// B. Sync Clock Button
// C. Important time functions...


/*Drawing the Analog Clock Side (DACS)*/
//


/*Drawing the Digital Clocks Side (DDCS)*/
// 


/*Run All Functions*/
reg_time_pull();
first_promise();

//Simplifying Functions//
function convertTimeToSeconds(hours, minutes, seconds) {
	return ((((hours * 60) + (minutes)) * 60)  + seconds);
}


