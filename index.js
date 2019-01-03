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

const geocoding_google_api = {
	apiKey: 'AIzaSyCfYCurA2DoL9SIN0MmIiZWcIG1RP0LRx4', 
	searchURL: 'https://maps.googleapis.com/maps/api/geocode/json',
}

const utc_offset_google_api = {
	apiKey: 'AIzaSyCfYCurA2DoL9SIN0MmIiZWcIG1RP0LRx4',
	searchURL: 'https://maps.googleapis.com/maps/api/timezone/json'
}

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

function geocodeing_google_fetch(zip_code) {
	const params = {
		address: zip_code,
		key: geocoding_google_api.apiKey
	};
	const queryString = formatQueryParams(params)
	const url = geocoding_google_api.searchURL + '?' + queryString;
  
	return json_fetcher(url);
}

function changed_location_time_fetch(lat_lng) {
	const params = {
		location: lat_lng.results[0].geometry.location.lat + ',' + lat_lng.results[0].geometry.location.lng,
		timestamp: Math.floor(Date.now() / 1000),
		key: utc_offset_google_api.apiKey,
	};
	const queryString = formatQueryParams(params)
	const url = utc_offset_google_api.searchURL + '?' + queryString;

	console.log(url);
  
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

function sun_rise_set_fetch_changed_location(lat_lng) {
	const params = {
	  lat: lat_lng.results[0].geometry.location.lat,
	  lng: lat_lng.results[0].geometry.location.lng
	};
  
	const queryString = formatQueryParams(params)
	const url = sun_rise_set_api_data.searchURL + '?' + queryString;
  
	return json_fetcher(url);
}

function sun_rise_set_fetch_changed_location_alt(lat_lng) {
	const params = {
		lat: lat_lng.results[0].geometry.location.lat,
		lng: lat_lng.results[0].geometry.location.lng,
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

function initial_pull_and_new_day_toggle() {
	return new Promise (function(resolve, reject) {
		ip_geolocator_fetch()
			.then(lat_lng => sun_rise_set_fetch(lat_lng))
			.then(results => fetch_results_store(results))
			.then(results => {
				convertTimeToSecondsUtc(api_results.results.sunrise, clock.regularTime.timezoneOffset);
				if (
					info_store.timeInSecondsUtc >= clock.regularTime.regDayCurrentInSeconds
				) {
					new_day = false;
					before_sunrise_promise()
				} else {
					new_day = true;
					after_sunrise_promise()
				}
			})
		resolve();
	})
};

function changed_location_time_pull(zip_code) {
	clearInterval(dayTicker);
	clearInterval(nightTicker);
	geocodeing_google_fetch(zip_code)
		.then(lat_lng => changed_location_time_fetch(lat_lng))
		.then(results => {
			utcOffset = results.rawOffset;
			reg_time_pull(utcOffset);
		})
		.then(() => {
			geocodeing_google_fetch(zip_code)
			.then(lat_lng => sun_rise_set_fetch_changed_location(lat_lng))
			.then(results => fetch_results_store(results))
			.then(results => {
				convertTimeToSecondsUtc(api_results.results.sunrise, clock.regularTime.timezoneOffset);
				if (
					info_store.timeInSecondsUtc >= clock.regularTime.regDayCurrentInSeconds
				) {
					new_day = false;
					before_sunrise_promise_alt()
				} else {
					new_day = true;
					after_sunrise_promise_alt()
				}
			});
		})
}



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
			if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
				day_ticker_trigger(clock);
				drawClock();
			} else {
				night_ticker_trigger(clock);
				drawClock();
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
			if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
				day_ticker_trigger(clock);
				drawClock();
			} else {
				night_ticker_trigger(clock);
				drawClock();
			}
		})
};

function before_sunrise_promise_alt() {
	geocodeing_google_fetch(zip_code)
		.then(lat_lng => sun_rise_set_fetch_changed_location_alt(lat_lng))
		.then(results => fetch_results_store(results))
		.then(results => day_night_length_calculator(results))
		.then(clock => {
			convertTimeToSecondsUtc(api_results.results.sunset, clock.regularTime.timezoneOffset);
			time_sync(clock);
			if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
				day_ticker_trigger(clock);
				drawClock();
			} else {
				night_ticker_trigger(clock);
				drawClock();
			}
		})
};

