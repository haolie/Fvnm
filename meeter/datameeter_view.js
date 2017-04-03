/**
 * Created by youhao on 2017/3/8.
 */
var http = require('http');
var nohelper = require('./nohelper.js');
var url=require("url");

var vm=function(){};

vm.prototype.start=function(meeter){
    this.meeter=meeter;

    http.createServer(function (req, res) {

        res.writeHead(200, {'Content-Type': 'text/plain'});
        var request=url.parse(req.url,true)
        args= url.parse(req.url,true).query;

        var fun=module.exports['on'+request.pathname.replace('/','')+'Query'];
        if(fun)fun(req,res,request.query);
        else res.end("not find!");


    }).listen(12126);
}

vm.prototype.meeteritemsQuery=function(req,query){
   if(this.meeter.dateItems||this.meeter.dateItems.length){
       res.writeHead(6001, {'Content-Type': 'text/plain'});
       res.end("free");

       return;
   }

    var items=[];

    for(var i in this.meeter.dateItems){
        items.push({
            count:this.meeter.dateItems[i].items.length,
            downcount:this.meeter.dateItems[i].downcount,
            savecount:this.meeter.dateItems[i].savecount
        })
    }

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(JSON.stringify(items));
}