/**
 * Created by LYH on 2016/10/10.
 */
var http = require('http');
var async=require("async");
var percount=70;
var token="";
var fs= require('fs');
var path = require('path');

var nohelper=function Nohelper(){}

nohelper.prototype.getallnofromweb=function(callback){
    var index=1;
    var pageCount=0;
    var allcodes=[];
    this.getToken(function(err,tokenObj){
        token=tokenObj.token;
        pageCount=Math.floor(tokenObj.code_count/70);
        if(Math.floor(tokenObj.code_count%70)>0)
          pageCount+=1;

        var indexarray=[];
        for(var i=1;i<=pageCount;i++){
            indexarray.push(i);
        }

        async.mapLimit(indexarray,5,module.exports.getno,function(err,results){
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
            var temp=JSON.parse(buf.toString().toLowerCase());
            var result=[];
            for(var i=0;i<temp.result.length;i++){
                var codestr=temp.result[i][0].toString();
                codestr=codestr.replace(".sz","");
                codestr=codestr.replace(".sh","");
                result.push({no:codestr,price:temp.result[i][2],ud:temp.result[i][4]});
            }
            if(callback)(callback(null,result));
        })
    })
}

nohelper.prototype.getToken=function(callback){
    var date=new Date();
    var datastr=date.getFullYear()+'.'+date.getMonth()+"."+date.getDate();
    //var url="http://www.iwencai.com/stockpick/search?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=%E5%87%80%E9%87%8F";
    var url="http://www.iwencai.com/stockpick/search?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=%E6%B6%A8%E8%B7%8C";
    //url+=datastr;
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

nohelper.prototype.getallno=function(getallnocallback){

    module.exports.getallnofromlocal(global.datestr,function(err,items){
        if(err==null)
            getallnocallback(err,items);
        else
        module.exports.getallnofromweb(function(err,items){
            if(err)getallnocallback("获取出错",null);
            else{
                module.exports.savenofile(items)
                getallnocallback(null,items);
            }
        })
    })
}


module.exports=new nohelper()