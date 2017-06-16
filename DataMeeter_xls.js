/**
 * Created by LYH on 2016/9/21.
 */

var http = require('http');
var async=require("async");
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MYSQLDBSuport.js');
var  process = require('process');
var url=require("url");
var zlib = require('zlib');
var fs= require('fs');
var fork = require('child_process').fork;
var request=require('request');
var childProgresscount=5;

//
var tempCodes=['300207','600313','600510'];

var DataMeeter=function(){};

DataMeeter.prototype.checkValueDate=function(callback){
    var url="http://hq.sinajs.cn/list=sh000001";
    http.get(url,function(res){
        var length=0;
        var chunks=[];
        res.on('data', function (chunk) {
            length+=chunk.length;
            chunks.push(chunk);
        });
        res.on('end', function (str) {

            var str=chunks.toString();
            str=str.substring(str.length-25);
            str=str.substring(0,10);
            global.datestr=str;
            var curdate=new Date();
            var curstr=curdate.getFullYear()+"-"+(curdate.getMonth()+1)+"-"+curdate.getDate();
            //if(curstr==global.datestr&&curdate.getHours()<15){
            //    callback(null,true);
            //    return;
            //}

            //var datastr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
            dbsuport.getcodeface(global.shcode,str,function(err,result){
                callback(null,result!=null&&result.state);
            })
        });
    });




}

DataMeeter.prototype.readDataFile=function(){

    url="http://quotes.money.163.com/cjmx/2017/20170126/1000651.xls";
    var stream = fs.createWriteStream("./datafiles/1000651.xls");
    request(url).pipe(stream).on('close', function(err,result){

    });
return;

    fs.createReadStream('file.json').pipe(request.put('http://mysite.com/obj.json'))


    //xls.open('./datafiles/sh600837_20170124.xls',function(err,sheet){

   // })
   // var list = xls.parse("./datafiles/" + "sh600837_成交明细_20170124.xls");
}

DataMeeter.prototype.dataContext={
    index:0,
    items:[],
    finished:false,
    getItem:function(){
        var cur=module.exports.dataContext;
        if(cur.finished) return null;

        while (true){
            if(cur.items==null){
                console.log("null")
            }

            if(cur.index>=cur.items.length){
                if(module.exports.isdowning) return null;

                for(var i=0;i<cur.items.length;i++){
                    if(cur.items[i].savestate==0){//0:未处理；1：处理中；2：已处理
                        cur.index=i;
                        break;
                    }
                }
				
				if(module.exports.isWorking)
					return null;
				
                if(cur.index>=cur.items.length){
                    cur.finished=!module.exports.isWorking;
                  //  if(cur.finished) module.exports.commitDateItems();
                    return null;
                }
                continue;
            }

            var temp=cur.items[cur.index];
            temp.index=cur.index;
            cur.index++;
            if(temp.savestate==0)
            return temp;
        }

    }
}

DataMeeter.prototype.dateItems=[];

