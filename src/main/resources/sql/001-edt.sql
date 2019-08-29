CREATE SCHEMA edt;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE edt.scripts
(
  filename character varying(255) NOT NULL,
  passed timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT scripts_pkey PRIMARY KEY (filename)
);