function after_sunrise_promise_alt() {
	geocodeing_google_fetch(zip_code)
		.then(lat_lng => sun_rise_set_fetch_changed_location(lat_lng))
		.then(results => fetch_results_store(results))
		.then(results => day_night_length_calculator(results))
		.then(clock => {
			convertTimeToSecondsUtc(api_results.results.sunset, clock.regularTime.timezoneOffset);
			time_sync(clock);
			if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
				day_ticker_trigger(clock);
				drawClock();
			} else {
				night_ticker_trigger(clock);
				drawClock();
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
	return new Promise (function(resolve, reject) {
		if (utcOffset !== 0) {
			clock.regularTime.sunsetToday = convertTimeToSecondsUtc(api_results.results.sunset, (Math.abs(((utcOffset / 60) / 60))));
		} else {
			clock.regularTime.sunsetToday = convertTimeToSecondsUtc(api_results.results.sunset, clock.regularTime.timezoneOffset);
		}
		if (utcOffset !== 0) {
			clock.regularTime.sunriseToday = convertTimeToSecondsUtc(api_results.results.sunrise, (Math.abs(((utcOffset / 60) / 60))));
		} else {
			clock.regularTime.sunriseToday = convertTimeToSecondsUtc(api_results.results.sunrise, clock.regularTime.timezoneOffset);
		}
		clock.day_clock.dayLengthInSeconds = convertTimeToSeconds(api_results.results.day_length);
		clock.night_clock.nightLengthInSeconds = ((86400) - (clock.day_clock.dayLengthInSeconds));
		let twelvePartsDay = clock.day_clock.dayLengthInSeconds / 12;
		let twelvePartsNight = clock.night_clock.nightLengthInSeconds / 12;
		clock.day_clock.talmudicDayMinute = ((twelvePartsDay) / 60);
		clock.night_clock.talmudicNightMinute = ((twelvePartsNight) / 60);
		if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
			// After sunrise but before sunset
			console.log(`348`);
			clock.day_clock.currentTalmudicSecondFromSunrise = (clock.regularTime.regDayCurrentInSeconds) - (clock.regularTime.sunriseToday);
			clock.night_clock.currentTalmudicSecondFromSunset = 00;
		} else if ((((clock.regularTime.regDayCurrentInSeconds) - (clock.regularTime.sunriseToday)) <= 0) && (((clock.regularTime.regDayCurrentInSeconds) - (clock.regularTime.sunriseToday)) <= clock.regularTime.sunriseToday)) {
			// Before sunrise but after midnight
			console.log(`353`);
			clock.day_clock.currentTalmudicSecondFromSunrise = 00;
			clock.night_clock.currentTalmudicSecondFromSunset = ((86400 - (clock.day_clock.dayLengthInSeconds + clock.regularTime.sunriseToday)) + (clock.regularTime.regDayCurrentInSeconds));
		} else if ((((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday)) >= (clock.day_clock.dayLengthInSeconds)) && ((clock.regularTime.regDayCurrentInSeconds >= clock.day_clock.dayLengthInSeconds))) {
			// after sunset but before midnight
			console.log(`358`);
			clock.day_clock.currentTalmudicSecondFromSunrise = 00;
			clock.night_clock.currentTalmudicSecondFromSunset = (clock.regularTime.regDayCurrentInSeconds - (clock.regularTime.sunsetToday + 43200));
		} else {
			console.log(`Error: Something went wrong with day_night_length_calculator() on line 232`)
		}
		resolve(clock);
		console.log(clock);
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
			day_minute_hour_ticker_checker(clock);
			reg_time_pull(utcOffset);
			dayClockArray = `${padArrayDisplay(clock.day_clock.hours)}${clock.day_clock.hours}:${padArrayDisplay(clock.day_clock.minutes)}${clock.day_clock.minutes}:${padArrayDisplay(clock.day_clock.seconds)}${clock.day_clock.seconds}`;
			drawClock();
			$(regular_digital_clock_display);
			$(talmudic_digital_clock_display);
		}, 1000)
		dayTicker;	
		resolve(clock);	
	})
}

