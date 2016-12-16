/**
 * Created by LYH on 2016/10/10.
 */
var http = require('http');
var async=require("async");
var percount=70;
var token="";

var nohelper=function Nohelper(){}

nohelper.prototype.getallno=function(callback){
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
                result.push(codestr);
            }
            if(callback)(callback(null,result));
        })
    })
}

nohelper.prototype.getToken=function(callback){
    var date=new Date();
    var datastr=date.getFullYear()+'.'+date.getMonth()+"."+date.getDate();
    var url="http://www.iwencai.com/stockpick/search?typed=1&preParams=&ts=1&f=1&qs=result_rewrite&selfsectsn=&querytype=&searchfilter=&tid=stockpick&w=%E5%87%80%E9%87%8F";
    url+=datastr;
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

module.exports=new nohelper();