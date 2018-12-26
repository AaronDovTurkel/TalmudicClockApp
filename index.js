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

let new_day = true;

function new_day_toggle() {
	return new Promise (function(resolve, reject) {
		ip_geolocator_fetch()
			.then(lat_lng => sun_rise_set_fetch(lat_lng))
			.then(results => fetch_results_store(results)) // Do I need this???
			.then(results => {
				console.log(`this worked on 110`);
				convertTimeToSecondsUtc(api_results.results.sunrise, clock.regularTime.timezoneOffset);
				if (
					info_store.timeInSecondsUtc >= clock.regularTime.regDayCurrentInSeconds
				) {
					console.log(`this 'if' worked on 115`);
					new_day = false;
				} else {
					console.log(`this 'else' worked on 118`);
					new_day = true;
				}
			})
		resolve();
	})
};
	
//Come Together Function//
// 1. Call 'D'
// 2. .then Call 'E' (w/ response from 'D')
// 3. function that creates variable that stores the results...
function before_sunrise_promise() {
	ip_geolocator_fetch()
		.then(lat_lng => sun_rise_set_fetch_alt(lat_lng))
		.then(results => fetch_results_store(results))
		.then(results => day_night_length_calculator(results))
		.then(clock => {
			convertTimeToSecondsUtc(api_results.results.sunset, clock.regularTime.timezoneOffset);
			time_sync(clock);
			if (clock.regularTime.regDayCurrentInSeconds < (86400 - info_store.timeInSecondsUtc)) {
				console.log(`this 'if' is being called on 139`);
				day_ticker_trigger(clock);
			} else {
				console.log(`this 'else' is being called on 142`);
				night_ticker_trigger(clock);
			}
		})
};

function after_sunrise_promise() {
	ip_geolocator_fetch()
		.then(lat_lng => sun_rise_set_fetch(lat_lng))
		.then(results => fetch_results_store(results))
		.then(results => day_night_length_calculator(results))
		.then(clock => {
			convertTimeToSecondsUtc(api_results.results.sunset, clock.regularTime.timezoneOffset);
			time_sync(clock);
			if (clock.regularTime.regDayCurrentInSeconds < (86400 - info_store.timeInSecondsUtc)) {
				console.log(`this 'if' is being called on 157`);
				day_ticker_trigger(clock);
			} else {
				console.log(`this 'else' is being called on 160`);
				night_ticker_trigger(clock);
			}
		})
};


/*The Math Behind the Talmudic Clock Side (TMBTCS)*/

//A. Create clock variables for day and night clocks, respectively.//
let clock =
	{
		day_clock:
			{
				hours: 00,
				minutes: 00,
				seconds: 00,
				talmudicDayMinute: 0,
				dayLengthInSeconds: 0,
				currentTalmudicSecondFromSunrise: 0
			},
		night_clock:
			{
				hours: 00,
				minutes: 00,
				seconds: 00,
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
		clock.regularTime.sunsetToday = convertTimeToSecondsUtc(api_results.results.sunset, clock.regularTime.timezoneOffset);
		clock.regularTime.sunriseToday = convertTimeToSecondsUtc(api_results.results.sunrise, clock.regularTime.timezoneOffset);
		clock.day_clock.dayLengthInSeconds = convertTimeToSeconds(api_results.results.day_length);
		clock.night_clock.nightLengthInSeconds = ((86400) - (clock.day_clock.dayLengthInSeconds));
		let twelvePartsDay = clock.day_clock.dayLengthInSeconds / 12;
		let twelvePartsNight = clock.night_clock.nightLengthInSeconds / 12;
		clock.day_clock.talmudicDayMinute = ((twelvePartsDay) / 60);
		clock.night_clock.talmudicNightMinute = ((twelvePartsNight) / 60);
		if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
			// After sunrise but before sunset
			console.log(`this 'if' worked on 218`);
			clock.day_clock.currentTalmudicSecondFromSunrise = (clock.regularTime.regDayCurrentInSeconds) - (clock.regularTime.sunriseToday);
			clock.night_clock.currentTalmudicSecondFromSunset = 00;
		} else if ((((clock.regularTime.regDayCurrentInSeconds) - (clock.regularTime.sunriseToday)) <= 0) && (((clock.regularTime.regDayCurrentInSeconds) - (clock.regularTime.sunriseToday)) <= clock.regularTime.sunriseToday)) {
			// Before sunrise but after midnight
			console.log(`this 'else if' worked on 223`);
			clock.day_clock.currentTalmudicSecondFromSunrise = 00;
			clock.night_clock.currentTalmudicSecondFromSunset = ((clock.night_clock.nightLengthInSeconds) + (clock.regularTime.regDayCurrentInSeconds));
		} else if ((((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday)) >= (clock.day_clock.dayLengthInSeconds)) && ((clock.regularTime.regDayCurrentInSeconds >= clock.day_clock.dayLengthInSeconds))) {
			// after sunset but before midnight
			console.log(`This 'else if' worked on 228`)
			clock.day_clock.currentTalmudicSecondFromSunrise = 00;
			clock.night_clock.currentTalmudicSecondFromSunset = (clock.regularTime.regDayCurrentInSeconds - (clock.regularTime.sunsetToday + 43200));
		} else {
			console.log(`Error: Something went wrong with day_night_length_calculator() on line 232`)
		}
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
			dayClockArray = `${clock.day_clock.hours}:${clock.day_clock.minutes}:${clock.day_clock.seconds}`;
			console.log(regClockArray);
		}, 1000)
		dayTicker;	
		resolve(clock);	
	})
}

