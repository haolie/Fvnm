/**
 * Created by youhao on 2017/1/1.
 */
var util = require('util');
var http = require('http');
var fs = require('fs');

var tool=function(){}

tool.prototype.getSpiedList=function(array,percount,listcount,enfun){
    if(percount==0&&listcount==0)return null;

    if(percount==0){
        percount=Math.floor(array/listcount);
    }

    var result=[new Array()];
    var index=0;
    while (index<array.length){
        var temp=result[result.length-1];
        if(temp.length>=percount){
            temp=[];
            result.push(temp);
        }

        if(enfun)temp.push(enfun(array[index]));
        else
            temp.push(array[index]);
        index++;
    }

    return result;
}

tool.prototype.convertToTIMESTAMP=function(time){
    var date=new Date(time*1000);
    return date.getFullYear()+"-"+
        (date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}



Date.prototype.add = function (part, value) {
    value *= 1;
    if (isNaN(value)) {
        value = 0;
    }
    switch (part) {
        case "y":
            this.setFullYear(this.getFullYear() + value);
            break;
        case "m":
            this.setMonth(this.getMonth() + value);
            break;
        case "d":
            this.setDate(this.getDate() + value);
            break;
        case "h":
            this.setHours(this.getHours() + value);
            break;
        case "n":
            this.setMinutes(this.getMinutes() + value);
            break;
        case "s":
            this.setSeconds(this.getSeconds() + value);
            break;
        default:

    }

    return this;
}

tool.prototype.console = function (item) {
    if(!item) return;
    if(typeof item=="object") item=JSON.stringify(item);

    if (process.send)
        module.exports.sendMsg(item, "console");
    else
        console.log(item);
}

tool.prototype.getHttpJson=function (url,callback,encodeFun) {
    http.get(url,function (res,b) {
        var resData = "";
        res.on("data",function(data){
            if(encodeFun) {
                data=encodeFun(data);
                data=new Buffer(data);
            }
            resData += data;
        });
        res.on("end", function() {
            try {
                callback(null,JSON.parse(resData));
            }
            catch (ex){
                callback(1,null);
            }

        });
    })
}

tool.prototype.HttpRequest=function(option,callback){
    var str="get";
    if(option.method=="POST") str="request";

    var request= http[str](option,function (res){
        var length=0;
        var chunks=[];
        res.on('error', function (chunk) {
            callback(1, null);
        });
        var ondata=function (chunk) {
            length+=chunk.length;
            chunks.push(chunk);
        };
        if(option.ondata) ondata=option.ondata;
        res.on('data',ondata);
        res.on('end', function (dd) {
            if(option.ondata) return callback(0,null);

            var buf=Buffer.concat(chunks, length);
            var str  =buf.toString()
            try {
                var result=JSON.parse(str);
                callback(0,result);
            }catch (ex){
                console.log(ex);
                callback(1,null);
            }
        });
    })

    request.on("error",function(err){
        callback(1, null);
    })

    return request;

}

tool.prototype.HttpDownFile=function(url,output,callback){
    try {
        var request= http.get(url,function (res){
            var  out=null;
            if(module.exports.isFunction(output))
                out=output
            else{
                out= fs.createWriteStream(output)
            }

            res.on('error', function (chunk) {
                callback(1, "请求出错！");
            });
            res.on('data',module.exports.isFunction(output)? output:function(data){
                out.write(data);
            });
            res.on('end', function (dd) {
                if(module.exports.isFunction(output)){
                    callback(0,"")
                }
                else
                out.end(function(){
                    callback(0,"")
                })
            });
        })

        request.on("error",function(err){
            callback(1, "请求出错");
        })
    }catch (ex ){
        callback(1, ex);
    }
}

tool.prototype.isArray=function (array) {
    return Object.prototype.toString.call(arr) === '[object Array]';
}

tool.prototype.isString=function (str) {
    return typeof str==="string";
}

tool.prototype.isObject=function (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

tool.prototype.isNumber=function (num) {
   return typeof num==="number";
}

tool.prototype.isFunction=function (obj) {
    return Object.prototype.toString.call(obj) ==="[object Function]";
}

//tool.prototype.getDateStr=function(obj){
//    if(util.isString(obj)){
//        return obj;
//    }
//}


module.exports=new tool();