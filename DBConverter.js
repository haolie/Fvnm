var async = require("async");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MYSQLDBSuport.js');
var tool = require('./tools.js');
var mysql = require('mysql');
global.shcode = 912261;

var codeObj={};



var DC=function () {
    
}

DC.prototype.connctions = [null, null, null,null];
DC.prototype.cindex = 0;
DC.prototype.getConnction = function (callback) {
    var curindex = module.exports.cindex;
    module.exports.cindex += 1;
    if (module.exports.cindex >= module.exports.connctions.length)module.exports.cindex = 0;

    if (module.exports.connctions[curindex] == null) {
        module.exports.connctions[curindex] = mysql.createConnection({
            host: 'localhost',
            user: 'mysql',
            password: '123456',
            database: 'finance',
            multipleStatements:true,
            useConnectionPooling: true
        });
        module.exports.connctions[curindex].connect(function (a, b) {
            callback(null, module.exports.connctions[curindex]);
        });
    }
    else
        callback(null, module.exports.connctions[curindex]);
}

DC.prototype.start=function () {
    
}
//select distinct(_no) from codeface_old;
DC.prototype.initCodes=function () {
    cur.getConnction(function (err,conn) {
        var str = 'select distinct(_no) from codeface_old';
        conn.query(str, function (err, result) {


            var id=1;
            var lists = tool.getSpiedList(result, 600);
            async.mapLimit(lists,1,function (list,cb) {
                str = 'replace INTO tbl_codes(no,time,price,trade_type,turnover_inc,volume) VALUES';

                list.forEach(function (item,i) {
                    
                })

                '(' +
                Number(item.no) + ',' +
                '"' + tool.convertToTIMESTAMP(item.time) + '"' + ',' +
                (item.price * 100) + ',' +
                item.trade_type + ',' +
                (item.turnover_inc / 100) + ',' +
                (item.volume / 100) +
                ')'
            },function (err,results) {

            })

            callback(err, result);
        })
    })
}

var cur=module.exports=new DC();