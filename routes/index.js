var express = require('express');
var router = express.Router();
var moment = require('moment');
var promise = require('bluebird');
var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = {
    //host: 'localhost',
    //host: process.env.DATABASE_URL,
    port: 5432,
    database: 'openmicnight',
    user: 'openmicer'
};

//var db = pgp(connectionString);
var db = pgp(process.env.DATABASE_URL);


router.post('/api/openmic/save', function(req, res) {
//TODO don't save if this openmic already exists
  var params = req.body;
  var data = {name: params.openMicName, weekday : params.openMicWeekDay,
    regularity : params.openMicRegularity, comedian: params.comedians, poet: params.poets, musician: params.musicians,
    contact_email_address: params.contactEmailAddress, contact_phone_number: params.contactPhoneNumber,
    venue_name: params.venueName, venue_address: params.venueAddress, state: params.state, city: params.city,
    sign_up_time: params.signUpTime, start_time: params.startTime, is_free: params.isOpenMicFree,
    next_openmic_day: params.nextOpenMicDate, notes: params.notes, monday: params.monday,
    tuesday: params.tuesday, wednesday: params.wednesday, thursday: params.thursday,
    friday: params.friday, saturday: params.saturday, sunday: params.sunday};

    if (data.weekday) {
        data[data.weekday] = true;
    }

    data.regularity = data.regularity.replace('-', '');

    var insertOpenMicStatement = 'INSERT INTO openmic(name, regularity, comedian, poet, ' +
    'musician, contact_email_address, contact_phone_number, venue_name, venue_address, state, city, sign_up_time, ' +
    'start_time, is_free, next_openmic_date, notes, monday, tuesday, wednesday, thursday, friday, saturday, sunday) ' +
    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)';

    var nextOpenMicDate = new Date(moment(params.nextOpenMicDate).utc().format());

    db.none(insertOpenMicStatement, [data.name, data.regularity, data.comedian, data.poet, data.musician,
                                    data.contact_email_address, data.contact_phone_number, data.venue_name,
                                    data.venue_address, data.state, data.city, data.sign_up_time, data.start_time,
                                    data.is_free, nextOpenMicDate, data.notes, data.monday, data.tuesday,
                                    data.wednesday, data.thursday, data.friday, data.saturday, data.sunday])
        .then(function () {
            console.log('success!')
        })
        .catch(function (error) {
            console.log(error);
        });

  res.json({ title: 'some open mic' });
});

router.post('/api/openmic/update', function(req, res) {
    var params = req.body;
    var data = {name: params.openmic.openMicName, weekday : params.openmic.openMicWeekDay,
        regularity : params.openmic.openMicRegularity, comedian: params.openmic.comedians, poet: params.openmic.poets, musician: params.openmic.musicians,
        contact_email_address: params.openmic.contactEmailAddress, contact_phone_number: params.openmic.contactPhoneNumber,
        venue_name: params.openmic.venueName, venue_address: params.openmic.venueAddress, state: params.openmic.state, city: params.openmic.city,
        sign_up_time: params.openmic.signUpTime, start_time: params.openmic.startTime, is_free: params.openmic.isOpenMicFree,
        next_openmic_day: params.openmic.nextOpenMicDate, notes: params.openmic.otherNotes, monday: params.openmic.monday,
        tuesday: params.openmic.tuesday, wednesday: params.openmic.wednesday, thursday: params.openmic.thursday,
        friday: params.openmic.friday, saturday: params.openmic.saturday, sunday: params.openmic.sunday, id: params.id};

    if (data.weekday) {
        data[data.weekday] = true;
    }

    data.regularity = data.regularity.replace('-', '');

    for (var key in data) {
        if (data.hasOwnProperty(key) && typeof data[key] === 'undefined') {
            data[key] = false;
        }
    }

    var updateOpenMicStatement = 'UPDATE openmic SET (name, regularity, comedian, poet, ' +
        'musician, contact_email_address, contact_phone_number, venue_name, venue_address, state, city, sign_up_time, ' +
        'start_time, is_free, next_openmic_date, notes, monday, tuesday, wednesday, thursday, friday, saturday, sunday) = ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ' +
        '$14, $15, $16, $17, $18, $19, $20, $21, $22, $23) WHERE id = $24';

    db.none(updateOpenMicStatement, [data.name, data.regularity,
            data.comedian, data.poet, data.musician, data.contact_email_address,
            data.contact_phone_number, data.venue_name, data.venue_address, data.state,
            data.city, data.sign_up_time, data.start_time, data.is_free,
            new Date(data.next_openmic_day), data.notes, data.monday, data.tuesday,
            data.wednesday, data.thursday, data.friday, data.saturday, data.sunday, data.id])
        .then(function () {
            console.log('success!')
        })
        .catch(function (error) {
            console.log(error);
        });

    res.json({ title: 'some open mic' });
});

router.post('/api/openmic/flagForDeletion', function(req, res) {
    var params = req.body;
    var flagOpenMicForDeletionStatement = 'UPDATE openmic SET deletion_requests = deletion_requests + 1 ' +
        'WHERE id = $1';

    db.none(flagOpenMicForDeletionStatement, [params.id])
        .then(function () {
            console.log('success!')
        })
        .catch(function (error) {
            console.log(error);
        });

    res.json({'title': 'flagged this open mic for deletion'});
});