DataMeeter.prototype.downDateFiles=function(date,callback){
    module.exports.console("start file down:"+ date);
    nohelper.getallno(date,function(err,codes){
        if(err){
            callback(err,null);
            return;
        }
        var temps=[];
        codes.forEach(function(c,i){
            if(c.no==global.shcode) return;
            c.index=i;
            c.downstate=c.savestate=-1;
            if(c.state)
                c.downstate=c.savestate=2;
            else
                temps.push(c);
        });

        module.exports.console(date +": count="+ codes.length+"; needsave="+temps.length );
        if(temps.length==0){
            dbsuport.updatacodeface({
                no:global.shcode,
                state:1,
                date:date
            },function(err,r){
                callback(null,true);
                module.exports.console(date+ " has save completed");
            });

            return;
        }

        var dateitem={date:date,items:temps};
        module.exports.dateItems.push(dateitem);
        async.mapLimit(dateitem.items,2,function(item,mapcb){
            var file="./datafiles/"+date+"_"+item.no +".xls";
            fs.exists(file,function(exist){
                if(exist){
                    module.exports.console("exist："+item.no + "  "+ item.index+"/"+dateitem.items.length);
                    item.savestate=0;
                    item.file=file;
                    item.trytimes=0;
                    module.exports.dataContext.items.push(item);
                    mapcb(null,0);
                }
                else {
                    var datetime=new Date(date);
                    //  http://stock.gtimg.cn/data/index.php?appn=detail&action=download&c=sz000819&d=20170522
                    //url="http://quotes.money.163.com/cjmx/" +
                    //    datetime.getFullYear() + "/" +
                    //    datetime.toLocaleDateString().replace(/-/g,'') +"/";

                    url="http://stock.gtimg.cn/data/index.php?appn=detail&action=download";
                    var codestr="sz"+ item.no;
                    if(Number(item.no)>=600000)codestr="sh"+ item.no;
                    var datestr=date.replace('-','');
                    datestr=datestr.replace('-','');
                    url=url+"&c="+codestr+"&d="+datestr;
                    var stream = fs.createWriteStream(file);
                    request.get(url,{timeout:15000},function(err){
                        if(err){
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            module.exports.console("下载成功失败失败");
                            item.savestate=-1;
                            mapcb(null,0);

                            fs.exists(file,function(exist){
                                if(exist) fs.unlink(file);
                            });
                        }

                    }).on("error",function(){
                        module.exports.console("下载成功失败失败");
                        module.exports.console("下载成功失败失败");
                        module.exports.console("下载成功失败失败");
                        module.exports.console("下载成功失败失败");
                        module.exports.console("下载成功失败失败");
                        module.exports.console("下载成功失败失败");
                    }).pipe(stream).on('close', function(err,result){
                        //request(url).pipe(stream).on('close', function(err,result){
                        stream.end();
                        if(err){
                            item.savestate=-1;
                            mapcb(null,result);

                            fs.exists(file,function(exist){
                                if(exist) fs.unlink(file);
                            });
                            return;
                        }
                        module.exports.console("下载成功："+file+"  "+ item.index+"/"+dateitem.items.length);
                        item.savestate=0;
                        item.file=file;
                        item.trytimes=0;
                        module.exports.dataContext.items.push(item);
                        mapcb(null,result);
                    }).on("error",function (){

                    });
                }
            })

        },function(err,result){
            module.exports.console(dateitem.date+"  finid");
            callback(null,result);
        })
    });
}

DataMeeter.prototype.startFiledown=function(callback){
    module.exports.isdowning=true;
    module.exports.dataItems=[];
    module.exports.getQueryDates(function(err,dates){
       // dates=["2017-04-17","2017-04-18","2017-04-19","2017-04-20","2017-04-21"];
        if(dates==null||dates.length==0){
            callback(null,1)
            return;
        }

        dates.forEach(function(d,index){
            module.exports.console(d);
        })
        async.mapLimit(dates,1,module.exports.downDateFiles,function(err,result){
            callback(err,result);
            module.exports.isdowning=false;
        });
    });
}

DataMeeter.prototype.getQueryDates=function(callback){
    var tempdate=new Date(global.datestr);
     tempdate.add('d',-30);
    tempdate=tempdate.toLocaleDateString();
    tempdate="2017-01-01";
    nohelper.getwebDates(tempdate,function(err,dates){
        var date=[];
        if(dates==null&&dates.length==0){
            date.push(global.datestr);
            callback(null,date)
            return;
        }


        async.mapLimit(dates,1,function(d,cb){
            dbsuport.getfaces({no:global.shcode,date:d},function(err,items){
                if(items==null||items.length==0||items[0].state==0)date.push(d);
                cb(null,1);
            });
        },function(err,result){
            callback(null,date);
        })

    });
}

DataMeeter.prototype.consoleTimes=function(str){
    var ms=new Date().valueOf()-starttime.valueOf();
    var m=0;
    var s=0;
    s=Math.floor(ms/1000);
    ms=Math.floor(ms%1000);
    m=Math.floor(s/60);
    s=Math.floor(s%60);

    module.exports.console(str+ " "+m+":"+s+";"+ms);
}

DataMeeter.prototype.console=function(item){
    if(process.send)
     process.send(item);
    else
    console.log(item);
}

DataMeeter.prototype.startwork=function(){
    module.exports.isWorking=true;
    module.exports.checkValueDate(function(err,result){

        module.exports.console("checkValueDate:"+result);
        //if(result) {
        //    module.exports.isWorking=false;
        //    return;
        //}

        //module.exports.dataContext.finished=false;
        //module.exports.dataContext.items=[];
        //module.exports.dataContext.index=0;


        module.exports.console("start data meet");
        var downCall=function(err,dates){
            if(err){
                module.exports.startFiledown(downCall)
            }
            else {
                module.exports.console("downFinished");
               // module.exports.commitDateItems();
                module.exports.isWorking=false;
            }
        }

        module.exports.startFiledown(downCall)
    });
}

