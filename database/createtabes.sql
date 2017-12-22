CREATE TABLE time_price(
no MEDIUMINT NOT NULL,
time TIMESTAMP NOT NULL,
price MEDIUMINT,
trade_type TINYINT,
turnover_inc MEDIUMINT UNSIGNED,
volume MEDIUMINT UNSIGNED,
primary key (no,time)
);
CREATE TABLE codeface(
_no MEDIUMINT NOT NULL,
_date DATE NOT NULL,
_min MEDIUMINT,
_max MEDIUMINT,
ud MEDIUMINT,
lastprice MEDIUMINT,
face TINYINT,
dde INT,
dde_b INT UNSIGNED,
dde_s INT UNSIGNED,
mainforce INT UNSIGNED,
_state tinyint,
per smallint
primary key (_no,_date)
);

2.0

CREATE TABLE tbl_codes(
id SMALLINT UNSIGNED NOT NULL,
_no MEDIUMINT UNSIGNED NOT NULL,
state tinyint DEFAULT 0,
primary key (id)
);

CREATE TABLE time_price(
face_id MEDIUMINT UNSIGNED NOT NULL,
time SMALLINT UNSIGNED NOT NULL,
price SMALLINT,
trade_type TINYINT,
volume MEDIUMINT UNSIGNED,
primary key (face_id,time)
);

CREATE TABLE codeface(
id MEDIUMINT UNSIGNED NOT NULL,
_date DATE NOT NULL,
 no_id SMALLINT UNSIGNED NOT NULL,
_min MEDIUMINT UNSIGNED,
_max MEDIUMINT UNSIGNED,
_change MEDIUMINT,
lastprice MEDIUMINT UNSIGNED,
startprice MEDIUMINT UNSIGNED,
dde BIGINT,
dde_b BIGINT UNSIGNED,
dde_s BIGINT UNSIGNED,
face TINYINT UNSIGNED,
state TINYINT,
per smallint,
primary key (id)
);