function isOpenMicRelevantToDate(openmic, date) {
  var dateMoment = moment(date).utc();
  var runningDate = moment(openmic.next_openmic_date).utc();
  var regularity = openmic.regularity;
  if (regularity === 'weekly') {
      var weekday = date.format('dddd').toLowerCase();
      if (openmic[weekday] && (dateMoment.isAfter(runningDate, 'day') || dateMoment.isSame(runningDate, 'day'))) {
          return true;
      }
  }

  while(runningDate.isBefore(dateMoment)) {
    if (runningDate.isSame(dateMoment, 'day')){
      return true;
    }

    switch (regularity) {
      case "weekly":
        runningDate.add(7, 'days');
        break;
      case "bi-weekly":
      case "biweekly":
        runningDate.add(14, 'days');
        break;
      case "monthly":
        runningDate.add(1, 'months');
        break;
      default:
        console.log("Unrecognized openmic regularity found.");
    }
  }

  return false;
}

function compareMoments(result1, result2) {
    var moment1 = moment(result1.dateMoment).utc();
    var moment2 = moment(result2.dateMoment).utc();
    if (moment1.isBefore(moment2)) {
        return -1;
    }
    if (moment1.isAfter(moment2)) {
        return 1;
    }

    return 0;
}

router.get('/api/openmic/listForCity', function(req, res) {
    var params = req.query;
    var data = {city: params.city, state: params.state};
    var originalDateMoment = moment().utc();
    var dateMoment = originalDateMoment.clone().utc();
    var openmicsByDate = [];
    var openMicsPromises = [];

    var createOpenMicPromise = function(openmicPromises, openmicsByDate, data, dateMoment){
        var _this = this;
        _this.dateMomentClone = dateMoment.clone().utc();
        var dbPromise = getOpenMicsForDate(data.city, data.state, _this.dateMomentClone);
        openMicsPromises.push(dbPromise);
        dbPromise.then(function(openMicResults){
            var dateSection = {
                dateMoment: _this.dateMomentClone,
                date: _this.dateMomentClone.format("dddd, MMMM Do YYYY"),
                id: _this.dateMomentClone.unix(),
                openmics: openMicResults
            };
            openmicsByDate.push(dateSection);
        });

        dateMoment.add(1, 'days');
    };

    for (var i = 0; i < 14; i ++) {
        var boundClosure = createOpenMicPromise.bind({});
            boundClosure(openMicsPromises, openmicsByDate, data, dateMoment);
    }

    Promise.all(openMicsPromises).then(function() {
        openmicsByDate.sort(compareMoments);
        return res.json(openmicsByDate);
    });
});

function getOpenMicsForDate(city, state, date) {
  var selectOpenMicByCity = 'SELECT * FROM openmic WHERE LOWER(city) = LOWER($1) AND state = $2';
  var updateNextOpenMicDate = 'UPDATE openmic SET next_openmic_date = $1 WHERE id = $2';

    return db.query(selectOpenMicByCity, [city, abbrState(state, 'abbr')]).then(function(openmicsInTown){
      var openMicsForDate = openmicsInTown.filter(function(openmic) {
          return isOpenMicRelevantToDate(openmic, date);
      });

      var iscurrentDate = date.isSame(new Date(), "day");
      if (openMicsForDate.length && iscurrentDate) {
          openMicsForDate.forEach(function(openmic){
              db.none(updateNextOpenMicDate, [date.startOf('day'), openmic.id]);
          });
      }

      return openMicsForDate;
  });
}

function abbrState(input, to){

    var states = [
        ['Alabama', 'AL'],
        ['Alaska', 'AK'],
        ['Arizona', 'AZ'],
        ['Arkansas', 'AR'],
        ['California', 'CA'],
        ['Colorado', 'CO'],
        ['Connecticut', 'CT'],
        ['Delaware', 'DE'],
        ['Florida', 'FL'],
        ['Georgia', 'GA'],
        ['Hawaii', 'HI'],
        ['Idaho', 'ID'],
        ['Illinois', 'IL'],
        ['Indiana', 'IN'],
        ['Iowa', 'IA'],
        ['Kansas', 'KS'],
        ['Kentucky', 'KY'],
        ['Kentucky', 'KY'],
        ['Louisiana', 'LA'],
        ['Maine', 'ME'],
        ['Maryland', 'MD'],
        ['Massachusetts', 'MA'],
        ['Michigan', 'MI'],
        ['Minnesota', 'MN'],
        ['Mississippi', 'MS'],
        ['Missouri', 'MO'],
        ['Montana', 'MT'],
        ['Nebraska', 'NE'],
        ['Nevada', 'NV'],
        ['New Hampshire', 'NH'],
        ['New Jersey', 'NJ'],
        ['New Mexico', 'NM'],
        ['New York', 'NY'],
        ['North Carolina', 'NC'],
        ['North Dakota', 'ND'],
        ['Ohio', 'OH'],
        ['Oklahoma', 'OK'],
        ['Oregon', 'OR'],
        ['Pennsylvania', 'PA'],
        ['Rhode Island', 'RI'],
        ['South Carolina', 'SC'],
        ['South Dakota', 'SD'],
        ['Tennessee', 'TN'],
        ['Texas', 'TX'],
        ['Utah', 'UT'],
        ['Vermont', 'VT'],
        ['Virginia', 'VA'],
        ['Washington', 'WA'],
        ['West Virginia', 'WV'],
        ['Wisconsin', 'WI'],
        ['Wyoming', 'WY'],
    ];

    if (to === 'abbr'){
        input = input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        for(i = 0; i < states.length; i++){
            if(states[i][0] == input){
                return(states[i][1]);
            }
        }
    } else if (to === 'name'){
        input = input.toUpperCase();
        for(i = 0; i < states.length; i++){
            if(states[i][1] == input){
                return(states[i][0]);
            }
        }
    }
}

module.exports = router;