DataMeeter.prototype.sendWorker=function(p){
    var work=module.exports.dataContext.getItem();
    if(work)work.savestate=1;
    p.item=work;
    p.worker.send(JSON.stringify({type:"work",item:work}));
};


DataMeeter.prototype.createChild=function(p){
    if(p==undefined||p==null){
        p={};
        module.exports.progress.push(p) ;//启动子进程
    }
    p.state="working";
    p.worker= fork("DataMeeter_worker.js")
    p.worker.on("message",function(msg,b){
        // console.log(msg);
        msg=JSON.parse(msg);
        if(msg.type=="state"){
            module.exports.progress.forEach(function(p,index){
                if(p.worker.pid==msg.id){
                    p.state=msg.msg;
                }
            })
        }
        else  if(msg.type=="result"){
            //module.exports.console(JSON.stringify(msg));
            var tm= module.exports.dataContext.items[msg.msg.index];
            tm.savestate=2
            if(msg.msg.result){
                tm.trytimes+=1;
                if(tm.trytimes>=3)msg.savestate=4;
                else msg.savestate=0;
            }
            module.exports.progress.forEach(function(p,index){
                if(p.worker.pid==msg.id){
                    module.exports.sendWorker(p);
                }
            })
            var ts=" 保存成功"; if(msg.msg.result)ts=" 保存失败 times "+tm.trytimes;
            module.exports.console(tm.date+" "+tm.no+ ts +" "+tm.index);
        }
        else  if(msg.type=="console"){
            module.exports.console(msg.msg);
        }
    });
    p.worker.on("create",function(){
        p.state="free";
    })
    p.worker.on("exit",function(){
        if(p.item){
            fs.unlink(p.item.file);
            p.item.savestate=0;
        }
        p.worker.kill();
        p.worker=null;
        module.exports.createChild(p);
    });

}

DataMeeter.prototype.startChildWorker=function(){
    for (var i = 0; i < childProgresscount; i++) {
        module.exports.createChild();continue;
        var tempfork= fork("DataMeeter_worker.js")
        tempfork.on("message",function(msg,b){
            // console.log(msg);
            msg=JSON.parse(msg);
            if(msg.type=="state"){
                module.exports.progress.forEach(function(p,index){
                    if(p.worker.pid==msg.id){
                        p.state=msg.msg;
                    }
                })
            }
            else  if(msg.type=="result"){
                //module.exports.console(JSON.stringify(msg));
                var tm= module.exports.dataContext.items[msg.msg.index];
                tm.savestate=2
                if(msg.msg.result){
                    tm.trytimes+=1;
                    if(tm.trytimes>=3)msg.savestate=4;
                    else msg.savestate=0;
                }
                module.exports.progress.forEach(function(p,index){
                    if(p.worker.pid==msg.id){
                        module.exports.sendWorker(p);
                    }
                })
                var ts=" 保存成功"; if(msg.msg.result)ts=" 保存失败 times "+tm.trytimes;
                module.exports.console(tm.date+" "+tm.no+ ts +" "+tm.index);
            }
            else  if(msg.type=="console"){
                module.exports.console(msg.msg);
            }
        })
        module.exports.progress.push({worker:tempfork,state:"free"}) ;//启动子进程

    }
}

DataMeeter.prototype.isdowning=false;
DataMeeter.prototype.isWorking=null;
DataMeeter.prototype.progress=[];
DataMeeter.prototype.start=function() {
        module.exports.isWorking = true;

        //setInterval(function () {
        //    if (module.exports.isWorking) return;
        //    module.exports.startwork();
        //}, 180000);
         module.exports.startwork();
        module.exports.startChildWorker();
        //
        //
        setInterval(function () {
            if(module.exports.dataContext.finished) return;

            module.exports.progress.forEach(function(p,index){
                if(p.state=="free") module.exports.sendWorker(p);
            })
        }, 1000)
}

module.exports=new DataMeeter();
module.exports.start();


