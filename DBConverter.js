var async = require("async");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MYSQLDBSuport.js');
var tool = require('./tools.js');
var mysql = require('mysql');
global.shcode = 912261;

var codeObj={},dateObj={};



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


DC.prototype.getNoItems=function (callback) {
    cur.getConnction(function (err,conn) {
        conn.query('select * from tbl_codes where state<1 and id>0;',function (err,items) {
            callback(0,items);
        })
    });
}

DC.prototype.getDatesOfNo=function (no,callback) {
    cur.getConnction(function (err,conn) {
        if(no.state==-1){
            conn.query('select * from codeface where no_id=' +no.id+' and state=0;',callback);
            return;
        }

        conn.query('select max(id) from codeface;',function (err,ids) {
            var id=0;
            if(ids[0]['max(id)'])id=ids[0]['max(id)']+1;

            conn.query('select * from codeface_old where state>0 and _no=' +no._no+';',function (err,items) {
                var lists = tool.getSpiedList(items, 600);
                async.mapLimit(lists,1,function (list,cb) {
                    var str = 'replace INTO codeface(id,_date,no_id,_min,_max,_change,lastprice,startprice,dde,dde_b,dde_s,face,state,per) VALUES';
                    var strs=[];
                    list.forEach(function (item) {
                        strs.push('(' +
                            id + ',' +
                            '"'+ new Date( item._date).toFormat("YYYY-MM-DD")+'"' + ',' +
                            no.id + ',' +
                            item._min + ',' +
                            item._max + ',' +
                            item.ud + ',' +
                            item.lastprice + ',' +
                            item.startprice + ',' +
                            item.dde + ',' +
                            item.dde_b + ',' +
                            item.dde_s + ',' +
                            0 + ',' +
                            0 + ',' +
                            0  +
                            ')');

                        id+=1;
                    })

                    str+=strs.join(",")+";";
                    conn.query(str,function (err,d) {
                        cb(err,d);
                    })
                },function (err,rr) {
                    conn.query('update tbl_codes set state=-1 where id=' +no.id +';',function (err,rr) {
                        conn.query('select * from codeface where no_id=' +no.id+' and state=0;',callback);
                        return;
                    })
                })

            })
        })

    });
}

DC.prototype.getTimeprice=function (no,date,callback) {
    cur.getConnction(function (err,conn) {
        var start=new Date( date).toFormat("YYYY-MM-DD");
        var endTime=start +" 23:59:59";
        conn.query('select * from time_price_old where no='+no +' and time>"' +start +'" and time<"' +endTime +'"',callback)
    });
}

DC.prototype.saveValueItemOfNo=function (noItem,callBack) {
    cur.getDatesOfNo(noItem,function (err,dates) {
        cur.getConnction(function (err,conn) {
            async.mapLimit(dates,1,function (dateItem,cb) {
                cur.getTimeprice(noItem._no,dateItem._date,function (err,valueItems) {
                    var lists = tool.getSpiedList(valueItems, 600);
                    var start=dateItem.lastprice-dateItem._change;
                    async.mapLimit(lists,1,function (list,cbb) {
                        var str = 'replace INTO time_price(face_id,time,price,trade_type,volume) VALUES';
                        var strs=[];
                        list.forEach(function (item) {
                            strs.push('(' +
                                dateItem.id + ',' +
                                tool.getVMTime(item.time)  + ',' +
                                (item.price-start) + ',' +
                                item.trade_type + ',' +
                                item.volume  +
                                ')')
                        })
                        str+=strs.join(',')+";";
                        conn.query(str,function (err,rr) {
                            cbb(err,rr);
                        })
                    },function (err) {
                        conn.query('update codeface set state=1 where id=' +dateItem.id +';',function (err,rr) {
                            cb(err,rr);
                            console.log(noItem._no+ ":"+new Date( dateItem._date).toFormat("YYYY-MM-DD") +"  saved");
                        })
                    })

                })
            },function (err,result) {
                conn.query('update tbl_codes set state=1 where id=' +noItem.id +';',function (err,rr) {
                    console.log(noItem.id+ ":"+noItem._no +"  saved");
                    callBack(err,result);
                })
            })
        })

    })
}

DC.prototype.saveDateItem=function (no,callback) {
    cur.getDatesOfNo(no,function (err,dateItems) {

    })
}

DC.prototype.start=function () {

    cur.getNoItems(function (err,noItems) {
        async.mapLimit(noItems,1,cur.saveValueItemOfNo,function () {
            console.log("全部完成！")
        })
    })
}


//select distinct(_no) from codeface_old;
DC.prototype.initCodes=function () {
    cur.getConnction(function (err,conn) {
        var str = 'select distinct(_no) from codeface_old';
        conn.query(str, function (err, result) {


            var id=1;
            var lists = tool.getSpiedList(result, 600);
            async.mapLimit(lists,1,function (list,cb) {
                str = 'replace INTO tbl_codes(id,_no,state) VALUES';
                var strs=[];
                list.forEach(function (item,i) {
                    if(item._no==1912261)
                        item.id=0;
                    else{
                        item.id=id;
                        id+=1;
                    }
                    strs.push('(' +
                        item.id + ',' +
                        item._no + ',' +
                        0  +
                        ')')
                })

                str +=strs.join(",")+";";
                conn.query(str,function (err,result) {
                    cb(err,result);
                })


            },function (err,results) {

            })


        })
    })
}

var cur=module.exports=new DC();
cur.start()