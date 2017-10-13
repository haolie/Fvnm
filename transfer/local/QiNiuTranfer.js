/**
 * Created by LiuYouhao on 2017/6/16.
 */

var async=require("async");
var url=require("url");
var dbsupport = require('./MYSQLDBSuport.js');
var tool = require('./tools.js');
var fs= require('fs');
var path = require('path');
var qiniu=require("qiniu");
var tool = require('./tools.js');
var util = require('util');

var bucket = 'sparkmoon';
var accessKey = 'eEWFcMjjQIXni6YpaWbsPvhSosFfpBYveh6i2Idw';
var secretKey = 'HNtAQjoyT2gzUWinfAS6-eHfPiUTG2Gv26D7zlbM';
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
var config = new qiniu.conf.Config();
var bucketManager = new qiniu.rs.BucketManager(mac, config);
var uploadToken =null;
var privateBucketDomain = 'http://if-pri.qiniudn.com';
var publicBucketDomain = 'http://opj8k79mj.bkt.clouddn.com';
var deadline = parseInt(Date.now() / 1000) + 3600;
var putExtra = new qiniu.form_up.PutExtra();
require('date-utils');
var perPart="VM/";


var tranfer=function(){}

tranfer.prototype.getUploadToken=function(){
    if(uploadToken!=null)return uploadToken;

    var options = {
        scope: bucket,
        expires: 7200
    };
    var putPolicy = new qiniu.rs.PutPolicy(options);
    uploadToken=putPolicy.uploadToken(mac);
    return uploadToken;

    setInterval(function(){
        putPolicy.uploadToken(mac);
    },options.expires-60);
}

tranfer.prototype.getPrivieUrl=function(remoteFile){
   return bucketManager.privateDownloadUrl(privateBucketDomain,remoteFile,deadline);
}

tranfer.prototype.getPublicUrl=function(remoteFile){
    return bucketManager.publicDownloadUrl(publicBucketDomain, remoteFile);
}

tranfer.prototype.uploadFile=function(remotefile,localFile,callback){
    var formUploader = new qiniu.form_up.FormUploader(config);
    formUploader.putFile( current. getUploadToken(), remotefile, localFile, putExtra, function(respErr,respBody, respInfo) {
        if (respErr) return callback(1,null);
        if (respInfo.statusCode == 200) {
            callback(0,1);
        } else {
            callback(1,null);
        }
    });

}

tranfer.prototype.uploaDateFile=function(item,localFile,callback){
    current.uploadFile(perPart+item.date+"_"+item.state,localFile,callback);
}

tranfer.prototype.downFile=function(remotefile,local,callback){
    var url=current.getPublicUrl(remotefile)+"?r="+Math.random();
    tool.HttpDownFile(url,local,callback);
}

tranfer.prototype.downDateItemFile=function(item,local,callback){
    var url=perPart+ item.date+"_"+item.state;
    current.downFile(url,local,callback);
}

tranfer.prototype.deleteFile=function(remotefile,callback){
    bucketManager.delete(bucket, remotefile, function(err, respBody, respInfo) {
        callback(err,0);
    })
}

tranfer.prototype.getWebDateItems=function(filter,callback) {
    current.getDateFilePaths(function (err, webitems) {
        if (err) return callback(err, []);
        var list = [];
        webitems.forEach(function (item, i) {
            var str = item.key.replace(perPart, "");
            var strs = str.split("_");
            var temp = {date: strs[0]};
            if (strs.length > 1) temp.state = parseInt(strs[1]);
            if (temp.state <= 0) temp.state = 1;
            list.push(temp);
        });

        callback(0, list);
    })
}

tranfer.prototype.getDateFilePaths=function(callback){
    var list=[];
    var fun=function(marker){
        var options = {
            limit: 20,
            prefix: perPart
        };
        if(marker)options.marker=marker;
        bucketManager.listPrefix(bucket, options, function(err, respBody, respInfo){
            if (err) return callback(1,[]);
            if (respInfo.statusCode == 200) {
                var items = respBody.items;
                items.forEach(function(item) {
                    list.push(item);
                });

                if( respBody.marker)
                   fun( respBody.marker);
                else callback(0,list);

            } else {
                return callback(1,[]);
            }
            })
    }

    fun(null);
}








var current=new tranfer();
module.exports=current;
//current.uploadFile("2017-07-3.vm","d:\\Jellyfish.jpg",function(err,result){
//
//
//})

//current.downFile("2017-07-3.vm","d:\\2017-07-3.jpg",function(err,result){
//
//})

//current.deleteFile("2017-07-3.vm",function(err,result){
//
//})

//var temp=new Date("2017-05-01");
//var debuglog = util.debuglog('foo');
//async.whilst(function(){return temp<new Date()},function(cb){
//    var str=perPart+temp.toFormat("YYYY-MM-DD.jpg");
//    current.uploadFile(str ,"d:\\Jellyfish.jpg",function(err,result){
//        temp.add('d',1);
//        debuglog(str);
//        cb(0,1);
//    })
//},function(err,result){
//
//});

//current.getDateFilePaths(function(err,list){
//    async.mapLimit(list,1,function(item,mapcb){
//        current.deleteFile(item.key,mapcb);
//    },function(err,result){
//      tool.console("全部删除成功")
//    })
//
//})

