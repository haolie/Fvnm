/**
 * Created by LiuYouhao on 2017/6/26.
 */
var fs = require('fs');
var path = require('path');
var async=require("async");
//var cloudSurppoter= require('./TXCloudSupporter.js');
var dbsupport= require('./MYSQLDBSuport.js');
var cloudSurppoter= require('./QiNiuTranfer.js');
var tool = require('./tools.js');

var CM=function(){}

CM.prototype.exportFile=function(date,callback){
    dbsupport.getfaces({date:date},function(err,items){
        var str="";

        if(items.length){
            for(var d in items[0]){
                str+=d+" ";
            }
            str+=" \r\n";
        }

        items.forEach(function(item,i){
            if(item.no== global.shcode) return;

            for(var d in item){
                str+=item[d];
                str+=" ";
            }
            str+=" \r\n";
        })

        path="./../transferfiles/"+date;
        fs.writeFile(path, str, function (err) {
            if(callback){
                callback(err,path);
            }
        });

    })
}

CM.prototype.getCodesfromWeb=function(callback){
    cloudSurppoter.getWebDateItems("",callback);
}

CM.prototype.getDateItemfromWeb=function(item,callback){
    var local="./../transferfiles/"+item.date;
    cloudSurppoter.downDateItemFile(item,local,function(err,rt){
        if(err)return callback(err,[]);
        try {
            fs.readFile(local, function (err,bytesRead) {
                var string = bytesRead.toString();
                var strs= string.split('\r\n')
                var items=[];
                var temp=strs[0].trim().split(' ');
                var fds=temp;
                for (var i=1;i<strs.length;i++){
                     temp=strs[i].trim().split(' ');
                    var obj={};
                     for(var j in temp){
                         obj[fds[j]]=temp[j]
                     }
                    items.push(obj);
                }
                if(callback)callback(err,items);
            });
        }
        catch(ex){
            callback(1,null);
        }

    })
}

CM.prototype.startTransfer=function(progressCall){
    var progress={
        total:0,
        completed:false,
        curIndex:0,
        msg:""
    }

    var pcfun=function(err,msg){
        if(!progressCall) return;
        progress.msg=msg;
        progressCall(err,msg);
    }

    pcfun(0,"正在查询云存储记录……");
    module.exports.getCodesfromWeb(function(err,items){
        if(err) {
            pcfun(1,"传输终止：查询远程记录出错，请检查网络通信！");
            return;
        }

        var obj={};
        items.forEach(function(item){  if(item.state) obj[item.date]=item;  });
        pcfun(0,"正在查询本地数据……");
        dbsupport.getfaces({no:global.shcode},function(err,items){
            var temps=[];
            items.forEach(function(item,i){
                if(!obj[item.date]) temps.push(item);
                else if(obj[item.date].state<item.state){
                    item.replace=1;
                    temps.push(item);
                }
            })

            if(temps.length==0){
                progress.completed=1;
                progress.msg="没有需要保存到云存储的数据";
                progressCall(0,progress);
            }
            progress.total=temps.length;
            async.mapLimit(temps,1,function(item,saveCallBack){
                module.exports.exportFile(item.date,function(err,rt){
                    if(err){
                        progress.msg="导出数据失败";
                        saveCallBack(err,rt);
                        return;
                    }
                    cloudSurppoter.uploaDateFile(item,rt,function(err,t){
                        progress.curIndex+=1;
                        progress.msg=item.date+ ":数据保存成功   " +progress.curIndex+"/"+progress.total ;
                        fs.unlink(rt,function(){
                            progressCall(0,progress);
                            saveCallBack(err,t);
                        });
                    });


                    //saveCallBack(err,rt);
                })
            },function(err,results){
                progress.completed=1;
                progressCall(0,progress);
            });
        });

    });


}



var current=module.exports=new CM();
//current.startTransfer(function(err,progress){
//    tool.console(progress.msg);
//    if(progress.completed)
//       tool.console("数据保存已完成")
//})


module.exports.getCodesfromWeb(function(err,items){
    current.getDateItemfromWeb(items[0],function(err,ls){

    })
});