function night_ticker_trigger(clock) {
	nightTicker = setInterval(() => {
		clock.night_clock.seconds = clock.night_clock.seconds + 1;
		night_minute_hour_ticker_checker(clock);
		reg_time_pull(utcOffset);
		nightClockArray = `${padArrayDisplay(clock.night_clock.hours)}${clock.night_clock.hours}:${padArrayDisplay(clock.night_clock.minutes)}${clock.night_clock.minutes}:${padArrayDisplay(clock.night_clock.seconds)}${clock.night_clock.seconds}`;
		drawClock();
		$(regular_digital_clock_display);
		$(talmudic_digital_clock_display);
	}, 1000)
	nightTicker;
}

function day_minute_hour_ticker_checker(clock) {
	if (clock.day_clock.seconds >= (clock.day_clock.talmudicDayMinute - 1)) {
		clock.day_clock.minutes = clock.day_clock.minutes + 1;
		clock.day_clock.seconds = 00;
	};
	if (clock.day_clock.minutes > 59) {
		clock.day_clock.hours = clock.day_clock.hours + 1;
		clock.day_clock.minutes = 00;
	};
	if (clock.day_clock.hours >= 12) {
		clock.day_clock.hours = 00;
		clock.day_clock.minutes = 00;
		clock.day_clock.seconds = 00;
		clearInterval(dayTicker);
		night_ticker_trigger(clock);
		console.log(clock);
	};
}

function night_minute_hour_ticker_checker(clock) {
	if (clock.night_clock.seconds >= (clock.night_clock.talmudicNightMinute - 1)) {
		clock.night_clock.minutes = clock.night_clock.minutes + 1;
		clock.night_clock.seconds = 00;
	};
	if (clock.night_clock.minutes > 59) {
		clock.night_clock.hours = clock.night_clock.hours + 1;
		clock.night_clock.minutes = 00;
	};
	if (clock.night_clock.hours >= 12) {
		clock.night_clock.hours = 00;
		clock.night_clock.minutes = 00;
		clock.night_clock.seconds = 00;
		clearInterval(nightTicker);
		day_ticker_trigger(clock); 
		console.log(clock);
	};
}

//E. Create function that will take current day time from location 
// (possibly retrived from ip-loc function above) and calculate what time of day 
// (or night) the talmudic time is currently up to and set the clock varaibles with
// that info as its base time. (should load on start of page and reload button).//
let regClockArray = '';
let utcOffset = 0;

function reg_time_pull(utcOffset) {
	let regularTimePull = new Date();
	clock.regularTime.timezoneOffset = ((regularTimePull.getTimezoneOffset()) / 60);
	if (utcOffset !== 0) {
		clock.regularTime.hours = ((regularTimePull.getHours()) + ((utcOffset / 60) / 60) + clock.regularTime.timezoneOffset);
	} else {
		clock.regularTime.hours = (regularTimePull.getHours());
	}
	clock.regularTime.minutes = regularTimePull.getMinutes();
	clock.regularTime.seconds = regularTimePull.getSeconds();
	clock.regularTime.milliseconds = regularTimePull.getMilliseconds();
	clock.regularTime.timezoneOffset = ((regularTimePull.getTimezoneOffset()) / 60);
	clock.regularTime.regDayCurrentInSeconds = convertTimeToSeconds(clock.regularTime);
	regClockArray = `${padArrayDisplay(clock.regularTime.hours)}${clock.regularTime.hours}:${padArrayDisplay(clock.regularTime.minutes)}${clock.regularTime.minutes}:${padArrayDisplay(clock.regularTime.seconds)}${clock.regularTime.seconds}`;
	console.log(clock);
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
			clock.day_clock.minutes = extractMinutesFromDecimal(currentTalmudicDayHour);
			clock.day_clock.seconds = extractSecondsFromDecimal(currentTalmudicDayTimeInMinutes);
		} else {
			let currentTalmudicNightTime = (clock.night_clock.currentTalmudicSecondFromSunset);
			let currentTalmudicNightTimeInMinutes = currentTalmudicNightTime / clock.night_clock.talmudicNightMinute;
			let currentTalmudicNightHour = (currentTalmudicNightTimeInMinutes / 60);
			clock.night_clock.hours = Math.trunc(currentTalmudicNightHour);
			clock.night_clock.minutes = extractMinutesFromDecimal(currentTalmudicNightHour);
			clock.night_clock.seconds = extractSecondsFromDecimal(currentTalmudicNightTimeInMinutes);
		}
	resolve(clock);
	console.log(clock);
	})
}

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
		console.log(`514`);
		splitAndParseInt(time);
		info_store.timeInSecondsUtc = (((((info_store.parsedArray[0] - utc) * 60) + (info_store.parsedArray[1])) * 60)  + info_store.parsedArray[2]);
	} else if (typeof time === "object" || time instanceof Object) {
		console.log(`518`);
		info_store.timeInSecondsUtc = (((((time.hours - utc) * 60 ) + (time.minutes)) * 60)  + time.seconds);
	} else {
		console.log(`521`);
		info_store.timeInSecondsUtc = (((((time[0] - utc) * 60) + (time[1])) * 60)  + time[2]);
	};
	console.log(info_store.timeInSecondsUtc);
	return info_store.timeInSecondsUtc;
}

