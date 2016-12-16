/**
 * Created by youhao on 2016/11/3.
 */
var http = require('http');
var async=require("async");
//var qs = require('querystring');
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MGDBSuport.js');
var nohelper = require('./nohelper.js');
//var StringDecoder = require('string_decoder').StringDecoder;
var  process = require('process');
const cluster = require('cluster');

var transfer=function(){}

transfer.prototype.start=function(){

    if(cluster.isMaster){




        return;
    }

    var parm=process.argv[process.argv.length-1].toString();

    if(parm=="-s"){
        nohelper.getallno(function(err,allno){
            dbsuport.saveCodes(allno,function(err,count){
                console.log(count);

                dbsuport.getAllCodes(function(err,codes){
                    module.exports.transCode(codes);
                });
            });
        })
    }
    else
    {
        dbsuport.getAllCodes(function(err,codes){
            module.exports.transCode(codes);
        });
    }
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

module.exports=new transfer();
module.exports.start();