var fs = require('fs');
var path = require('path');
var cryptoObj = require('crypto');
var http = require('http');
var async=require("async");
var process = require('process');
var transfer=require("./fileTransfer.js");
var local=require('./localParker')
var txclouder=require("../transfer/local/TXCloudSupporter.js");
var util = require('util');
var cloudVFiles=[];
var cloudMFiles=[];
var localFileInfos=[];
var keyObj={};


var pvter=function () {}

pvter.prototype.init=function (callback) {
    transfer.getCloudFiles(function (err,files) {
        cloudVFiles=cloudVFiles.concat(files[0])
        cloudMFiles=cloudMFiles.concat(files[1])

        for(var i=0;i<cloudVFiles.length;i++){
            keyObj[cloudVFiles[i].key]=cloudVFiles[i];
        }

        localFileInfos =local.getOutParkerFiles();
        async.mapLimit(local.OutParkVideo,1,function (f,mb) {

            txclouder.getFileHash1(f.path,function (err,hash1) {
                f.key=hash1.hash1;
                if(keyObj[f.key]){
                    console.log("cloud exsit:"+f.path)
                    mb(err,1);
                }
                else {
                    mb(0,1);
                    // transfer.uploadFile(f,txclouder,function (index,s) {
                    //     if(index){
                    //         mb(0,1);
                    //         console.log("___cloud Upload:"+f.path)
                    //     }
                    // })
                }

            })


        },function (err,result) {

        })
    })
}

function getFileInfos(p,array) {

}

module.exports=new pvter();
module.exports.init();

