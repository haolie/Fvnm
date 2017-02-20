/**
 * Created by LYH on 2016/9/21.
 */

var http = require('http');
var async=require("async");
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MYSQLDBSuport.js');
var analyser = require('./dataAnalyser.js');
var tool = require('./tools.js');
var  process = require('process');
var url=require("url");
var zlib = require('zlib');
var fs= require('fs');
var fork = require('child_process').fork;
var request=require('request');
var childProgresscount=3;

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
            if(curstr==global.datestr&&curdate.getHours()<15){
                callback(null,true);
                return;
            }

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
                for(var i=0;i<cur.items.length;i++){
                    if(cur.items[i].savestate==0){//0:未处理；1：处理中；2：已处理
                        cur.index=i;
                        break;
                    }
                }
                if(cur.index>=cur.items.length){
                    cur.finished=!module.exports.isWorking;
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
    nohelper.getallno(date,function(err,codes){
        if(err){
            callback(err,null);
            return;
        }

        var dateitem={date:date,items:codes};
        module.exports.dateItems.push(dateitem);
        async.mapLimit(dateitem.items,4,function(item,mapcb){
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
                    url="http://quotes.money.163.com/cjmx/" +
                        datetime.getFullYear() + "/" +
                        datetime.toLocaleDateString().replace(/-/g,'') +"/";
                    if(Number(item.no)>=600000)url+=0;
                    else url+=1;
                    url+= item.no +".xls";
                    var stream = fs.createWriteStream(file);
                    request(url).pipe(stream).on('close', function(err,result){
                        module.exports.console("下载成功："+file+"  "+ item.index+"/"+dateitem.items.length);
                        item.savestate=0;
                        item.file=file;
                        item.trytimes=0;
                        module.exports.dataContext.items.push(item);
                        mapcb(err,result);
                    });
                }
            })
        },function(err,result){
            callback(err,result);
        })
    });
}

DataMeeter.prototype.startFiledown=function(callback){
    module.exports.dataItems=[];
    module.exports.getQueryDates(function(err,dates){
        if(dates==null||dates.length==0){
            callback(null,1)
            return;
        }
        async.mapLimit(dates,1,module.exports.downDateFiles,function(err,result){
            callback(err,result)
        });
    });
}

DataMeeter.prototype.getQueryDates=function(callback){
    var tempdate=new Date(global.datestr);
     tempdate.add('d',-7);
    tempdate=tempdate.toLocaleDateString();
    nohelper.getwebDates(tempdate,function(err,dates){
        var date=[];
        if(dates==null&&dates.length==0){
            date.push(global.datestr);
            callback(null,date)
            return;
        }
        async.mapLimit(dates,1,function(d,cb){
            dbsuport.getfaces({no:global.shcode,date:d},function(err,items){
                if(items==null||items.length==0)date.push(d);
                cb(null,1);
            });
        },function(err,result){
            callback(null,date);
        })

    });
}

DataMeeter.prototype.commitDateItems=function(){
    if(module.exports.dateItems==null||module.exports.dateItems.length==0){
        return;
    }

    module.exports.dateItems.forEach(function(date,index){
        if(date.items&&date.items.length>0)
        module.exports.console(JSON.stringify(date.items[1]))
        for(var i in date.items){
            if(date.items[i].savestate!=2) {
                module.exports.console("        ")
                module.exports.console("        ")
                module.exports.console("        ")
                module.exports.console(date.date);
                module.exports.console(i);
                module.exports.console("        ")
                module.exports.console("        ")
                module.exports.console("        ")
                return;
            }
        }
        module.exports.console("________")
        module.exports.console("________")
        module.exports.console("________")
        module.exports.console(date.date);
        module.exports.console("________")
        module.exports.console("________")
        module.exports.console("________")
        dbsuport.updatacodeface({
            no:global.shcode,
            state:1,
            date:date.date
        },function(err,r){
            //analyser.startworker();
            module.exports.console(date.date+ " has save completed");
        });
    })

}

var total=0;
var cur=0;
var starttime;
DataMeeter.prototype.getAllCodeValues=function(codes){
    var list=[];
    starttime=new Date();
    var start=new Date();
    start.setHours(9);
    start.setMinutes(0);
    start=Date.parse(start)/1000;

    var end=new Date();
    end.setHours(18);
    end.setMinutes(0);
    end=Date.parse(end)/1000;

    for(var i=0;i<codes.length;i++){
        list.push(
            {
                no:String(codes[i].no) ,
                data:new hashmap(),
                tag:codes[i],
                start:start,
                end:end,
                min:10000,
                max:-1
            }
        );
    }

    async.mapLimit(list,3,module.exports.getValuesByNo,function(err,results){
        var date=new Date();
        module.exports.console(global.datestr+" data save succeed")

        var ms=new Date().valueOf()-starttime.valueOf();
        var m=0;
        var s=0;
        s=Math.floor(ms/1000);
        ms=Math.floor(ms%1000);
        m=Math.floor(s/60);
        s=Math.floor(s%60);

        module.exports.console("耗时 "+m+":"+s+";"+ms);

        var usu=0;
        for(var i in results){
            if(results[i])
            usu+=1;
        }
        if(usu){
            dbsuport.updatacodeface({
                _id:global.shcode+"_"+global.datestr,
                no:global.shcode,
                state:1,
                date:global.datestr
            },function(err,r){
                global.curCodes=null;
                analyser.startworker();
            });
        }
        else {
            module.exports.console("失败："+usu);
        }


        module.exports.isWorking=false;

    })
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
        if(result) {
            module.exports.isWorking=false;
            return;
        }

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
                module.exports.commitDateItems();
                module.exports.isWorking=false;
            }
        }

        module.exports.startFiledown(downCall)
    });
}

DataMeeter.prototype.sendWorker=function(p){
    var work=module.exports.dataContext.getItem();
    if(work)work.savestate=1;
    p.worker.send(JSON.stringify({type:"work",item:work}));
};

DataMeeter.prototype.startChildWorker=function(){
    for (var i = 0; i < childProgresscount; i++) {
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

DataMeeter.prototype.isWorking=null;
DataMeeter.prototype.progress=[];
DataMeeter.prototype.start=function() {

    //module.exports.saveToDb({no:'000166',date:"2017-01-26"},function(err,items){
    //
    //})
    //return;

        module.exports.isWorking = true;

        setInterval(function () {
            if (module.exports.isWorking) return;
            module.exports.startwork();
        }, 180000);
         module.exports.startwork();
         module.exports.startChildWorker();


        setInterval(function () {
            if(module.exports.dataContext.finished) return;

            module.exports.progress.forEach(function(p,index){
                if(p.state=="free") module.exports.sendWorker(p);
            })
        }, 1000)

    setInterval(function () {
        if(module.exports.dataContext.finished) return;
        module.exports.commitDateItems();

    }, 5000)




}

module.exports=new DataMeeter();
module.exports.start();


//http.createServer(function(req, res){
//
//}).listen(8080);



//getAllCodeValues(["000002"]);
//getValuesByNo({no:'603018',data:new hashmap()});

