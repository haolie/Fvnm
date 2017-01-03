
var mysql = require('mysql');
var http = require('http');
var async=require("async");
var url=require("url");
var tool = require('./tools.js');

var codeface="codeface";
var time_price="time_price";
var  process = require('process');


var suporter=function(){}

suporter.prototype.connction=null;
suporter.prototype.getConnction=function(callback){
    if(module.exports.connction==null){
        module.exports.connction=mysql.createConnection({
            host:'localhost',
            user:'mysql',
            //password:'123456',
            database:'finance',
            useConnectionPooling: true
        });
        module.exports.connction.connect(function(a,b){
            callback(null,module.exports.connction);
        });
    }
    else
    callback(null,module.exports.connction);
}

suporter.prototype.getInsertStr=function(item){
    return '(' +
        (1000000+Number(item.no))+','+
        '"'+tool.convertToTIMESTAMP( item.time)+'"' +','+
        (item.price*100)+','+
        item.trade_type+','+
        (item.turnover_inc/100)+','+
        (item.volume/100)+
        ')';
}

suporter.prototype.saveTimePrice=function(timevalues,allcallback){
    if(timevalues==null||timevalues.length==0){

        if(allcallback)allcallback(1,"");
        return;
    }

    var lists=tool.getSpiedList(timevalues,600);

    module.exports.getConnction(function(err,conn){
        if(err==null){

            async.mapLimit(lists,1,function(items,callback){
               var insert='INSERT INTO time_price(no,time,price,trade_type,turnover_inc,volume) VALUES' ;
                   for (var i in items){
                       insert+=module.exports.getInsertStr(items[i]);
                       if(i==items.length-1) insert+=';';
                       else insert+=',';
                   }
                conn.query(insert,function(err,result){
                    callback(err,insert);
                })
            },function(err,result){
                if(allcallback)allcallback(err,"");
            })
        }
        else {
            if(allcallback)allcallback(null,"");
            console.log("数据库连接失败");
        }
    });
};


suporter.prototype.getValueByDayNo=function(item,callback){
    item.date.setHours(0);
    item.date.setMinutes(0);
    item.date.setMilliseconds(0);
    var filter={
        "no":item.no,
        //"time":{$gt:item.date.getTime(),$lte: item.date.getTime() + 1 * 24 * 60 * 60 * 1000}
        "time":{$gt:item.date.getTime()/1000,$lte: item.date.getTime()/1000 + 1 * 24 * 60 * 60 }
    }

    MongoClient.connect(dburl, function(err, db) {


        if(err){
            callback(err,0);
        }
        else {
            db.collection(time_price).find(filter).toArray(function(err,r){
                db.close();
                callback(err,r);
            })

        }

    });

}

suporter.prototype.checkCount=function(item,callback){
    MongoClient.connect(dburl, function(err, db) {
        var filter={
            "no":item.no,
            "time":{$gte: Number(item.start),$lte: Number(item.end)},

            //"_id":item.no+"_"+item.start,1477359297
            //"time":{$gte:1477357237},
            //"time":{$gte:1477359297},
            //"price":4.5
        };

        if(err){
            callback(err,0);
        }
        else {
            db.collection("time_price").find(filter).count(callback)
        }
        db.close();
    });
}

suporter.prototype.saveCodes=function(codes,callback){
    MongoClient.connect(dburl, function(err, db) {
        var codetable=db.collection("codelist");

        codetable.removeMany({},function(err,remove){
            list=module.exports.getSpiedList(codes,888,0,function(code){return{no:code}});

            async.mapSeries(list,function(item,call){
                codetable.insertMany(item,call)
            },function(err,result){
                db.close();
               if(callback) callback(null,codes.length);
            });
        });

    });
}

