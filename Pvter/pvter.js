var fs = require('fs');
var path = require('path');
var cryptoObj = require('crypto');
var http = require('http');
var async=require("async");
var process = require('process');
var transfer=require("./fileTransfer.js");
var local=require('./localParker')
var txclouder=require("../transfer/local/TXCloudSupporter.js");
var url=require("url");
var util = require('util');
var cloudVFiles=[];
var cloudMFiles=[];
var localFileInfos=[];
var maxSize=1024*1024*512;
var pan=1024*1024*1024*5;
var totalUploading=0;
var keyObj={};

var stop=0;


var pvter=function () {}

pvter.prototype.init=function (callback) {
    transfer.getCloudFiles(function (err,files) {
        cloudVFiles=cloudVFiles.concat(files[0])
        cloudMFiles=cloudMFiles.concat(files[1])

//        transfer.downFile(cloudVFiles[0],local.LocalParkerPath,function(p,r){
//
//        })
//return;

        for(var i=0;i<cloudVFiles.length;i++){
            keyObj[cloudVFiles[i].key]=cloudVFiles[i];
        }

        localFileInfos =local.getOutParkerFiles();
        async.mapLimit(local.OutParkVideo,1,function (f,mb) {

            if(stop||totalUploading>pan){
                mb(0,0);
                return;
            }
            txclouder.getFileHash1(f.path,function (err,hash1) {
                f.key=hash1.hash1;
                if(keyObj[f.key]){
                    console.log("cloud exsit:"+f.path)
                    mb(err,1);
                }
                else if(f.size>maxSize){
                    console.log("BIG SIZE:"+f.path)
                    mb(err,1);
                }
                else {
                    //mb(0,1);
                    var upsize=0;
                     transfer.uploadFile(f,txclouder,function (index,s,size) {
                         if(index){
                             console.log("___cloud Upload:"+f.path)
                             mb(0,1);
                         }
                         else {
                             upsize+=size;
                             totalUploading+=size;
                             var per=upsize/ f.size;
                             if(per>1)per=1; per*=100;
                             console.log("fileUploading:"+f.path+"  "+per+"%")
                             var log=totalUploading;

                               log=(totalUploading/(1024*1024))+"MB"


                             console.log("total:"+log)
                         }
                     })
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

http.createServer(function (req, res) {

    res.writeHead(200, {'Content-Type': 'text/plain'});
    var request=url.parse(req.url,true)
    args= url.parse(req.url,true).query;
    if(args.stop){
        stop=1;
    }


    res.end("is stopping!");


}).listen(12122);

