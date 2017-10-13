/**
 * Created by LiuYouhao on 2017/7/7.
 */
var dbsupport= require('./../MYSQLDBSuport.js');
var dateutil = require('date-utils');
var bufszie=30;

An=function(){}
var current=module.exports=new An();

An.prototype.init=function(app,callback){
    current.app=app;
    dbsupport.getfaces({no: global.shcode},function(err,result){
        if(err) {
            console.log("获取日期字典错误！");
            return;
        }
        current.dateMap={};
        result.forEach(function(d,i){
            current.dateMap[d.date]=d;
        })

        callback();
    })
}

An.prototype.checkTail=function (item){
    var start=item.lastprice-item.ud;
    var end=item.lastprice;

    var feet=Math.min(start,end);
    var life=Number(item.max)-Number(item.min);
    var tailper=(life*0.75)+item.min;

    return feet>=tailper;
}


An.prototype.analis=function(option,callback){
    if(!current.dateMap[option.date]) return callback("日期不可用",null);
    var after=new Date(option.date);
    after=after.add("d",1).toFormat("YYYY-MM-DD");
    if(!current.dateMap[after])return callback("日期不可用",null);

    dbsupport.getfaces({start:option.date,end:after},function(err,items){
        if(err) return callback(err,items);

        var curobj={};
        //obj[option.date]={date:option.date,items:[]};
        //obj[after]={date:after,items:[]};
        var aftobj={}

        items.forEach(function(d,i){

            if(d.no==global.shcode)return;
            if(d.date==option.date) curobj[d.no]=d;
            else if(d.date==after)
                aftobj[d.no]=d;
        })

        var result={uper:[],low:[] };
        for(var i in curobj){

            if(!aftobj[i]) continue;
           if(!current.checkTail(curobj[i]))continue;


            if( ((aftobj[i].max-curobj[i].lastprice)/curobj[i].lastprice)>0.005 ){
                result.uper.push(curobj[i]);
            }
            else
                result.low.push(curobj[i]);
        }

        callback(0,result);
    })

}

An.prototype.getPriceInDate=function(date,no,callback){
    if(!current.dateArray) current.dateArray=[];
    current.dateArray.forEach(function(item,i){
        if(item.date==date&&item.no==no) {
            current.dateArray.splice(i,1);
            current.dateArray.push(item);
            return callback(1,item)
        }
    })

    dbsupport.getValueByDayNo({date:date,no:no},function(err,result){
        if(err) return callback(err,null);
        var temp= {
            date:date,
            no:no,
            values:result,
        }  ;
        current.dateArray.push(temp);
        if(current.dateArray.length>bufszie)current.dateArray.pop();
        callback(err,temp);
    })
}

current.init(null,function(){
    current.analis({date:"2017-07-04"},function(err,result){

    })
})



