CREATE TABLE openmic (
  id            SERIAL PRIMARY KEY,
  openMicName   varchar(120),
  comedian      boolean not null,
  poet          boolean not null,
  musician      boolean not null,
  contactEmailAddress   varchar(120),
  contactPhoneNumber   varchar(120),
  venueName   varchar(120),
  venueAddress   varchar(120) not null,
  state   varchar(60) not null,
  city   varchar(120) not null,
  signUpTime   varchar(10) not null,
  openmicStartTime   varchar(10) not null,
  isFree      boolean not null,
  notes   varchar(400)
);