GRANT USAGE ON SCHEMA edt TO "apps";
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA edt TO "apps";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA edt TO "apps";
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA edt TO "apps";