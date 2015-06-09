var express = require('express');
var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/openmicnight';

router.get('/api/openmic/add', function(req, res, next) {
  var params = req.query;
  var data = {openmic_name: params.openMicName, comedian: params.comedian, poet: params.poet, musician: params.musician,
    contact_email_address: params.contactEmailAddress, contact_phone_number: params.contactPhoneNumber,
    venue_name: params.venueName, venue_address: params.venueAddress, state: params.state, city: params.city,
    sign_up_time: params.signUpTime, start_time: params.startTime, is_free: params.isFree, notes: params.notes};

  var insertOpenMicStatement = 'INSERT INTO openmic(openmic_name, comedian, poet, musician, contact_email_address, '
    + 'contact_phone_number, venue_name, venue_address, state, city, sign_up_time, start_time, is_free, notes) '
    + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)';

  pg.connect(connectionString, function(err, client, done) {

    client.query(insertOpenMicStatement, [data.text, data.complete]);

    if(err) {
      console.log(err);
    }

  });
  //client.query("INSERT INTO items(text, complete) values($1, $2)", [data.text, data.complete]);


  res.json({ title: 'some open mic' });
});

module.exports = router;