function splitAndParseInt(time) {
	info_store.parsedArray = [(parseInt((time.split(":"))[0])), (parseInt((time.split(":"))[1])), (parseInt((time.split(":"))[2]))];
}

function spliceDecimalPoint(int) {
	let numberSplit = (String(int)).split(".");
	let splitParse = parseInt(numberSplit[1]);
	info_store.minuteConversion = splitParse
	return info_store.minuteConversion;
}

function getlength(int) {
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

function extractMinutesFromDecimal(number) {
	let finalResult = 00;
	if ((number - (Math.floor(number))) !== 0) {
		spliceDecimalPoint(number);
		let lengthOfDecimal = getlength(number);
		let minuteConverted = ((info_store.minuteConversion * 60) / padZero1(lengthOfDecimal));
		if ((String(minuteConverted)).includes("e") === true) {
			finalResult = 00;
		} else {
			finalResult = (parseInt(String(minuteConverted).substring(0, 2)));
		}
		return finalResult;
	} else {
		return 00;
	}
}

function extractSecondsFromDecimal(number) {
	let finalResult = 00;
	let minuteConverted = 00;
	if ((number - (Math.floor(number))) !== 0) {
		spliceDecimalPoint(number);
		let lengthOfDecimal = getlength(number);
		if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
			minuteConverted = ((info_store.minuteConversion * clock.day_clock.talmudicDayMinute) / padZero1(lengthOfDecimal));
		} else {
			minuteConverted = ((info_store.minuteConversion * clock.night_clock.talmudicNightMinute) / padZero1(lengthOfDecimal));
		};
		if ((String(minuteConverted)).includes("e") === true) {
			finalResult = 00;
		} else {
			finalResult = (parseInt(String(minuteConverted).substring(0, 2)));
		};
		return finalResult;
	} else {
		return 00;
	}
}

function padArrayDisplay(int) {
	if ((String(int).length) === 1) {
		return `0`;
	} else {
		return ``;
	}
}


/*Extra Store*/
//
let info_store = {
	timeInSeconds: '',
	timeInSecondsUtc: '',
	parsedArray: '',
	minuteConversion: 0
}


/*Other Functions to be inserted above*/
//
function settingsButton() {
	$('.settings').on( "click",( event => {
		event.preventDefault();	
		$('.settings').toggleClass("clickToggle");
		if ($('.settings').hasClass("clickToggle")) {
			$('.analog_clock').css("grid-column", "1 / 2");
			$('.settings_container').css("display", "grid");
		} else {
			$('.analog_clock').css("grid-column", "1 / 3");
			$('.settings_container').css("display", "none");
		}
	}));
}

