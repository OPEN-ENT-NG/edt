CREATE TABLE edt.course_tag (
    id bigserial,
    structure_id character varying (36) NOT NULL,
    label text NOT NULL,
    abbreviation text NOT NULL,
    is_primary boolean NOT NULL DEFAULT false,
    is_hidden boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT course_tag_pkey PRIMARY KEY (id)
);