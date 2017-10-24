var fs = require('fs');
var path = require('path');
var cryptoObj = require('crypto');
var http = require('http');
var async=require("async");
var process = require('process');
var transfer=require("fileTransfer");
var local=require('localParker')
var util = require('util');
var cloudVFiles=[];
var cloudMFiles=[];
var localFileInfos=[];


var pvter=function () {}

pvter.prototype.init=function (callback) {
    transfer.getCloudFiles(function (err,files) {
        cloudVFiles=cloudVFiles.concat(files[0])
        cloudMFiles=cloudMFiles.concat(files[1])

        localFileInfos =local.getOutParkerFiles();
    })
}

