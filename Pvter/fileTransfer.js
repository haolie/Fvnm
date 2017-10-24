var fs = require('fs');
var path = require('path');
var http = require('http');
var async=require("async");
var util = require('util');
var txclouder=require("../transfer/local/TXCloudSupporter.js");
var vmEncoder=require("../VMEncoder/build/Release/VMEncoder");
var cryptoObj = require('crypto');


var tempFilePath="./temp";
var encoderFun= vmEncoder();
var partSize=1024*1024*2;

var transfer=function () {

}

transfer.prototype.uploadFile=function(file,cloud,callback){
    var writeindex=0,readindex=0,rlen=0,writeState=0,readEnd=0,offsi=0,info,buffer=[];
    var writeFun=function () {
        if(writeState)return;
        writeState=1;

        fs.open(path.join(__dirname, 'temp/'+writeindex+".park"),"w+",function (err,fd) {
            var wlen=partSize;
            while (wlen>0){
                var cur=buffer[0];
                if(cur.length>wlen){
                    fs.writeSync(fd,cur,offsi,cur.length,partSize-wlen);
                    offsi=wlen;
                    wlen=0;
                }else {
                    fs.writeSync(fd,cur,offsi,cur.length,partSize-wlen);
                    wlen-=cur.length;
                    offsi=0;
                }
            }

            if(info.partNum==writeindex){
                callback(null,path.join(__dirname, 'temp/'))
                return;
            }
            writeState=0;
            if(writeindex<readindex) {
                writeindex+=1;
                writeFun();
            }
        })
    }

    createInfoJson(file,function (err,data) {
        info=data;
        var rs = fs.ReadStream(file.path);
        rs.on('data', function(d) {
            buffer.push(encoderFun(d));
            rlen+=d.length;
            if(rlen/partSize-1>readindex){
                readindex+=1;
                writeFun();
            }
        });

        rs.on('end', function() {
            readEnd=1;
            if(rlen/partSize>=readindex){
                readindex+=1;
                writeFun();
            }
            rs.close();
        });
    });


};

transfer.prototype.downFile=function(file,output,cloud,callback){
    createInfoJson(file,function (err,info) {
        var len=0;

    })

};

transfer.prototype.getCloudFiles=function (callback) {
    async.mapLimit(["PVter/P_V/","PVter/P_IMG/"],1,function (path,backA) {
        txclouder.getDirectories(path,function (err,list) {
            var infos=  getInfoFile(list);
            async.mapLimit(infos,1,function (info,mapcb) {
                tools.getHttpJson(info.access_url,mapcb)
            },backA)
        })
    },callback)
}

function getInfoFile(list) {
    var infos=[];
    for (var i=0;i<list.length;i++){
        if(list[i].children&&list[i].children.length)
            infos= infos.concat(getInfoFile(list[i].children));
        else if(list[i].name=="info.json") infos.push(list[i]);
    }

    return infos;
}

function createInfoJson(file,callback) {
    var o={
        name:"",
        size:file.size,
        key:"",
        partsize:partSize,
        partNum:0,
        level:1
    };

    if(file.size<=partSize)
        o.partNum=1;
    else {
        o.partNum=Math.floor(file.size/partSize);
        if(file.size%partSize)o.partNum+=1;
    }

    txclouder.getFileHash1(file.path,function (err,hash1) {
        o.key=hash1.hash1;
        callback(err,o);
    })
}



module.exports=new transfer();
// module.exports.uploadFile({ videofiles: [],
//     imagefiles: [],
//     dirs: [],
//     isfile: true,
//     type: 0,
//     path: 'D:\\BaiduNetdiskDownload\\VID20161008112853.mp4',
//     size: 41777122 },null,function () {
//
// })


//module.exports.getCloudFiles();

// var ta=new Uint8Array([8,8,8,8,8]);
// var tb=encoderFun(ta);
// var tc=encoderFun([8,8,8,8,8]);
// console.log(1212)