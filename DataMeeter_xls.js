/**
 * Created by LYH on 2016/9/21.
 */

var http = require('http');
var async=require("async");
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
//var dbsuport = require('./MGDBSuport.js');
var dbsuport = require('./MYSQLDBSuport.js');
var analyser = require('./dataAnalyser.js');
var tool = require('./tools.js');
var xls_tool = require('./xlstool.js');
var  process = require('process');
var url=require("url");
var zlib = require('zlib');
var fs= require('fs');
var request=require('request');
var cluster = require('cluster');
var childProgresscount=2;

//
var tempCodes=['300207','600313','600510'];

var DataMeeter=function(){};


DataMeeter.prototype.getUrlsByCode=function(code){
    //var httpurl="http://quotes.money.163.com/service/zhubi_ajax.html?"+"symbol="+code;
    code=code.toString();
    if(code.length>6)code=code.substr(1);
    var httpurl="/service/zhubi_ajax.html?"+"symbol="+code;
    var minutes=30;
    var funlist=[];
    while (true){
        minutes+=5;
        var h=9+Math.floor(minutes/60);
        var m= Math.floor(minutes%60);
        var tempUrl=httpurl+"&end="+h+'%3A'+m+'%3A00';
        var longstr="";

        if(h==11&&m>30)continue;
        if(h==12)continue;

        funlist.push(tempUrl);

        if(h>=15) break;
    }

    return funlist;
}

DataMeeter.prototype.checkValueDate=function(callback){

    //callback(null, false);
    //return false;
    //var date=new Date();
    //if(date.getHours()<15){
    //    callback(null,true);
    //    return;
    //}

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
    getItem:function(){
        var cur=module.exports.dataContext;
        while (true){
            if(cur.index>=items.length){
                for(var i=0;i<cur.items.length;i++){
                    if(cur.items[i].state<3){
                        cur.index=i;
                        break;
                    }
                }
                if(cur.index>=items.length) return null;
                continue;
            }

            var temp=cur.items[cur.index];
            cur++;
            if(temp.state<3)
            return temp;
        }

    }
}

DataMeeter.prototype.downDateFiles=function(date,callback){
    nohelper.getallno(date,function(err,codes){
        async.mapLimit(codes,4,function(item,mapcb){
            var file="./datafiles/"+date+"_"+item.no +".xls";
            fs.exists(file,function(exist){
                if(exist){
                    module.exports.console("exist："+item.no);
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
                        module.exports.console("下载成功："+file);
                        item.savestate=0;
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

DataMeeter.prototype.saveToDb=function(item,allcallback){
    dbsuport.getcodeface(item.no,item.date,function(err,face){
        if(face&&face.state){
            module.exports.console(item.no+ ": 已保存");
            allcallback(0,0);
            return;
        }

        module.exports.getValuesFromfile(item,function(err,items){
            if(err){
                module.exports.console(item.no+ ": 获取文件数据失败");
                allcallback(0,0);
                return;
            }

            dbsuport.saveTimePrice(items,function(err,result){
                if(err){
                    module.exports.console( item.no+" 保存失败");
                    allcallback(0,1);
                }
                else {
                    module.exports.console( item.no+" 保存成功");
                    if(items.length){
                        var face={
                            _id:item.no+"_"+item.date,
                            no:item.no,
                            date:item.date,
                            lastprice:item.lastprice,
                            _min:Math.floor(item.min*100),
                            _max:Math.floor(item.max*100) ,
                            state:1
                        };

                        dbsuport.updatacodeface(face,function(err,s){
                            allcallback(0,true);
                        });
                    }
                    else {
                        allcallback(0,true);
                    }
                }


            });
        })
    })
}

DataMeeter.prototype.getValuesFromfile=function(item,allcallback){
    if(!(item.no&&item.date)){
        allcallback(null,null);
        return;
    }
    var file='./datafiles/'+item.date+"_"+item.no+".xls";
    fs.exists(file,function(exist){
        if(exist){

            xls_tool({
                input: file,
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
        else {
            allcallback(1,null);
        }
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

DataMeeter.prototype.getFace=function(item){
    var allvalues=item.data.values();


}

DataMeeter.prototype.console=function(item){
    if(!cluster.isMaster){
        module.exports.child_sendMsg(item,"console");
        return;
    }

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

        module.exports.console("start data meet");
        module.exports.startFiledown(function(err,dates){

        })
    });
}

DataMeeter.prototype.child_sendMsg=function(msg,type){
    process.send(JSON.stringify({
        id:module.exports.child_id,
        type:type,
        msg:msg
    }));
}

DataMeeter.prototype.isWorking=null;
DataMeeter.prototype.progress=[];
DataMeeter.prototype.child_id="";
DataMeeter.prototype.child_free=true;
DataMeeter.prototype.start=function(){

    //module.exports.saveToDb({no:'000166',date:"2017-01-26"},function(err,items){
    //
    //})
    //return;
    if(cluster.isMaster){
        module.exports.isWorking=true;

        setInterval(function(){
            if(module.exports.isWorking) return;
            module.exports.startwork();
        },180000)

       // module.exports.startwork();

        for (var i = 0; i < childProgresscount; i++) {
            var tempfork= cluster.fork()
            tempfork.on("message",function(msg){
                msg=JSON.parse(msg);
                if(msg.type=="state"){

                }
                else  if(msg.type=="handled"){

                }
                else  if(msg.type=="console"){
                    module.exports.console(msg.msg);
                }
            })
            module.exports.progress.push({id:i,worker:tempfork,free:false}) ;//启动子进程
            tempfork.send({type:'id',id:i});
        }

        return;
    }


    process.on("message",function(msg){
        msg=JSON.parse(msg);
        if(msg.type=="id"){
            module.exports.child_id=msg.id;
            module.exports.console("id:"+msg.id);
        }
        else if(msg.type=="items"){

        }

    })

}



module.exports=new DataMeeter();
module.exports.start();


//http.createServer(function(req, res){
//
//}).listen(8080);



//getAllCodeValues(["000002"]);
//getValuesByNo({no:'603018',data:new hashmap()});

