/**
 * Created by LYH on 2016/10/10.
 */
var http = require('http');
var async=require("async");
var percount=70;
var token="";
var fs= require('fs');
var path = require('path');
var dbsuport = require('./MYSQLDBSuport.js');
var tools = require('./tools.js');
var request=require('request');
var querylimit=1;
var cheerio = require("cheerio");
require('date-utils');

var nohelper=function Nohelper(){}

nohelper.prototype.currentDate=null;
nohelper.prototype.allItems=null;

nohelper.prototype.getallnofromweb=function(date,callback){
    var index=1;
    var pageCount=0;
    var allcodes=[];
    this.currentDate=date;
    this.allItems={};
    this.getToken(date,function(err,tokenObj){
        token=tokenObj.token;
        pageCount=Math.floor(tokenObj.code_count/percount);
        if(Math.floor(tokenObj.code_count%percount)>0)
          pageCount+=1;

        var indexarray=[];
        for(var i=1;i<=pageCount;i++){
            indexarray.push(i);
        }

        async.mapLimit(indexarray,querylimit,module.exports.getno,function(err,results){
            for(var i=0;i<results.length;i++){
                allcodes= allcodes.concat(results[i]);
            }


            callback(null,allcodes);
        })



    });

};



nohelper.prototype.getno=function(index,callback){

    var fun=function (n) {
        var url="/stockpick/cache?token=" +token
            +"&p=" +index +
            "&perpage=" +
            percount +
            "&showType=[%22%22,%22%22,%22onTable%22,%22onTable%22,%22onTable%22,%22onTable%22]";

        var  options = {
            hostname:'www.iwencai.com',
            port: 80,
            method: 'get',
            path: url,
            KeepAlive: true,
            headers: {
                'Connection':"keep-alive",
                'Host':"www.iwencai.com",

                "User-Agent":'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.75 Safari/537.36',
                'Cookie':'PHPSESSID=8kj3mqbbsij14id6f3403u03f1; v=AsnAGHLn926_m4sa8g40WcE62P4nFr1IJwrh3Gs_RbDvsudos2bNGLda8ar7; cid=nc6hgumel0h6oscbpn8fhibtf31497502968; ComputerID=nc6hgumel0h6oscbpn8fhibtf31497502968'
            }
        };

        http.get(options,function(resp){
            var length=0;
            var chunks=[];
            resp.on("data",function(chunk){
                length+=chunk.length;
                chunks.push(chunk);
            })

            resp.on("end",function(){
                var buf=Buffer.concat(chunks,length);
                //console.log(buf.toString())
                var temp="";
                try {
                    temp=JSON.parse(buf.toString().toLowerCase());
                }catch(e) {
                    setTimeout(function(){
                        if(n>0){
                            fun(n-1);
                        }
                        else throw e;
                    } ,200)
                    return;
                }
                var result=[];
                for(var i=0;i<temp.result.length;i++){
                    if(temp.result[i][5]=="--") continue;
                    var codestr=temp.result[i][0].toString();
                    codestr=codestr.replace(".sz","");
                    codestr=codestr.replace(".sh","");
                    if(temp.result[i][8]=='--')temp.result[i][8]=0;
                    result.push({no:codestr,
                        date:module.exports.currentDate,
                        state:0,
                        index:i,

                        //lastprice:Number(temp.result[i][2])  ,//现价
                        dde:Number(temp.result[i][4])  ,//dde 尽量
                        dde_b:Number(temp.result[i][6])  ,//dde 买入（w）
                        dde_s:Number(temp.result[i][7])  ,//dde 卖出（w）
                        mainforce:Number(temp.result[i][8]) ,//主力流向（w）
                        ud:Number(temp.result[i][5]) });//涨跌 （元）

                }
                if(callback)
                    setTimeout(function(){callback(null,result)} ,200)

            })
        })


    }

    fun(5);
}

