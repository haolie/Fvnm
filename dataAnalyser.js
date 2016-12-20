/**
 * Created by LYH on 2016/12/20.
 */
var nohelper = require('./nohelper.js');
var dbsuport = require('./MGDBSuport.js');
var  process = require('process');
var async=require("async");
var fs= require('fs');
var path = require('path');

var da=function(){}
da.prototype.analyse=function(date,callback){

    dbsuport.getfaces({date:date},function(err,items){
        async.mapLimit(items,1,function(item,nocallback){
            dbsuport.getValueByDayNo({no:item.no,date:new Date(date) },function(err,result){
                if(result==null||result==0){
                    nocallback(1,null);
                    return;
                }
                var min=null;
                var max=null;
                var last = result[result.length]
                for(var i in result){
                    if(i==0){
                        min=max=result[i];
                        continue;
                    }

                    if(result[i].price>max.price) max=result[i];
                    if(result[i].price<min.price) min=result[i];
                }

                var face=1;
                item.per=item.ud/(item.lastPrice-item.ud);
                if(max==min)face=4;
                else if(max.time>min.time)face=2;

                    item.face=face;
                    dbsuport.updatacodeface(item,function(err,uf){
                        nocallback(null,null);
                        console.log(item.no +" face:"+face);
                    })

            })

        },function(err,result){
            fs.readFile(path.join(__dirname,"config.json"), function (err,bytesRead) {
                var config= JSON.parse( bytesRead.toString());
                config.lastAnalyse=date;
                fs.writeFile(path.join(__dirname,"config.json"), JSON.stringify(config), function (err) {
                    console.log(config.lastAnalyse);
                    if(callback){
                        callback(err);
                    }
                });
            });
        })
    })

}

da.prototype.analyseNo=function(item,callback){


}

da.prototype.checkdate=function(callback){
    fs.readFile(path.join(__dirname,"config.json"), function (err,bytesRead) {
        var config= JSON.parse( bytesRead.toString());
        var lastDateStr=null;
        if(config.lastAnalyse)
        lastDateStr=new Date(config.lastAnalyse);

        dbsuport.getfaces({no:"000001"},function(err,sh){
            var dates=[];
            if(err||sh==null){
                callback(null,dates);
                return;
            }

            for(var i in sh){
                if(lastDateStr==null)dates.push(sh[i].date);
                else if(new Date(sh[i].date)>lastDateStr){
                        if(err||sh==null) return;
                        dates.push(sh[i].date);
                }
            }
            callback(null,dates);
        })
    });


}

da.prototype.working=false;
da.prototype.startworker=function(){
    if(module.exports.working) return;

    module.exports.working=true;
    module.exports.checkdate(function(err,date){
        if(date==null||date.length==0){
            module.exports.working=false;
            return;
        }

        for (var i in date){
            console.log(date[i]);
        }

        async.mapLimit(date,1,module.exports.analyse,function(err,result){
            module.exports.working=false;
        })
    })

}


module.exports=new da();
module.exports.startworker();
setInterval(module.exports.startworker,3600000);