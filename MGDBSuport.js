
var MongoClient=require('mongodb').MongoClient,assert=require("assert");
var dburl = 'mongodb://localhost:27017/finance';
var http = require('http');
var async=require("async");
var url=require("url");

var codeface="codeface";
var time_price="time_price";
var  process = require('process');


var suporter=function(){}

suporter.prototype.saveTimePrice=function(timevalues,allcallback){
    if(timevalues==null||timevalues.length==0){

        if(allcallback)allcallback(1,"");
        return;
    }
    MongoClient.connect(dburl, function(err, db) {
        if(err==null){
            var argslist=[];
            var index=0;
            while (true){
                var end=index+999;
                if(end>=timevalues.length-1){
                    argslist.push( timevalues.slice(index)) ;
                    break;
                }
                argslist.push( timevalues.slice(index,end)) ;
                index=end
            }

            async.mapSeries(argslist,function(item,callback){
                var collection=db.collection(time_price);

                collection.insertMany(item,function(err,result){
                    if(err){
                        console.log("数据保存失败");
                    }
                    if(callback)  callback(err,result);
                })
            },function(err,result){
                db.close();
                if(allcallback)allcallback(err,"");

            })
        }
        else {
            if(allcallback)allcallback(null,"");
            console.log("数据库连接失败");
        }

    });

};

suporter.prototype.CreateCollection=function(codes){

}

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
            db.close();
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

suporter.prototype.getConnction=function(callback){
    MongoClient.connect(dburl, callback);
}

suporter.prototype.transData=function(code,callback){

}

suporter.prototype.getcodeface=function(code,date,callback){


    MongoClient.connect(dburl, function(err, db) {
        var cl=db.collection(codeface);
        //process.send("db:"+cl!=null);
        cl.find({_id:code+'_'+date}).toArray(function(err,result){
            db.close();
            if(err||  result.length==0)
                callback(err,null);
            else
                callback(err,result[0]);
        });
    });
}

suporter.prototype.updatacodeface=function(item,callback){

    try {
        MongoClient.connect(dburl, function(err, db) {
            var cl=db.collection(codeface);
            cl.find({_id:item._id}).toArray(function(a,b){
                if(b.length>0){
                    cl.updateOne({_id:item._id},{$set:item},function(err,result){
                        db.close();
                        var rt=null;
                        if(result.length>0)
                           rt=result[0];

                        if(callback)callback(err,rt);
                    });
                }else {
                    cl.insertOne(item,function(a,b){
                        db.close();
                        if(callback)callback(err,b);
                    });
                }
            })


        });
    }catch(ex) {

    }

}

suporter.prototype. getSpiedList=function(array,percount,listcount,enfun){
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

suporter.prototype.test=function(){

    //var item={};
    //item.no="600149";
    //item.date=new Date("2016-12-13")
    //module.exports.getValueByDayNo(item,function(er,result){
    //
    //})

    process.send("121");

    process.exit();
    http.createServer(function (req, res) {

        args= url.parse(req.url,true).query;
        if(args==null||args.no==null||args.no==""||args.date==null||args.date.length==0){

            res.end("formate error");
            return
        }

        var item={};
        item.no=args.no;
        item.date=new Date(args.date)
        module.exports.getValueByDayNo(item,function(er,result){
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(JSON.stringify(result));
        })

        //res.writeHead(200, {'Content-Type': 'text/plain'});
        //
        //res.end('Hello World\n');

    }).listen(12122);
    //console.log('Server running at http://



}

module.exports=new suporter();
//module.exports.test();
