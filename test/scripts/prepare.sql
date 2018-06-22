CREATE TABLE IF NOT EXISTS users
(
  id          SERIAL                                       NOT NULL
    CONSTRAINT USERS_ID_PK
    PRIMARY KEY,
  firstname   VARCHAR(128) DEFAULT '' :: CHARACTER VARYING NOT NULL,
  lastname    VARCHAR(128) DEFAULT NULL :: CHARACTER VARYING,
  favorites   JSON,
  "order"     INTEGER,
  preferences INTEGER []
);

