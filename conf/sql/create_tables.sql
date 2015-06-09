CREATE TABLE openmic (
  id            SERIAL PRIMARY KEY,
  openmic_name   varchar(120),
  comedian      boolean not null,
  poet          boolean not null,
  musician      boolean not null,
  contact_email_address   varchar(120),
  contact_phone_number   varchar(120),
  venue_name   varchar(120),
  venue_address   varchar(120) not null,
  state   varchar(60) not null,
  city   varchar(120) not null,
  sign_up_time   varchar(10) not null,
  start_time   varchar(10) not null,
  is_free      boolean not null,
  notes   varchar(400)
);