suporter.prototype.getAllCodes=function(callback){
    MongoClient.connect(dburl, function(err, db) {
        var codetable=db.collection("codelist");

        codetable.find().toArray(function(err,result){

            var codes=[];
            for(var i=0;i<result.length;i++){
                codes.push(result[i].no);
            }

            db.close();
            callback(null,codes);
        })

    });
}

suporter.prototype.removeCodes=function(codes,callback){
    MongoClient.connect(dburl, function(err, db) {
        var codetable=db.collection("codelist");
        async.mapSeries(codes,function(item,call){
            codetable.removeOne({"no":item},call);
        },function(err,result){
            db.close();
           if(callback) callback(err,result);
        });
    });
}


suporter.prototype.transData=function(code,callback){

}

suporter.prototype.getfaces=function(item,callback){

    module.exports.getConnction(function(err, conn) {
        var str="SELECT * FROM codeface where ";
        if(item.date&&item.no){
            str+="_no="+item.no;
            str+=" and _date='"+item.date+"';";
        }
        else if(item.no){
            str+="_no="+item.no;
        }
        else if (item.date){
            str+="_date='"+item.date+"';";
        }


        conn.query(str,function(err,results){
            var items=[];
            if(results&&results.length)
            for(var i in results){
                items.push({
                    no:results[i]._no,
                    date:results[i]._date,
                    min:results[i]._min,
                    max:results[i]._max,
                    ud:results[i].ud,
                    lastprice:results[i].lastprice,
                    face:results[i].face,
                    dde_b:results[i].dde_b,
                    dde_s:results[i].dde_s,
                    mainforce:results[i].mainforce,
                    state:results[i]._state,
                });
            }

            callback(err,items);
        })
    });
}


suporter.prototype.getcodeface=function(code,date,callback){
    module.exports.getfaces({no:code,date:date},function(err,items){
        if(items&&items.length>0)
           callback(0,items[0]);
        else
           callback(0,null);
    })
}

suporter.prototype.getValueSql=function(o,str,_default){
    if(_default==undefined)_default=0;
    var temp=o[str];
    if(temp==undefined)
        return _default;
    return temp;
}

suporter.prototype.savecodefaces=function(items,callback){
    if(!(items instanceof Array)) items=[items];
    var lists=tool.getSpiedList(items,600);

    module.exports.getConnction(function(err,conn){
        async.mapLimit(lists,1,function(list,mapcallback){
           var str="INSERT INTO codeface(_no,_date,_min,_max,ud,lastprice,face,dde,dde_b,dde_s,mainforce,_state)" +
                " VALUES" ;
            for (var i in list){
                item=list[i];
                str+='(' +
                    (Number(item.no) +1000000)+','+
                    '"'+ item.date+'"'+','+
                    (module.exports.getValueSql(item,'min')*100)+','+
                    (module.exports.getValueSql(item,'max')*100)+','+
                    (module.exports.getValueSql(item,'ud')*100) +','+
                    (module.exports.getValueSql(item,'lastprice')*100) +','+
                    module.exports.getValueSql(item,'face') +','+
                    module.exports.getValueSql(item,'dde') +','+
                    module.exports.getValueSql(item,'dde_b') +','+
                    module.exports.getValueSql(item,'dde_s') +','+
                    module.exports.getValueSql(item,'mainforce') +','+
                    module.exports.getValueSql(item,'state') +')';
                if(i==list.length-1) str+=';';
                else str+=',';
            }
            conn.query(str,function(err,result){
                mapcallback(err,str);
            })
        },function(err,result){
            if(callback)callback(err,result);
        });
    });

}

suporter.prototype.updatacodeface=function(item,callback){
    module.exports.getcodeface(item.no,item.date,function(err,face){
        module.exports.getConnction(function(err,conn){
            var str='';
            if(face){

            }
            else {
                module.exports.savecodefaces(item,callback);
            }
        })

    });

}


suporter.prototype.test=function(){

module.exports.getcodeface("300469","2016-12-19",function(a,b){

})


}

module.exports=new suporter();
//module.exports.test();