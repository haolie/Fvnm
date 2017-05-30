/**
 * Created by youhao on 2017/5/30.
 */
var http = require('http');
var async=require("async");
var token="";
var fs= require('fs');
var path = require('path');
var dbsuport = require('./MYSQLDBSuport.js');
var request=require('request');
var querylimit=1;

var Supporter=function(){

}

Supporter.prototype.checker=function(callback,options){
    if(!options)options={};
    if(!options.start)options.start="2017-01-23";
    if(!options.end)options.end=new Date().toLocaleDateString();

    dbsuport.getfaces({no:"",start:options.start,end:options.end},function(){

    })
}

Supporter.prototype.uploader=function(callback){

}

Supporter.prototype.savetoLocal=function(callback){

}

Supporter.prototype.start=function(callback){


}


module.exports=new Supporter();

module.exports.start();