/**
 * Created by youhao on 2017/5/30.
 */

var async=require("async");
var nohelper = require('./nohelper.js');
var tool = require('./tools.js');
var fs= require('fs');
var readline = require('readline');
var iconv = require('iconv-lite');

CSV=function(){

}

CSV.prototype.FileToJson=function(file,callback){
    try {
        fs.readFile(file, function (err,bytesRead) {
            var string = iconv.decode(bytesRead, 'gbk');
            var strs= string.split('\n')
            var items=[];
            for (var i=0;i<strs.length;i++){
                var temp=strs[i].split('\t');
                items.push(temp);
            }
            if(callback)callback(err,items);
        });
    }
    catch(ex){
        callback(1,null);
    }
}

module.exports=new CSV();