var express = require('express');
var router = express.Router();
var moment = require('moment');
var promise = require('bluebird');
var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var connectionString = {
    host: 'localhost',
    port: 5432,
    database: 'openmicnight',
    user: 'openmicer',
};

var db = pgp(connectionString);

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

    db.none(insertOpenMicStatement, [data.name, data.regularity, data.comedian, data.poet, data.musician,
                                    data.contact_email_address, data.contact_phone_number, data.venue_name,
                                    data.venue_address, data.state, data.city, data.sign_up_time, data.start_time,
                                    data.is_free, data.next_openmic_day, data.notes, data.monday, data.tuesday,
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
  var dateMoment = moment(date);
  var runningDate = moment(openmic.next_openmic_date);
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
    var moment1 = moment(result1.dateMoment);
    var moment2 = moment(result2.dateMoment);
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
    var data = {city: params.city, date: moment()};
    var originalDateMoment = moment(data.date);
    var dateMoment = originalDateMoment.clone();
    var openmicsByDate = [];
    var openMicsPromises = [];

    var createOpenMicPromise = function(openmicPromises, openmicsByDate, data, dateMoment){
        var _this = this;
        _this.dateMomentClone = dateMoment.clone();
        var dbPromise = getOpenMicsForDate(data.city, _this.dateMomentClone);
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

function getOpenMicsForDate(city, date) {
  var selectOpenMicByCity = 'SELECT * FROM openmic WHERE LOWER(city) = LOWER($1)';
  return db.query(selectOpenMicByCity, city).then(function(openmicsInTown){
      var openMicsForDate = openmicsInTown.filter(function(openmic) {
          return isOpenMicRelevantToDate(openmic, date);
      });

      return openMicsForDate;
  });
}

module.exports = router;
