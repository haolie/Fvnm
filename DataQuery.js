/**
 * Created by LYH on 2016/12/19.
 */
var http = require('http');
var nohelper = require('./nohelper.js');
//var dbsuport = require('./MGDBSuport.js');
var dbsuport = require('./MYSQLDBSuport.js');
var  process = require('process');
var url=require("url");

var vm=function(){}

vm.prototype.ondatefaceQuery=function(req,res,query){
    if(query.date==null||query.date==""){

        res.end("not find date error");
        return
    }
    var item={date:query.date};
    if(query.face) item.face= parseInt(query.face);
    if(query.per!=undefined) item.per={$lte:parseFloat(query.per) };

    var str="select * from codeface where _date='"+query.date+"' and per<"+query.per*10000+";";

    dbsuport.getfacesbysql(str,function(err,faces){

        res.end(JSON.stringify(faces));
    })
}

vm.prototype.onfacequalityQuery=function(req,res,query){
    if(query.date==null||query.date==""){

        res.end("not find date error");
        return
    }

    var item={date:query.date};
    if(query.face) item.face= parseInt(query.face);
    if(query.per!=undefined) item.per={$lte:parseFloat(query.per) };

    var num=5;
    var sper=0.015;
    if(query.day) num=query.day;

    module.exports.getafterdays(query.date,'000001',function(err,dates){
        if(dates.length){
            var curdate=dates[dates.length-1];
            if(dates.length>num)curdate=dates[num-1];

            dbsuport.getfaces({date:curdate},function(err,sfaces){
                var result={date:query.date,aferdays:num,sper:sper,
                    day_upcount:0,day_succeed:0,day_ex_succeed:0,upcount:0,succeed:0,ex_succeed:0,
                    sh_count:sfaces.length,sh_upcount:0};

                dbsuport.getfaces(item,function(err,faces){
                    result.count=faces.length;

                    for(var i in sfaces){
                        if(sfaces[i].per>0)result.sh_upcount+=1;

                        for(var j in faces){
                            if(faces[j].no==sfaces[i].no){
                                if(sfaces[i].per>0)result.day_upcount+=1;
                                if(sfaces[i].per>sper)result.day_succeed+=1;
                                var day_ex_per=(sfaces[i].max-(sfaces[i].lastPrice-sfaces[i].ud))/(sfaces[i].lastPrice-sfaces[i].ud)
                                if((day_ex_per/100)>sper)result.day_ex_succeed+=1;

                                var price=faces[j].lastPrice-faces[j].ud;
                                var allper= ((sfaces[i].lastPrice-faces[j].lastPrice)/faces[j].lastPrice)/100;
                                if(allper>0)result.upcount+=1;
                                if(allper>sper)result.succeed+=1;

                                var ex_allper=((sfaces[i].max-faces[j].lastPrice)/faces[j].lastPrice)/100;
                                if(ex_allper>sper)result.ex_succeed+=1;


                            }
                        }
                    }
                    res.end(JSON.stringify(result));
                })
            })

        }
    })



}

vm.prototype.onafterdaysQuery=function(req,res,query){
    module.exports.getafterdays(query.date,query.no,function(err,dates){
        if(query.count&&query.count<dates.length)dates=dates.slice(0,query.count-1);
        res.end(JSON.stringify(dates));
    })

}

vm.prototype.getafterdays=function(date,no,callback){
    var date=new Date(date);
    var max=5;
    dbsuport.getfaces({no:no},function(err,faces){
        var dates=[];
        if(faces&&faces.length){
            for(var i in faces){
                if(new Date(faces[i].date)>date){
                    dates.push(faces[i].date);
                    if(dates.length>=max) break;
                }
            }
        }

        callback(null,dates);
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
            face.data=[];
            for (var i in result){
                face.data.push({time:result[i].time,price:result[i].price})
            }
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

        var fun=module.exports['on'+request.pathname.replace('/','')+'Query'];
        if(fun)fun(req,res,request.query);
        else res.end("not find!");

        //if(request.pathname=="/dateface") module.exports.ondatefacequery(req,res,request);
        //else if (request.pathname=="/dayvalue")module.exports.ondayvalueQuery(req,res,request.query);
        //else   res.end("not find!");




    }).listen(12122);

}

module.exports=new vm();
module.exports.start();
