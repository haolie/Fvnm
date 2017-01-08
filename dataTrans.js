/**
 * Created by youhao on 2016/11/3.
 */
var http = require('http');
var async=require("async");
//var qs = require('querystring');
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MGDBSuport.js');
var sqlsuport = require('./MYSQLDBSuport.js');
var nohelper = require('./nohelper.js');
//var StringDecoder = require('string_decoder').StringDecoder;
var  process = require('process');
const cluster = require('cluster');

var transfer=function(){}

transfer.prototype.start=function(){

    dbsuport.getfaces({date:'2016-12-30'},function(err,codes){
        async.mapLimit(codes,1,function(code,mpcallback){
            dbsuport.getValueByDayNo({date:new Date(code.date),no:code.no},function(err,items){
                sqlsuport.saveTimePrice(items,function(err,el){
                    mpcallback(err,1);
                })
            })
        },function(err,rs){

        })
    })

}

transfer.prototype.transCode=function(codes,callback){
    var conn=dbsuport.getConnction(function(err,db){
        var allcl=  db.collection("time_price");
        async.map(codes,function(code,cb){
            allcl.find({ "no":code}).toArray(function(err,datas){
                if(datas==null||datas.length==0){
                    cb(null,0);
                    return;
                }

                if(err==null){
                    var datalist=dbsuport.getSpiedList(datas,999);
                    async.map(datalist,function(dataItem,saveback){
                        db.collection("vp_"+code).insertMany(dataItem,saveback);
                    },function(err,result){
                        allcl.remove({ "no":code},cb);
                    })
                }
            })
        },function(err,result){
            db.close();
        })
    });

}

transfer.prototype.deleteall=function(){
    sqlsuport.getfaces({date:'2017-01-04'},function(err,result){

    })
}

module.exports=new transfer();
module.exports.deleteall();

