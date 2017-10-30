var fs = require('fs');
var path = require('path');
var http = require('http');
var async=require("async");

var baseUrl="";
var savePath="";

var Gun=function () {

}

Gun.prototype.Down=function (callback) {
    fs.open(savePath,"w+",function (fd) {
        var index=0,len=0;
        var fun=function () {

            
        }
    })

}