function list_viewToggle() {
	$('.list-view').on( "click",( event => {
		event.preventDefault();	
		$('.settings_container').css("display", "none");
		$('footer').css("display", "none");
		$('.analog_clock').css("display", "none");
		$('.list_container').css("display", "grid");
		$('.list_container').html(
			`<ul class="hs">
				<li class="item">Sunrise:</li>
				<li class="item">Latest Shema (Gra and Baal HaTanya):</li>
				<li class="item">Latest Shacharit (Gra and Baal HaTanya):</li>
				<li class="item">Midday:</li>
				<li class="item">Earliest Minchah:</li>
				<li class="item">Minchah Ketanah:</li>
				<li class="item">Plag Haminchah:</li>
				<li class="item">Sunset:</li>
				<li class="item">Nightfall (3 stars):</li>
				<li class="item">Nightfall (72 minutes):</li>
			</ul>
			<button type="button" class="return_button"><p>Return</p></button>`
		);
		returnToggle('.list_container');
	}));
}

function changeLocationToggle() {
	$('.change-location').on( "click",( event => {
		event.preventDefault();	
		$('.settings_container').css("display", "none");
		$('footer').css("display", "none");
		$('.analog_clock').css("display", "none");
		$('.list_container').css("display", "grid");
		$('.list_container').html(
			`<form class="change_location_form">
				<label for="zip_code">Please Enter Your Zip Code:</label>
				<input type="text" id="zip_code" name="zip_code" required
				minlength="5" maxlength="5">
				<br>
				<input class="change_location_submit_button" type="submit" value="Submit">
			</form>
			<button type="button" class="return_button"><p>Return</p></button>`
		);
		returnToggle('.list_container');
		submit_location_change();
	}));
}

function submit_location_change() {
	$('.change_location_form').on( "submit",( event => {
		event.preventDefault();	
		zip_code = $('#zip_code').val();
		changed_location_time_pull(zip_code);
		$('.settings_container').css("display", "grid");
		$('footer').css("display", "block");
		$('.analog_clock').css("display", "grid");
		$('.list_container').css("display", "none");
	}));
}

function reportAProblemToggle() {
	$('.report-a-problem').on( "click",( event => {
		event.preventDefault();	
		console.log(`this clicked`);
		$('.settings_container').css("display", "none");
		$('footer').css("display", "none");
		$('.analog_clock').css("display", "none");
		$('.list_container').css("display", "grid");
		$('.list_container').html(
			`<form class="report_a_problem_form">
				<label for="problemReport">What's wrong?</label>
				<br>
				<input type="text" id="problemReport" name="problemReport" min="1">
				<br>
				<input class="report_a_problem_submit" type="submit" value="Submit">
			</form>
			<button type="button" class="return_button"><p>Return</p></button>`
		);
		returnToggle('.list_container');
		submit_report_a_problem()
	}));
}

function submit_report_a_problem() {
	$('.report_a_problem_form').on( "submit",( event => {
		event.preventDefault();	
		problemReport = $('#problemReport').val();
		$('.settings_container').css("display", "grid");
		$('footer').css("display", "block");
		$('.analog_clock').css("display", "grid");
		$('.list_container').css("display", "none");
		window.open(`mailto:theholycoder@gmail.com?subject=Problem With "The Talmudic Clock App" - Customer Report&body=${problemReport}`);
	}));
}

function returnToggle(holder) {
	$('.list_container').on("click", ".return_button",( event => {
		event.preventDefault();	
		console.log(`this clicked`);
		$('.settings_container').css("display", "grid");
		$('footer').css("display", "block");
		$('.analog_clock').css("display", "grid");
		$(holder).css("display", "none")
	}));
}

/*Drawing the Analog Clock Side (DACS)*/
//
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let radius = canvas.height / 2;
ctx.translate(radius, radius);
radius = radius * 0.90
drawClock();

function drawClock() {
	drawFace(ctx, radius);
	drawNumbers(ctx, radius);
	if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
		drawTimeDay(ctx, radius);
	} else {
		drawTimeNight(ctx, radius);
	}
}
  
