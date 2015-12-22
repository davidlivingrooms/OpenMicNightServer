var express = require('express');
var router = express.Router();
var pgp = require('pg-promise');
var moment = require('moment');
var connectionString = {
    host: 'localhost', // server name or IP address;
    port: 5432,
    database: 'openmicnight',
    user: 'openmicer',
    //password: 'user_password'
};
var db = pgp(connectionString);
var db = db(connectionString);
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

function isOpenMicBetweenTime(openmic, start, end) {
  //var dateMoment = moment(date);
  //var sunday = dateMoment.day(0);
  //var saturday = dateMoment.day(6);
  var nextOpenmicDay = moment(openmic.next_openmic_day);
  var regularity = openmic.openmic_regularity;
  var runningDate = nextOpenmicDay;
  while(runningDate.isBefore(end)) {
    if (runningDate.isBetween(start, end)){
      return true;
    }

    switch (regularity) {
      case "weekly":
        runningDate = runningDate.add(7, 'days');
        break;
      case "bi-weekly":
        runningDate = runningDate.add(14, 'days');
        break;
      case "monthly":
        runningDate = runningDate.add(1, 'months');
        break;
      default:
        console.log("Unrecognized openmic regularity found.");
    }
  }

  return false;
}

function isOpenMicRelevantToDate(openmic, date) {
  var dateMoment = moment(date);
  var runningDate = moment(openmic.next_openmic_day);
  var regularity = openmic.openmic_regularity;
  while(runningDate.isBefore(dateMoment)) {
    if (runningDate.isSame(dateMoment)){
      return true;
    }

    switch (regularity) {
      case "weekly":
        runningDate.add(7, 'days');
        break;
      case "bi-weekly":
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

function createOpenMicObjectFromRow(openMicRow) {

}

function createDateSectionObject(city, date) {
  return {
    date: date,
    id: date,//TODO change to epoch
    openmics: getOpenMicsForDate(city, date)//TODO this is async
  };
}


router.get('/api/openmic/listForCity', function(req, res) {
  var params = req.query;
  var data = {city: params.city, date: moment()};
  var dateMoment = moment(data.date);
  var openmicsByDate = [];
  var openMicsPromises = [];
//TODO don't skip today
  for (var i = 0; i < 14; i ++) {
    var dbPromise = getOpenMicsForDate(data.city, dateMoment);//TODO handle async
    openMicsPromises.push(dbPromise);
    dbPromise.then(function(data){
        var dateSection = {
            date: dateMoment.format("dddd, MMMM Do YYYY"),
            id: dateMoment.unix(),
            openmics: data
        };
        //dateSection.openmics = data;
        openmicsByDate.push(dateSection);
        dateMoment.add(1, 'days');
    });
  }
    Promise.all(openMicsPromises).then(function(){
        return res.json(openmicsByDate);
    });
});

function getOpenMicsForDate(city, date) {
  var selectOpenMicByCity = 'SELECT * FROM openmic WHERE city = $1';
  //pg.connect(connectionString, function(err, client) {
  //  var query = client.query(selectOpenMicByCity, [city]);
  //  var results = [];
  //  var openmicsInTown = [];
  //  query.on('row', function(row) {
  //    openmicsInTown.push(row);
  //  });
  //
  //  query.on('end', function() {
  //    client.end();
  //    results = openmicsInTown.filter(function(openmic) {
  //      return isOpenMicRelevantToDate(openmic, date);
  //    });
  //
  //    return results;
  //  });
  //
  //  if(err) {
  //    console.log(err);
  //  }
  //});


  //db.query("select * from users where active=$1", true)
      //var db = pgp(connectionString);

    return db.query("select * from openmic");
}

module.exports = router;
