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