/**
 * Created by LYH on 2016/12/19.
 */
var http = require('http');
var nohelper = require('./nohelper.js');
var dbsuport = require('./MGDBSuport.js');
var  process = require('process');
var url=require("url");

var vm=function(){}

vm.prototype.ondatefacequery=function(req,res,query){
    if(query.query.date==null||query.query.date==""){

        res.end("not find date error");
        return
    }
    var item={date:query.query.date};
    if(query.query.face) item.face= parseInt(query.query.face);
    if(query.query.per!=undefined) item.per={$lte:parseFloat(query.query.per) };

    dbsuport.getfaces({date:query.query.date,face:2},function(err,faces){

        res.end(JSON.stringify(faces));
    })
}

vm.prototype.ondayvalueQuery=function(req,res,query){


    if(query==null||query.no==null||query.no==""||query.date==null||query.date.length==0){

        res.end("formate error");
        return
    }

    var item={};
    item.no=query.no;
    item.date=new Date(query.date)

    dbsuport.getcodeface(query.no,query.date,function(err,face){
        dbsuport.getValueByDayNo(item,function(er,result){
            face.data=result;
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(face));
        })
    });

}

vm.prototype.start=function(){

    http.createServer(function (req, res) {

        res.writeHead(200, {'Content-Type': 'text/plain'});
        var request=url.parse(req.url,true)
        args= url.parse(req.url,true).query;

        if(request.pathname=="/dateface") module.exports.ondatefacequery(req,res,request);
        else if (request.pathname=="/dayvalue")module.exports.ondayvalueQuery(req,res,request.query);
        else   res.end("not find!");




    }).listen(12122);

}

module.exports=new vm();
module.exports.start();
