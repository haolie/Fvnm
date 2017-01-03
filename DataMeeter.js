/**
 * Created by LYH on 2016/9/21.
 */

var http = require('http');
var async=require("async");
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
//var dbsuport = require('./MGDBSuport.js');
var dbsuport = require('./MYSQLDBSuport.js');
var  process = require('process');
var url=require("url");
var zlib = require('zlib');

//
var tempCodes=['300207','600313','600510'];

var DataMeeter=function(){};


DataMeeter.prototype.getUrlsByCode=function(code){
    //var httpurl="http://quotes.money.163.com/service/zhubi_ajax.html?"+"symbol="+code;
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
    var date=new Date();
    if(date.getHours()<3){
        callback(null,true);
        return;
    }

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
            //var datastr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
            dbsuport.getcodeface("000001",str,function(err,result){
                callback(null,result!=null);
            })
        });
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

        async.mapLimit(allurls,8,function(codeurl,callback){
            var  longstr="";
            var options ={
                hostname: 'quotes.money.163.com',
                port: 80,
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
                            callback(1,0);
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
               callback(1,0);
               //module.exports.console("请求出错 ");
               module.exports.console("index:"+index+","+ item.no+" 请求出错");
            }).on('timeout',function(e){

               rquest.abort();
              // callback(1,null);
               module.exports.console("index:"+index+","+ item.no+" 请求超时");
           });
            rquest.setTimeout(10000,function(a,b){

           });
        },function(err,results){

            var su=true;
            if(err)su=false;
            else for (i in results)su&=results[i];

            if(!su){
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
                        min:item.min,
                        max:item.max,
                        ud:item.tag.ud,
                        lastPrice:item.tag.price
                    };

                    dbsuport.updatacodeface(face);
                }

                global.curCodes[index].save=true;
                module.exports.console(index+"/"+global.curCodes.length);

                item.data=null;
                allcallback(0,true);
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

    async.mapLimit(list,6,module.exports.getValuesByNo,function(err,results){
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

        var su=true;
        for(var i in results){
            su&=results[i];
        }
        if(su){
            dbsuport.updatacodeface({
                _id:"000001_"+global.datestr,
                no:"000001",
                date:global.datestr
            },function(err,r){
                global.curCodes=null;
            });
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
        if(global.curCodes==null){
            nohelper.getallno(function(err,allno){
                global.curCodes=allno;
                dbsuport.getfaces({date:global.datestr},function(err,result){
                    if(result&&result.length>0){
                        for(var i in result){
                            for(var j in allno){
                                if(result[i].no==allno[j].no)allno[j].save=true;
                            }
                        }
                    }
                    module.exports.getAllCodeValues(allno);
                })

            })
        }
        else{
            module.exports.getAllCodeValues(global.curCodes);
        }
    });
}

DataMeeter.prototype.isWorking=null;

DataMeeter.prototype.start=function(){
    module.exports.isWorking=true;

    setInterval(function(){
        if(module.exports.isWorking) return;
        module.exports.startwork();
    },180000)

    module.exports.startwork();



}



module.exports=new DataMeeter();
module.exports.start();


//http.createServer(function(req, res){
//
//}).listen(8080);



//getAllCodeValues(["000002"]);
//getValuesByNo({no:'603018',data:new hashmap()});

