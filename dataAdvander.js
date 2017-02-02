/**
 * Created by LYH on 2017/1/16.
 */
var util=require('util');
var baseWorker=require('./BaseVMWorker');
var http = require('http');

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

    http.createServer(function (req, res) {

        res.writeHead(200, {'Content-Type': 'text/plain'});
        var request=url.parse(req.url,true)
        args= url.parse(req.url,true).query;

        var fun=module.exports['on'+request.pathname.replace('/','')+'Query'];
        if(fun)fun(req,res,request.query);
        else res.end("not find!");

    }).listen(12126);

}

module.exports=new advan();
module.exports.start();

