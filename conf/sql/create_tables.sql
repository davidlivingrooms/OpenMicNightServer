
CREATE TYPE weekday AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
CREATE TYPE regularity AS ENUM ('weekly', 'bi-Weekly', 'monthly');


CREATE TABLE openmic (
  id            SERIAL PRIMARY KEY,
  openmic_name      varchar(120),
  openmic_weekday   weekday not null,
  openmic_regularity   regularity not null,
  comedian      boolean not null,
  poet          boolean not null,
  musician      boolean not null,
  contact_email_address   varchar(120),
  contact_phone_number   varchar(20),
  venue_name   varchar(120),
  venue_address   varchar(120) not null,
  state   varchar(60) not null,
  city   varchar(120) not null,
  sign_up_time   varchar(10) not null,
  start_time   varchar(10) not null,
  is_free      boolean not null,
  next_openmic_date date not null,
  notes   varchar(400)
);