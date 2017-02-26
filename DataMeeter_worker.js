/**
 * Created by LYH on 2017/2/6.
 */
var async=require("async");
var nohelper = require('./nohelper.js');
var dbsuport = require('./MYSQLDBSuport.js');
var tool = require('./tools.js');
//var xls_tool = require('./xlstool.js');
var xls_tool = require('xls-to-json');
var  process = require('process');
var fs= require('fs');

var worker=function(){}
worker.prototype.isworking=false;
worker.prototype.console=function(item){
    if(process.send)
        module.exports.sendMsg(item,"console");
    else
        console.log(item);
}

worker.prototype.sendMsg=function(msg,type){
    process.send(JSON.stringify({
        id:process.pid,
        type:type,
        msg:msg
    }));
}

worker.prototype.saveToDb=function(item,allcallback){
    dbsuport.getcodeface(item.no,item.date,function(err,face){
        if(face&&face.state){
            module.exports.console(item.no+ ": 已保存");
            allcallback(0,true);
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
                   // module.exports.console( item.no+" 保存失败");
                    allcallback(0,1);
                }
                else {
                    //module.exports.console( item.no+" 保存成功");
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

worker.prototype.getValuesFromfile=function(item,allcallback){
    if(!(item.no&&item.date)){
        allcallback(null,null);
        return;
    }
    var file=item.file;
    fs.exists(file,function(exist){
        if(exist){

            try {
                xls_tool({
                    input: file,
                    output:null
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
						if(items.length>0)
                        item.lastprice=items[items.length-1].price;
					    else item.lastprice=0;
                        fs.unlink(file);
                        allcallback(0,items)
                    }
                });
            }
            catch (ex){
                fs.unlink(file);
                module.exports.console(ex.toString())
                module.exports.console("删除文件："+file);
                allcallback(2,null)
            }

        }
        else {
            allcallback(1,null);
        }
    })
}

worker.prototype.start=function(){
    process.on("message",function(msg){
        //module.exports.console(msg);
        msg=JSON.parse(msg);
        var state="free";
        if(msg.type=="work"){
            var item=msg.item;
            if(item!=null){
                state="working";
                module.exports.saveToDb(item,function(err,result){
                    module.exports.sendMsg({
                        index:item.index,
                        result:err
                    },"result");
                });
            }
            module.exports.sendMsg(state,"state");
        }

    })

    module.exports.sendMsg("free","state");
}

module.exports=new worker();
module.exports.start();