nohelper.prototype.getToken=function(date,callback){
    //var url="http://www.iwencai.com/stockpick/search?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=%E5%87%80%E9%87%8F";
    // var url='/stockpick/search?typed=1&preParams=&ts=1&f=3&qs=pc_%7Esoniu%7Estock%7Estock%7Ehistory%7Equery&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=dde' +
    //     date +
    //     '+%E6%B6%A8%E8%B7%8C' +
    //     date;
   var url= 'http://www.iwencai.com/stockpick/load-data?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=dde' +
       date +
       '+%E6%B6%A8%E8%B7%8C' +
       date +
       '+%E4%B8%BB%E5%8A%9B' +
       date +
       '&queryarea='
   // url='/stockpick/search?typed=1&preParams=&ts=1&f=3&qs=pc_%7Esoniu%7Estock%7Estock%7Ehistory%7Equery&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=dde2017-07-25+%E6%B6%A8%E8%B7%8C2017-07-25';
    var length=0;
    var chunks=[];
    var  options = {
        hostname:'www.iwencai.com',
        port: 80,
        method: 'get',
        path: url,
        KeepAlive: true,
        ondata:function (chunk) {
            length+=chunk.length;
            chunks.push(chunk);



        },
        headers: {
            'Connection':"keep-alive",
            'Host':"www.iwencai.com",

            "User-Agent":'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.75 Safari/537.36',
            'Cookie':'PHPSESSID=8kj3mqbbsij14id6f3403u03f1; v=AsnAGHLn926_m4sa8g40WcE62P4nFr1IJwrh3Gs_RbDvsudos2bNGLda8ar7; cid=nc6hgumel0h6oscbpn8fhibtf31497502968; ComputerID=nc6hgumel0h6oscbpn8fhibtf31497502968'
        }
    };

    tools.HttpRequest(options,function (err,r) {
        var buf=Buffer.concat(chunks, length);
        var str= buf.toString();
        str=str.substring(str.indexOf("var allResult ="));
        str=str.substring(str.indexOf("{"),str.indexOf(";\n"));
        var temp=JSON.parse(str);
        if(callback)callback(null,temp);
    })

    return;

   // url+="涨跌";
   http.get(options,function(resp){
       var length=0;
       var chunks=[];
       resp.on("data",function(chunk){
           length+=chunk.length;
           chunks.push(chunk);
       });
       resp.on("end",function(){
           var buf=Buffer.concat(chunks, length);
           var str= buf.toString();
           var $= cheerio.load(str);
           str=str.substring(str.indexOf("var allResult ="));
           str=str.substring(str.indexOf("{"),str.indexOf(";\n"));
           var temp=JSON.parse(str);

           if(callback)callback(null,temp);
       })
   })
}

nohelper.prototype.savenofile=function(items,callback){
    fs.writeFile(path.join(__dirname, 'history/'+global.datestr), JSON.stringify(items), function (err) {
        if(callback){
            callback(err);
        }
    });

}

nohelper.prototype.getwebDates=function(start,callback){
   // start="2017-01-25";
    var uri="http://quotes.money.163.com/service/chddata.html?code=0000001&start=" +
        new Date(start).toFormat("YYYY-MM-DD").replace(/-/g,"")+
        "&end=" +
        new Date(global.datestr).toFormat("YYYY-MM-DD").replace(/-/g,"")+
        "&fields=TCLOSE;HIGH;LOW;TOPEN;LCLOSE;CHG;PCHG;VOTURNOVER;VATURNOVER";

    var file="./datafiles/sh000001.xls";
    var stream = fs.createWriteStream(file);
    request(uri).pipe(stream).on('close', function(err,result){
        fs.readFile(file, function (err,bytesRead) {
            var dates=[];
            var strs= bytesRead.toString("utf8").split("\r\n");
            for (var i=strs.length-1;i>=1;i--){
                var temp=strs[i].split(',');
                if(temp.length>2) dates.push(temp[0]);
            }
            callback(null,dates)
        });
    });

}

nohelper.prototype.getallnofromlocal=function(datestr, callback){
    fs.exists(path.join(__dirname, 'history/'+datestr),function(exist){
        if(exist){
            fs.readFile(path.join(__dirname, 'history/'+datestr), function (err,bytesRead) {
                callback(err,JSON.parse( bytesRead.toString()))
            });
        }
        else {
            callback(1,null);
        }
    })
}

nohelper.prototype.getallno=function(date,getallnocallback){
    dbsuport.getfaces({date:date},function(err,items){
        var temps=[];
        if(err==null&&items&&items.length>0){

            //var temps=[];
            //var obj={};
            //items.forEach(function(d,i){
            //    obj[d.no]=d;
            //})
            //
            //module.exports.getallnofromweb(date,function(err,webitems){
            //
            //    webitems.forEach(function(d,i){
            //        if(obj[d.no])
            //            temps.push(obj[d.no]);
            //        else
            //            temps.push(d)
            //    })
            //    getallnocallback(err,temps);
            //});

            getallnocallback(err,items);

        }
        else
            setTimeout(function (args) {
                getallnocallback("获取出错",null);
            },500)
        // module.exports.getallnofromweb(date,function(err,items){
        //     if(err)getallnocallback("获取出错",null);
        //     else{
        //         dbsuport.savecodefaces(items,function(err,result){
        //             getallnocallback(null,items);
        //         })
        //     }
        // })
    })
}




module.exports=new nohelper();

// module.exports.getToken("2017-01-23",function (a,ba) {
//
// })

//global.datestr="2017-01-26"
//module.exports.getwebDates("2017-01-23")