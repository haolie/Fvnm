/**
 * Created by LYH on 2017/1/16.
 */
var util=require('util');
var baseWorker=require('./BaseVMWorker');
var http = require('http');

var xls_tool = require('xls-to-json');
var  process = require('process');
var fs= require('fs');

var advan=function(){
    //baseWorker.call(this);
};

advan.prototype.getLocalFace=function(callback){

}

advan.prototype.getRootFace=function(callback){

}

advan.prototype.getdateFace=function(callback){



}

advan.prototype.onlinecheck=function(vm,callback){
    var options ={
        hostname: vm,
        port: 12126,
        method: 'GET',
        path:codeurl,
        timeout:10000,
        headers: {
            'Connection':'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent':' Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, sdch',
            'Accept-Language':'zh-CN,zh;q=0.8'
        }
    };

    var rquest= http.get(options,function(res){
        var length=0;
        var chunks=[];
        res.on("aborted",function(){})
        res.on('data', function (chunk) {
            length+=chunk.length;
            chunks.push(chunk);
        });
        res.on('end', function (str) {
            if(item==null||item.data==null)return;
            var buf=Buffer.concat(chunks, length);
            zlib.gunzip(buf, function (err, decoded) {

            });
        })
    });
}

advan.prototype.ondatecheckQuery=function(res,callback){
    module.exports.getdateFace(function(err,result){
        res.end(JSON.stringify(result))
    });
}

advan.prototype.start=function(){


    try {
        xls_tool({
            input: "./datafiles/2017-02-09_000581.xls",
            output:null
        }, function(err, result) {
            if(err) {
                console.error(err);
            } else {
                var items=[];
                item.max=0;
                item.min=999999;
                result.forEach(function(row,index){
                    var time=new Date(item.date+" "+row[1]).getTime()/1000;
                    var t_type=0;
                    if(row[0]=="买盘") t_type=1;
                    if(row[0]=="卖盘") t_type=-1;
                    item.max=Math.max(item.max,row[2]);
                    item.min=Math.min(item.min,row[2]);
                    items.push({
                        _id:item.no+"_"+time,
                        no:item.no,
                        time:time,
                        price:row[2],
                        trade_type:t_type,
                        turnover_inc:row[5],
                        volume:row[4]
                    })
                })
                item.lastprice=items[items.length-1].price;
                allcallback(0,items)
            }
        });
    }
    catch (ex){
        //fs.unlink(file);
        console.log(ex.toString());

    }

}

module.exports=new advan();
module.exports.start();

