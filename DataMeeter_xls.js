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
var  process = require('process');
var url=require("url");
var zlib = require('zlib');
var xls=require('xls-to-json');
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
            dbsuport.getcodeface("000001",str,function(err,result){
                callback(null,result!=null&&result.state);
            })
        });
    });




}

DataMeeter.prototype.downCodeFile=function(item,callback){
    url="http://quotes.money.163.com/cjmx/2017/20170126/1000651.xls";
    var stream = fs.createWriteStream("./datafiles/1000651.xls");
    request(url).pipe(stream).on('close', function(err,result){

    });
}

DataMeeter.prototype.readDataFile=function(){

    url="http://quotes.money.163.com/cjmx/2017/20170126/1000651.xls";
    var stream = fs.createWriteStream("./datafiles/1000651.xls");
    request(url).pipe(stream).on('close', function(err,result){

    });
return;

    fs.createReadStream('file.json').pipe(request.put('http://mysite.com/obj.json'))
    xls({
        input: "./datafiles/0601668.xls",  // input xls
        output: "./datafiles/output.json", // output json
        sheet: "0601668_成交明细_2017-01-25"  // specific sheetname
    }, function(err, result) {
        if(err) {
            console.error(err);
        } else {
            console.log(result);
        }
    });

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
            dbsuport.getfaces({no:1,date:d},function(err,items){
                if(items==null||items.length==0)date.push(d);
                cb(null,1);
            });
        },function(err,result){
            callback(null,date);
        })

    });
}

DataMeeter.prototype.getValuesByNo=function(item,allcallback){

    var index=0;
    for(var i in global.curCodes){
        if(global.curCodes[i].no==item.no){
            index=i;
            break;
        }
    }

     if(item.tag.save){
            allcallback(null,item);
           module.exports.console("index:"+index+","+ item.no+" has saved");
            return;
        }

        var allurls=  module.exports.getUrlsByCode(item.no);
        async.mapLimit(allurls,2,function(codeurl,callback){
            var  longstr="";
            var options ={
                hostname: 'quotes.money.163.com',
                //hostname: '123.126.66.66',
                port: 80,
                method: 'GET',
                path:codeurl,
                timeout:20000,
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
               res.on("aborted",function(){

               })
                res.on('data', function (chunk) {
                    length+=chunk.length;
                    chunks.push(chunk);
                });
                res.on('end', function (str) {
                    //consoleTimes("h查询");
                    if(item==null||item.data==null)return;
                    var buf=Buffer.concat(chunks, length);
                    zlib.gunzip(buf, function (err, decoded) {
                        if(item==null||item.data==null)return;
                        try {
                            var temp=JSON.parse(decoded.toString().toLowerCase());
                        }catch(er) {
                            module.exports.console("index:"+index+","+ item.no+" 数据获取失败");
                            callback(codeurl,0);
                            return;
                        }

                        for(var i=0;i<temp.zhubi_list.length;i++){
                            item.data.set(temp.zhubi_list[i].date.sec, {
                                _id:item.no+"_"+temp.zhubi_list[i].date.sec,
                                no:item.no,
                                time:temp.zhubi_list[i].date.sec,
                                price:temp.zhubi_list[i].price,
                                trade_type:temp.zhubi_list[i].trade_type,
                                turnover_inc:temp.zhubi_list[i].turnover_inc,
                                volume:temp.zhubi_list[i].volume_inc
                            });

                            item.min=Math.min(item.min,temp.zhubi_list[i].price);
                            item.max=Math.max(item.max,temp.zhubi_list[i].price);
                        }

                        callback(0,1);

                    });
                });
            }).on("error",function(a,b){
               callback(codeurl,0);
               //module.exports.console("请求出错 ");
               module.exports.console("index:"+index+","+ item.no+" 请求出错");
            }).on('timeout',function(e){

               rquest.abort();
              // callback(1,null);
               //console.log(codeurl)
               module.exports.console("index:"+index+","+ item.no+" 请求超时");
           });
            rquest.setTimeout(20000,function(a,b){

           });
        },function(err,results){

            var su=0;
             for (i in results) if(!results[i])
                su+=1;

            if(su>0){
                module.exports.console("err");
            }

            if(su){
                module.exports.console("index:"+index+","+ item.no+" 保存失败");
                allcallback(0,false);
                return;
            }
            //consoleTimes("查询");
            var count=0;
            for(var i=0;i<results.length;i++){
                count+=results[0];
            }

            var allvalues=item.data.values();
            dbsuport.saveTimePrice(allvalues,function(err,result){
                if(err){
                    module.exports.console("index:"+index+","+ item.no+" 保存失败");
                }
                else {
                    module.exports.console("index:"+index+","+ item.no+" 保存成功;" +allvalues.length);
                }
                if(allvalues.length){
                    var face={
                        _id:item.no+"_"+global.datestr,
                        no:item.no,
                        date:global.datestr,
                        _min:Math.floor(item.min*100),
                        _max:Math.floor(item.max*100) ,
                        state:1
                    };

                    dbsuport.updatacodeface(face,function(err,s){
                        global.curCodes[index].save=true;
                        module.exports.console(index+"/"+global.curCodes.length);

                        item.data=null;
                        allcallback(0,true);
                    });
                }
                else {
                    global.curCodes[index].save=true;
                    module.exports.console(index+"/"+global.curCodes.length);

                    item.data=null;
                    allcallback(0,true);
                }

            });
        });
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
                _id:"000001_"+global.datestr,
                no:"000001",
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

DataMeeter.prototype.isWorking=null;
DataMeeter.prototype.progress=[];
DataMeeter.prototype.child_id="";
DataMeeter.prototype.child_free=true;
DataMeeter.prototype.start=function(){

    if(cluster.isMaster){
        module.exports.isWorking=true;

        setInterval(function(){
            if(module.exports.isWorking) return;
            module.exports.startwork();
        },180000)

        module.exports.startwork();
return;
        for (var i = 0; i < childProgresscount; i++) {
            var tempfork= cluster.fork()
            tempfork.on("message",function(msg){
                msg=JSON.parse(msg);
                if(msg.type=="state"){

                }
                else  if(msg.type=="handled"){

                }
            })
            module.exports.progress.push({id:i,worker:tempfork,free:false}) ;//启动子进程
            tempfork.send({type:'id',id:i});
        }
    }


    process.on("message",function(msg){
        msg=JSON.parse(msg);
        if(msg.type=="id"){
            module.exports.child_id=msg.id;
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

