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
  var db = pgp(connectionString);

  var params = req.body;
  var data = {openmic_name: params.openMicName, openmic_weekday : params.openMicWeekDay,
    openmic_regularity : params.openMicRegularity, comedian: params.comedians, poet: params.poets, musician: params.musicians,
    contact_email_address: params.contactEmailAddress, contact_phone_number: params.contactPhoneNumber,
    venue_name: params.venueName, venue_address: params.venueAddress, state: params.state, city: params.city,
    sign_up_time: params.signUpTime, start_time: params.startTime, is_free: params.isOpenMicFree,
    next_openmic_day: params.nextOpenMicDate, notes: params.notes};

  var insertOpenMicStatement = 'INSERT INTO openmic(openmic_name, openmic_weekday, openmic_regularity, comedian, poet, ' +
    'musician, contact_email_address, contact_phone_number, venue_name, venue_address, state, city, sign_up_time, ' +
    'start_time, is_free, next_openmic_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ' +
    '$14, $15, $16, $17)';

  db.connect(connectionString, function(err, client) {
    client.query(insertOpenMicStatement, [data.openmic_name, data.openmic_weekday, data.openmic_regularity,
                                          data.comedian, data.poet, data.musician, data.contact_email_address,
                                          data.contact_phone_number, data.venue_name, data.venue_address, data.state,
                                          data.city, data.sign_up_time, data.start_time, data.is_free,
                                          data.next_openmic_day, data.notes]);
    if(err) {
      console.log(err);
    }
  });

  res.json({ title: 'some open mic' });
});

function isOpenMicRelevantToDate(openmic, date) {
  var dateMoment = moment(date);
  var runningDate = moment(openmic.next_openmic_date);
  var regularity = openmic.openmic_regularity;
  while(runningDate.isBefore(dateMoment)) {
    if (runningDate.isSame(dateMoment, 'day')){
      return true;
    }

    switch (regularity) {
      case "weekly":
        runningDate.add(7, 'days');
        break;
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

router.get('/api/openmic/listForCity', function(req, res) {
  var params = req.query;
  var data = {city: params.city, date: moment()};
  var dateMoment = moment(data.date);
  var openmicsByDate = [];
  var openMicsPromises = [];
  for (var i = 0; i < 14; i ++) {
    var dbPromise = getOpenMicsForDate(data.city, dateMoment);
    openMicsPromises.push(dbPromise);
    dbPromise.then(function(openMicResults){
        var dateSection = {
            date: dateMoment.format("dddd, MMMM Do YYYY"),
            id: dateMoment.unix(),
            openmics: openMicResults
        };
        openmicsByDate.push(dateSection);
        dateMoment.add(1, 'days');
    });
  }
    Promise.all(openMicsPromises).then(function(){
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
