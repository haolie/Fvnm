var fs = require('fs');
var path = require('path');
var http = require('http');
var async=require("async");
var util = require('util');
var txclouder=require("../transfer/local/TXCloudSupporter.js");
var vmEncoder=require("../VMEncoder/build/Release/VMEncoder");
var uuidV4 = require('uuid/v4');
var cloudRoot="PVter/P_V/"

var tempFilePath="./temp";
var endname=".park";
var encoderFun= vmEncoder();
var partSize=1024*1024*2;

var transfer=function () {

}
/*
* 上传文件
* */
transfer.prototype.uploadFile=function(file,cloud,callback){
    createInfoJson(file,function (err,info) {
        var paths=[],spliting= 1,uploading=0;
        var upload=function(){
            if(uploading||!paths.length) return;
            uploading=1;
            var f=paths.shift();
            cloud.UploadFile(cloudRoot+info.webname, f.name, f.path,function(err,result){
                callback(0,cloudRoot+info.webname+"/"+f.name);
                fs.unlink(f.path);
                if(paths.length){
                    uploading=0;
                    upload();
                }else if(!spliting){
                    fs.rmdir(path.join(__dirname,tempFilePath+"/"+info.webname));
                    callback(1,null);
                }
            })
        }

        cloud.createDir(cloudRoot,info.webname,function(err,msg){
            fs.mkdirSync(path.join(__dirname,tempFilePath+"/"+info.webname))
            var infostr=JSON.stringify(info);
            var infopath=path.join(__dirname,tempFilePath+"/"+info.webname+"/"+"info.json")
            fs.writeFile(infopath, infostr,{flag:"w+"},function(err,r){
                paths.push({name:"info.json",path:infopath});
            });

            module.exports.splitFile(file,info,1,function(index,path){
                if(index>=0){
                    paths.push({name:info.subfilenames[index],path:path});
                    upload();
                }
                else{
                    spliting=0;
                }
            })
        })
    });


};

transfer.prototype.downFile=function(file,loacl,cloud){
    createInfoJson(file,function (err,info) {
        var len=0;


    })

};


transfer.prototype.splitFile=function(file,info,encoder,callback){
    var writeindex=0,readindex=0,rlen=0,writeState=0,readEnd=0,offsi=0,buffer=[],wl= 0,outputpaths=[];
    var writeFun=function () {
        if(writeState)return;
        writeState=1;
        var filepath=path.join(__dirname,tempFilePath+"/"+info.webname+"/"+ info.subfilenames[writeindex]);
        fs.open(filepath,"w+",function (err,fd) {
            var wlen=partSize;
            while (wlen>0&&buffer.length){
                var cur=buffer[0];
                var buf = new Buffer(cur);

                if(cur.length>wlen){
                    fs.writeSync(fd,buf,offsi,cur.length,partSize-wlen);
                    offsi=wlen;
                    wl+=wlen;
                    wlen=0;
                }else {
                    fs.writeSync(fd,buf,offsi,cur.length,partSize-wlen);
                    wlen-=cur.length;
                    wl+=cur.length;
                    offsi=0;
                    buffer.shift();
                }
            }
            fs.close(fd);
            writeindex+=1;
            outputpaths.push(filepath);
            callback(writeindex-1,filepath)
            if(info.partNum==writeindex){
                if(callback)
                    callback(-1,outputpaths)
                return;
            }

            writeState=0;
            if(writeindex<readindex) {
                writeFun();
            }
        })
    }

    var rs = fs.ReadStream(file.path);
    rs.on('data', function(d) {
        buffer.push(encoderFun(d));
        rlen+=d.length;
        if(rlen/partSize-1>readindex){
            console.log("rlen:"+rlen);
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

};

/*
* 连接文件
* inpath：原文件路径
* outpath:输出路径
* isencode:是否加密
* callback(err,len)  len>0:完成文件长度  len<0  完成
* */
transfer.prototype.joinFile=function(inpath,outpath,isencode,callback){
    var files=fs.readdirSync(inpath);
    fs.open(outpath,"w+",function(err,fd){
transfer.prototype.downFile=function(file,output,cloud,callback){
    createInfoJson(file,function (err,info) {
        var len=0;
        var readfun=function(i){
            var rs = fs.ReadStream(inpath+"/"+files[i]);
            rs.on("data",function(data){
                data=encoderFun(data);
                fs.writeSync(fd,new Buffer(data),0,data.length);
                len+=data.length;
                if(callback)callback(0,len);
            })
            rs.on("end",function(){
                i+=1;
                if(i<files.length)readfun(i);
                else
                    fs.close(fd,function(){
                        if(callback)callback(0,-1);
                    });
            })
        }

        readfun(0);
    })
}

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
        webname:uuidV4(),
        size:file.size,
        key:"",
        partsize:partSize,
        partNum:0,
        subfilenames:[],
        level:1
    };

    if(file.size<=partSize)
        o.partNum=1;
    else {
        o.partNum=Math.floor(file.size/partSize);
        if(file.size%partSize)o.partNum+=1;
    }

    for(var i=0;i< o.partNum;i++){
        o.subfilenames.push(i+endname)
    }

    txclouder.getFileHash1(file.path,function (err,hash1) {
        o.key=hash1.hash1;
        callback(err,o);
    })
}



module.exports=new transfer();
module.exports.uploadFile({ videofiles: [],
    imagefiles: [],
    dirs: [],
    isfile: true,
    type: 0,
    path: 'D:\\BaiduNetdiskDownload\\VID20161008112853.mp4',
    size: 41777122 },null,function () {

})

// var ta=new Uint8Array([8,8,8,8,8]);
// var tb=encoderFun(ta);
// var tc=encoderFun([8,8,8,8,8]);
// console.log(1212)