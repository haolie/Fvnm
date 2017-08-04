/**
 * Created by LYH on 2017/2/6.
 */
var async = require("async");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MYSQLDBSuport.js');
var tool = require('./tools.js');
var lcsv = require('./localCSV.js');
//var xls_tool = require('./xlstool.js');
//var xls_tool = require('xls-to-json');
var process = require('process');
var fs = require('fs');
var util = require('util');

var worker = function () {
}
worker.prototype.isworking = false;
worker.prototype.console = function (item) {
    if (process.send)
        module.exports.sendMsg(item, "console");
    else
        console.log(item);
}

worker.prototype.sendMsg = function (msg, type) {
    process.send(JSON.stringify({
        id: process.pid,
        type: type,
        msg: msg
    }));
}

worker.prototype.saveToDb = function (item, allcallback) {
    module.exports.getValuesFromfile(item, function (err, items) {
        if (err) {
            module.exports.console(item.no + ": 获取文件数据失败");
            allcallback(1, 0);
            return;
        }

        dbsuport.saveTimePrice(items, function (err, result) {
            if (err) {
                module.exports.console( item.no+" 数据保存失败保存失败");
                allcallback(1, 1);
            }
            else {
                module.exports.console( item.no+" 保存成功");
                if (items.length) {
                    var face = {
                        _id: item.no + "_" + item.date,
                        no: item.no,
                        date: item.date,
                        lastprice: item.lastprice,
                        startprice: items[0].price,
                        _min: Math.floor(item.min * 100)/100,
                        _max: Math.floor(item.max * 100)/100,
                        state: 1
                    };

                    module.exports.console( face.startprice+"pricepricepricepricepricepricepriceprice");

                    dbsuport.updatacodeface(face, function (err, s) {
                        allcallback(0, true);
                    });
                }
                else {
                    allcallback(0, true);
                }
            }


        });
    })
}

worker.prototype.getValuesFromfile = function (item, allcallback) {
    if (!(item.no && item.date)) {
        allcallback(null, null);
        return;
    }
    var file = item.file;

    fs.exists(file, function (exist) {
        if (exist) {
            lcsv.FileToJson(file, function (err, result) {

                if(err){
                    fs.unlink(file);
                    module.exports.console(ex.toString())
                    module.exports.console("删除文件：" + file);
                    allcallback(2, null)
                }
                result.shift();
                var items = [];
                item.max = 0;
                item.min = 999999;
                result.forEach(function (row, index) {
                    var time = new Date(item.date + " " + row[0]).getTime() / 1000;
                    var t_type = 0;
                    if (row[5] == "买盘") t_type = 1;
                    if (row[5] == "卖盘") t_type = -1;
                    item.max = Math.max(item.max, row[1]);
                    item.min = Math.min(item.min, row[1]);
                    items.push({
                        _id: item.no + "_" + time,
                        no: item.no,
                        time: time,
                        price: row[1],
                        trade_type: t_type,
                        turnover_inc: row[4],
                        volume: row[3]
                    })
                })

                if (items.length > 0)
                    item.lastprice = items[items.length - 1].price;
                else item.lastprice = 0;
                fs.unlink(file);
                allcallback(0, items)
            })
        }
        else {
            allcallback(1, null);
        }
    })
}

worker.prototype.start = function () {

    //2017-05-25_600879
    //var temp=JSON.parse('{"no":"600879","date":"2017-05-25","min":0,"max":0,"ud":0,"lastprice":0,"face":0,"dde_b":0,"dde_s":0,"mainforce":0,"state":0,"per":0,"index":2,"savestate":1,"file":"./datafiles/2017-05-25_600879.xls","trytimes":0}');
    //module.exports.saveToDb(temp, function (err, result) {
    //    module.exports.sendMsg({
    //        index: item.index,
    //        result: err
    //    }, "result");
    //});
    //
    //return;

    process.on("message", function (msg) {
        //module.exports.console(msg);
        msg = JSON.parse(msg);
        var state = "free";
        if (msg.type == "work") {
            var item = msg.item;
            if (item != null) {
                state = "working";
                module.exports.saveToDb(item, function (err, result) {
                    module.exports.sendMsg({
                        index: item.index,
                        result: err
                    }, "result");
                });
            }
            module.exports.sendMsg(state, "state");
        }

    })

    module.exports.sendMsg("free", "state");
}

module.exports = new worker();
module.exports.start();