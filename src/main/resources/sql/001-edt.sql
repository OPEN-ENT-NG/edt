CREATE SCHEMA edt;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE edt.scripts
(
  filename character varying(255) NOT NULL,
  passed timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT scripts_pkey PRIMARY KEY (filename)
);

CREATE TABLE edt.period_exclusion (
  id bigserial NOT NULL,
  start_date timestamp without time zone,
  end_date timestamp without time zone,
  description character varying,
  id_structure character varying(36),
  CONSTRAINT period_exclusion_pkey PRIMARY KEY (id)
);