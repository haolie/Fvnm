var fs = require('fs');
var path = require('path');
var http = require('http');
var async=require("async");
var tools =require('../tools');

var baseUrl="http://sd.66avhd.com:9888/tp/11DD2E4A/SD/out";
var savePath="K:\\parker\\gun.m4";

var Gun=function () {

}

function createUrl(index){
    index=index.toString()
    while (index.length<3){
        index="0"+index;
    }
    return baseUrl+index+".ts";
}

Gun.prototype.Down=function (callback) {
    fs.open(savePath,"w+",function (err,fd) {
        var index=0,len=0;
        var fun=function () {
            tools.HttpDownFile(createUrl(index),function(data){
                fs.writeSync(fd,data,0,data.length,len);
                len+=data.length;
                callback(index,len);
            },function(err,rt){
                index+=1;
                if(err){
                    fs.close(fd);
                    callback(index,savePath);
                }
                else
                    fun();
            })
        }

        fun();
    })

}

var endname='.ts';
var partPath="D:\\TDDOWNLOAD\\ts2",vpath="D:\\TDDOWNLOAD\\ts1\\vt2.mp4";
Gun.prototype.gpor=function(callback){
    var files= fs.readdirSync(partPath);
    var temp=[];
    for(var i=0;i<files.length;i++){
        if(files[i].lastIndexOf(endname)==files[i].length-endname.length){
            var str=files[i];
            str= str.replace("index","");
            str=  str.replace(endname,"");
            temp.push({name:files[i],index:Number(str)});

        }
    }

    temp.sort(function(a,b){
        if(a.index< b.index) return -1;
        else  return 1;

    })

    fs.open(vpath,"w+",function(err,fd){
        var bufers=[],wlen= 0,reading= 1,writting=0;

        var wfun=function(){
            if(writting) return;
            if(!bufers.length){
                if(!reading){
                    fs.close(fd);
                    callback(-1,wlen)
                }
                return;
            }
            writting=1;

            var bf=bufers.shift();
            fs.writeSync(fd,bf,0,bf.length,wlen);
            wlen+=bf.length;
            callback(1,wlen);
            writting=0;
            wfun();
        }


    async.mapLimit(temp,1,function(item,mb){
        var rs = fs.ReadStream(partPath+"\\"+item.name);
        rs.on('data', function(d) {
            bufers.push(d);
            wfun();
        });

        rs.on('end', function(d) {
            mb(0,0);
        });

    },function(err,results){
        reading=0;
        wfun();
    })

    })
}

module.exports=new Gun();
module.exports.gpor(function(state,len){
    if(state<0){
        console.log("end");
    }else
    {
        console.log("index:"+state+"  len:"+ len);
    }
});
//module.exports.Down(function(err,leng){
//    console.log("index:"+err+"  len:"+ leng);
//
//})
