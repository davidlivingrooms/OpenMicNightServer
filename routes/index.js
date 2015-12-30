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
