/**
 * Created by LYH on 2016/9/21.
 */

var http = require('http');
var async=require("async");
var hashmap=require("hashmap");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MGDBSuport.js');
var  process = require('process');
var url=require("url");

//
var tempCodes=['300207','600313','600510'];

var DataMeeter=function(){};


DataMeeter.prototype.getUrlsByCode=function(code){
    var httpurl="http://quotes.money.163.com/service/zhubi_ajax.html?"+"symbol="+code;
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
    if(date.getHours()<15){
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

     if(item.tag.save){
            allcallback(null,item);
            return;
        }

        async.map(module.exports.getUrlsByCode(item.no),function(codeurl,callback){
            var  longstr="";
            http.get(codeurl,function(res){

                var length=0;
                var chunks=[];
                res.on('data', function (chunk) {
                    length+=chunk.length;
                    chunks.push(chunk);
                });
                res.on('end', function (str) {
                    //consoleTimes("h查询");
                    var buf=Buffer.concat(chunks, length);
                    try {
                        var temp=JSON.parse(buf.toString().toLowerCase());
                    }catch(er) {
                        module.exports.console(item.no+"  数据获取失败");
                        callback(0,0);
                        return;
                    }

                    var date=new Date();

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

                    callback(0,temp.zhubi_list.length);
                });
            })
        },function(err,results){
            //consoleTimes("查询");
            var count=0;
            for(var i=0;i<results.length;i++){
                count+=results[0];
            }

            var allvalues=item.data.values();
            dbsuport.saveTimePrice(allvalues,function(err,result){
                if(err){
                    module.exports.console(item.no+ ' 保存失败')
                }
                else {
                    module.exports.console(item.no+ ' 保存成功')
                }
                if(allvalues.length){
                    var date=new Date();
                    var datastr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
                    var face={
                        _id:item.no+"_"+datastr,
                        no:item.no,
                        date:datastr,
                        min:item.min,
                        max:item.max,
                        ud:item.tag.ud,
                        lastPrice:item.tag.price
                    };

                    dbsuport.updatacodeface(face);
                }

                for(var i in global.curCodes){
                    if(global.curCodes[i].no==item.no){
                        global.curCodes[i].save=true;
                        module.exports.console(i+"/"+global.curCodes.length);
                    }
                }

                item.data=null;
                allcallback(0,result);
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

    async.mapLimit(list,1,module.exports.getValuesByNo,function(err,results){
        var date=new Date();
        module.exports.console(date.getMonth()+""+date.getDate()+""+"data save succeed")

        var ms=new Date().valueOf()-starttime.valueOf();
        var m=0;
        var s=0;
        s=Math.floor(ms/1000);
        ms=Math.floor(ms%1000);
        m=Math.floor(s/60);
        s=Math.floor(s%60);

        module.exports.console("耗时 "+m+":"+s+";"+ms);

        var datastr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
        dbsuport.updatacodeface({
            _id:"000001_"+datastr,
            no:"000001",
            date:datastr
        },function(err,r){
            global.curCodes=null;
        });

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
                module.exports.getAllCodeValues(allno);
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