function night_ticker_trigger(clock) {
	nightTicker = setInterval(() => {
		clock.night_clock.seconds = clock.night_clock.seconds + 1;
		console.log(nightClockArray);
		night_minute_hour_ticker_checker(clock);
		reg_time_pull();
		nightClockArray = `${clock.night_clock.hours}:${clock.night_clock.minutes}:${clock.night_clock.seconds}`;
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
	clock.regularTime.regDayCurrentInSeconds = convertTimeToSeconds(clock.regularTime);
	regClockArray = `${clock.regularTime.hours}:${clock.regularTime.minutes}:${clock.regularTime.seconds}`;
}

let nightClockArray = '';
let dayClockArray = '';


function time_sync(clock) {
	return new Promise ((resolve, reject) => {	
		if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
			// After sunrise but before sunset
			let currentTalmudicDayTimeInMinutes = (clock.day_clock.currentTalmudicSecondFromSunrise / clock.day_clock.talmudicDayMinute);
			let currentTalmudicDayHour = (currentTalmudicDayTimeInMinutes / 60);
			clock.day_clock.hours = Math.trunc(currentTalmudicDayHour);
			clock.day_clock.minutes = extractMinutesOrSecondsFromDecimal(currentTalmudicDayHour);
			clock.day_clock.seconds = extractMinutesOrSecondsFromDecimal(currentTalmudicDayTimeInMinutes);
		} else {
			let currentTalmudicNightTime = (clock.night_clock.currentTalmudicSecondFromSunset);
			let currentTalmudicNightTime_secondsPerHour = currentTalmudicNightTime / clock.night_clock.talmudicNightMinute;
			let test = currentTalmudicNightTime_secondsPerHour / 60;
			console.log(test);
			let test2 = (test) % 60;
			console.log(test2);
			clock.night_clock.hours = Math.trunc(test);
			console.log(clock.night_clock.hours);
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


//Simplifying Functions//
function convertTimeToSeconds(time) {
	if (typeof time === "string" || time instanceof String) {
		splitAndParseInt(time);
		info_store.timeInSeconds = ((((info_store.parsedArray[0] * 60) + (info_store.parsedArray[1])) * 60)  + info_store.parsedArray[2]);
	} else if (typeof time === "object" || time instanceof Object) {
		info_store.timeInSeconds = ((((time.hours * 60) + (time.minutes)) * 60)  + time.seconds);
	} else {
		info_store.timeInSeconds = ((((time[0] * 60) + (time[1])) * 60)  + time[2]);
	};
	return info_store.timeInSeconds;
}

function convertTimeToSecondsUtc(time, utc) {
	if (typeof time === "string" || time instanceof String) {
		splitAndParseInt(time);
		info_store.timeInSecondsUtc = (((((info_store.parsedArray[0] - utc) * 60) + (info_store.parsedArray[1])) * 60)  + info_store.parsedArray[2]);
	} else if (typeof time === "object" || time instanceof Object) {
		info_store.timeInSecondsUtc = (((((time.hours - utc) * 60 ) + (time.minutes)) * 60)  + time.seconds);
	} else {
		info_store.timeInSecondsUtc = (((((time[0] - utc) * 60) + (time[1])) * 60)  + time[2]);
	};
	return info_store.timeInSecondsUtc;
}

function splitAndParseInt(time) {
	info_store.parsedArray = [(parseInt((time.split(":"))[0])), (parseInt((time.split(":"))[1])), (parseInt((time.split(":"))[2]))];
}

function spliceDecimalPoint(int) {
	let numberSplit = (String(int)).split(".");
	console.log(`line 441. ` + numberSplit);
	let splitParse = parseInt(numberSplit[1]);
	info_store.minuteConversion = splitParse
	return info_store.minuteConversion;
}

function getlength(int) {
	console.log((`line 448. `) + ((((String(int)).replace('.', '')).length) - (String((Math.trunc(int)))).length));
    return (((String(int)).replace('.', '')).length) - (String((Math.trunc(int)))).length;
}

function padZero1(int) {
	let paddedNumber = `1`;
	for (i = 0; i < int; i++) {
		paddedNumber = paddedNumber + `0`;
	}
	return parseInt(paddedNumber);
}

function padZero(int) {
	let paddedNumber = `number`;
	for (i = 0; i < int; i++) {
		paddedNumber = paddedNumber + `0`;
	}
	let parsedNumber = parseInt(paddedNumber)
	return parsedNumber;
}

function extractMinutesOrSecondsFromDecimal(number) {
	let finalResult = 00;
	if ((number - (Math.floor(number))) !== 0) {
		spliceDecimalPoint(number);
		console.log(`line 472. ` + info_store.minuteConversion);
		let lengthOfDecimal = getlength(number);
		console.log(`line 474. ` + lengthOfDecimal);
		let minuteConverted = ((info_store.minuteConversion * 60) / padZero1(lengthOfDecimal));
		console.log(`line 476. ` + minuteConverted);
		if ((String(minuteConverted)).includes("e") === true) {
			finalResult = 00;
			console.log(`line 479. ` + ((String(minuteConverted)).includes("e") === true));
		} else {
			finalResult = (parseInt(String(minuteConverted).substring(0, 2)));
			console.log(`line 482. ` + (parseInt(String(minuteConverted).substring(0, 2))));
		}
		/*if ((String(finalResult)).length === 1) {
			finalResult = `0${finalResult}`;
		}*/
		return finalResult;
	} else {
		return 00;
	}
}


/*Extra Store*/

let info_store = {
	timeInSeconds: '',
	timeInSecondsUtc: '',
	parsedArray: '',
	minuteConversion: 0
}


/*Run All Functions*/
function run_all_functions() {
	reg_time_pull();
	new_day_toggle()
		.then(() => {
			if (new_day === true) {
				after_sunrise_promise();
			} else {
				before_sunrise_promise();
			}
		})
}

run_all_functions();