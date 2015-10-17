var express = require('express');
var router = express.Router();
var pg = require('pg');
var moment = require('moment');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/openmicnight';

router.post('/api/openmic/save', function(req, res, next) {
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

  pg.connect(connectionString, function(err, client, done) {
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

//TODO they will pass in a single date with no time value. We should have a route that returns any open mics on that date. takes in a date and a city

router.get('/api/openmic/list', function(req, res, next) {
  var params = req.query;
  var data = {city: params.city};
  var selectOpenMicByCity = 'SELECT * FROM openmic WHERE city LIKE $1';
  pg.connect(connectionString, function(err, client, done) {
    var query = client.query(selectOpenMicByCity, ['%' + data.city + '%']);
    var results = [];

    query.on('row', function(row) {
      results.push(row);
    });

    query.on('end', function() {
      client.end();
      return res.json(results);
    });

    if(err) {
      console.log(err);
    }
  });
});

module.exports = router;