function drawFace(ctx, radius) {
	let grad;

	ctx.beginPath();
	ctx.arc(0, 0, radius, 0, 2 * Math.PI);
	ctx.fillStyle = 'white';
	ctx.fill();

	grad = ctx.createRadialGradient(0, 0 ,radius * 0.95, 0, 0, radius * 1.05);
	grad.addColorStop(0, 'white');
	grad.addColorStop(0.5, 'green');
	grad.addColorStop(1, 'white');
	ctx.strokeStyle = grad;
	ctx.lineWidth = radius*0.1;
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
	midGrad = ctx.createRadialGradient(0, 0 ,radius * 0.95, 0, 0, radius * 1.05);
	midGrad.addColorStop(0, '#333');
	midGrad.addColorStop(1, '#333');
	ctx.strokeStyle = midGrad;
	ctx.lineWidth = radius*0.1;
	ctx.stroke();
	ctx.fillStyle = 'green';
	ctx.fill();
}

function drawNumbers(ctx, radius) {
	let ang;
	let num;
	ctx.font = radius * 0.15 + "px arial";
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	ctx.fillStyle = 'grey';
	for(num = 1; num < 13; num++){
	  ang = num * Math.PI / 6;
	  ctx.rotate(ang);
	  ctx.translate(0, -radius * 0.85);
	  ctx.rotate(-ang);
	  ctx.fillText(num.toString(), 0, 0);
	  ctx.rotate(ang);
	  ctx.translate(0, radius * 0.85);
	  ctx.rotate(-ang);
	}
}

function drawTimeNight(ctx, radius){
	let hour = clock.night_clock.hours;
	let minute = clock.night_clock.minutes;
	let second = clock.night_clock.seconds;
	//hour
	hour = hour;
	hour = ((hour*Math.PI)/6)+((minute*Math.PI)/(6*60))+((second*Math.PI)/((clock.night_clock.talmudicNightMinute * 2)*clock.night_clock.talmudicNightMinute));
	drawHand(ctx, hour, radius*0.5, radius*0.07);
	//minute
	minute = (minute*Math.PI/30)+(second*Math.PI/((clock.night_clock.talmudicNightMinute / 2)*clock.night_clock.talmudicNightMinute));
	drawHand(ctx, minute, radius*0.8, radius*0.05);
	// second
	second = (second*Math.PI/(clock.night_clock.talmudicNightMinute / 2));
	drawHand(ctx, second, radius*0.9, radius*0.02);
}

function drawTimeDay(ctx, radius){
	let hour = clock.day_clock.hours;
	let minute = clock.day_clock.minutes;
	let second = clock.day_clock.seconds;
	//hour
	hour = hour;
	hour = ((hour*Math.PI)/6)+((minute*Math.PI)/(6*60))+((second*Math.PI)/((clock.day_clock.talmudicDayMinute * 2)*clock.day_clock.talmudicDayMinute));
	drawHand(ctx, hour, radius*0.5, radius*0.07);
	//minute
	minute = (minute*Math.PI/30)+(second*Math.PI/((clock.day_clock.talmudicDayMinute / 2)*clock.day_clock.talmudicDayMinute));
	drawHand(ctx, minute, radius*0.8, radius*0.05);
	// second
	second = (second*Math.PI/(clock.day_clock.talmudicDayMinute / 2));
	drawHand(ctx, second, radius*0.9, radius*0.02);
}
  
function drawHand(ctx, pos, length, width) {
	ctx.beginPath();
	ctx.lineWidth = width;
	ctx.lineCap = "round";
	ctx.moveTo(0,0);
	ctx.rotate(pos);
	ctx.lineTo(0, -length);
	ctx.stroke();
	ctx.rotate(-pos);
}


/*Drawing the Digital Clocks Side (DDCS)*/
// 
function regular_digital_clock_display() {
	$('.regularTimeDisplay').html(
		`${regClockArray}`
	)
}

function talmudic_digital_clock_display() {
	if (((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) >= 0) && ((clock.regularTime.regDayCurrentInSeconds - clock.regularTime.sunriseToday) <= clock.day_clock.dayLengthInSeconds)) {
		$('.talmudicTimeDisplay').html(
			`${dayClockArray}`
		)
	} else {
		$('.talmudicTimeDisplay').html(
			`${nightClockArray}`
		)
	}

}


/*Run All Functions*/

function run_all_functions() {
	reg_time_pull(utcOffset);
	initial_pull_and_new_day_toggle();
	settingsButton();
	list_viewToggle()
	changeLocationToggle();
	reportAProblemToggle();
}

run_all_functions();