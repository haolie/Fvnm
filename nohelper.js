/**
 * Created by LYH on 2016/10/10.
 */
var http = require('http');
var async=require("async");
var percount=50;
var token="";
var fs= require('fs');
var path = require('path');
var dbsuport = require('./MYSQLDBSuport.js');
var request=require('request');
var querylimit=1;

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
        pageCount=Math.floor(tokenObj.code_count/70);
        if(Math.floor(tokenObj.code_count%70)>0)
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
    var url="http://www.iwencai.com/stockpick/cache?token=" +token
        +"&p=" +index +
        "&perpage=" +
        percount +
        "&showType=[%22%22,%22%22,%22onTable%22,%22onTable%22,%22onTable%22,%22onTable%22]";

    http.get(url,function(resp){
        var length=0;
        var chunks=[];
        resp.on("data",function(chunk){
            length+=chunk.length;
            chunks.push(chunk);
        })

        resp.on("end",function(){
            var buf=Buffer.concat(chunks,length);
            //console.log(buf.toString())
            var temp=JSON.parse(buf.toString().toLowerCase());

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
            setTimeout(callback(null,result),500)

        })
    })
}

nohelper.prototype.getToken=function(date,callback){
    //var url="http://www.iwencai.com/stockpick/search?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=%E5%87%80%E9%87%8F";
    var url="http://www.iwencai.com/stockpick/search?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=dde" +
       date+ "+%E6%B6%A8%E8%B7%8C";
    url+=date;
   // url+="涨跌";
   http.get(url,function(resp){
       var length=0;
       var chunks=[];
       resp.on("data",function(chunk){
           length+=chunk.length;
           chunks.push(chunk);
       });
       resp.on("end",function(){
           var buf=Buffer.concat(chunks, length);
           var str= buf.toString();



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
        new Date(start).toLocaleDateString().replace(/-/g,"")+
        "&end=" +
        new Date(global.datestr).toLocaleDateString().replace(/-/g,"")+
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
            for(var i=0;i<items.length;i++){
                if(temps.no==global.shcode) continue;
                items[i].index=i;
                items[i].savestate=-1;
                temps.push(items[i]);
            }

            getallnocallback(err,items);
        }
        else
        module.exports.getallnofromweb(date,function(err,items){
            if(err)getallnocallback("获取出错",null);
            else{
                dbsuport.savecodefaces(items,function(err,result){
                    for(var i=0;i<items.length;i++){
                        items[i].index=i;
                        items[i].savestate=-1;
                    }
                    getallnocallback(null,items);
                })
            }
        })
    })
}


module.exports=new nohelper();
//global.datestr="2017-01-26"
//module.exports.getwebDates("2017-01-23")