var fs = require('fs');
var path = require('path');
var http = require('http');
var async=require("async");
var util = require('util');
var txclouder=require("../transfer/local/TXCloudSupporter.js");
var vmEncoder=require("../VMEncoder/build/Release/VMEncoder");
var uuidV4 = require('uuid/v4');
var cloudRoot="PVter/P_V/";
var local=require('./localParker')
var tools =require('../tools');

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
                callback(0,cloudRoot+info.webname+"/"+f.name, f.size? f.size:0);
                uploading=0;
                fs.unlink(f.path,function(){
                    if(paths.length){
                        upload();
                    }else if(!spliting){
                        fs.rmdir(path.join(__dirname,tempFilePath+"/"+info.webname));
                        callback(1,null);
                    }
                });

            })
        }

        cloud.createDir(cloudRoot,info.webname,function(err,msg){
            fs.mkdirSync(path.join(__dirname,tempFilePath+"/"+info.webname))
            var infostr=JSON.stringify(info);
            var infopath=path.join(__dirname,tempFilePath+"/"+info.webname+"/"+"info.json");
            var strbuffer=new Buffer(infostr);
            strbuffer=new Buffer(encoderFun(strbuffer)) ;
            fs.writeFile(infopath, strbuffer,{flag:"w+"},function(err,r){
                paths.push({name:"info.json",path:infopath});
            });

            module.exports.splitFile(file,info,1,function(index,path,size){
                if(index>=0){
                    paths.push({name:info.subfilenames[index],path:path,size:size});
                    upload();
                }
                else{
                    spliting=0;
                }
            })
        })
    });


};

transfer.prototype.downFile=function(cfile,loacl,callback){
    var dir=loacl+"/"+cfile.webname,len= 0,writing=0;downing=1,bufs=[];
    fs.mkdirSync(dir);

    var buffer= new Buffer(JSON.stringify(cfile));
    fs.writeFileSync(dir+"/info.json",JSON.stringify(cfile) ,{flag:"w+"});
    fs.open(dir+"/"+cfile.webname+endname,"w+",function (err,fd) {
        var wfun=function(){
            if(bufs.length==0&&!downing){
                fs.close(fd);
                callback(1,len);
            }

            if(writing||bufs.length==0)return;
            writing=1;

            var cur= bufs.shift();
            cur=new Buffer(encoderFun( cur));
            fs.writeSync(fd,cur,0,cur.length,len);
            len+=cur.length;
            callback(0,len);
            writing=0;
            wfun();

        }

        async.mapLimit(cfile.subfilenames,1,function(f,mc){
            txclouder.downFile(cloudRoot+"/"+cfile.webname+"/"+f,function(data){
                bufs.push(data);
                wfun();
            },mc)
        },function(err,result){
            downing=0;
            wfun();
        })
    });

};


transfer.prototype.splitFile=function(file,info,encoder,callback){
    var writeindex=0,readindex=0,rlen=0,writeState=0,readEnd=0,offsi=0,buffer=[],wl= 0,outputpaths=[];
    var writeFun=function () {
        if(writeState)return;
        if(info.partNum==writeindex){
            if(callback)
                callback(-1,outputpaths,0);
            return;
        }else    if(writeindex>=readindex) {
            return
        }
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
            callback(writeindex-1,filepath,partSize-offsi);
            writeState=0;
            writeFun();
        })
    }

    var rs = fs.ReadStream(file.path);
    rs.on('data', function(d) {
        buffer.push(encoderFun(d));
        rlen+=d.length;
        if(rlen/partSize-1>readindex){
          //  console.log("rlen:"+rlen);
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
                tools.getHttpJson(info.access_url,mapcb,encoderFun)
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
        name:file.name,
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

    o.key=file.key;
    if(o.key)
        callback(0,o);
    else
    txclouder.getFileHash1(file.path,function (err,hash1) {
        o.key=hash1.hash1;
        callback(err,o);
    })
}

transfer.prototype.PVCheck=function (info,callback) {
    txclouder.GetFileStat(cloudRoot+info.webname+"/",function (err,star) {
        var names=[];
        star.forEach(function (item,index) {
            names.push(item.name);
        });

        var result=true;
        for(var i=0;i<info.subfilenames.length;i++){
            result&= names.indexOf(info.subfilenames[i])>-1;
        }
        if(!result)result=info;

        callback(0,result);

    })
}

function deleteNoInfo(callback) {
    txclouder.getDirectories(cloudRoot,function (err,list) {
        var infos=  getInfoFile(list);

        var nameObj={};
        list.forEach(function (item,ind) {
            nameObj[item.name]=1;
        })

        infos.forEach(function (item,index) {
            if(item.parent.name==undefined||item.parent.name=="undefined"){

            }
            else if(item.parent.name)
            nameObj[item.parent.name]=0;
        })

        infos=[];
        for(var i in nameObj){
            if(i=="undefined")
            {

            }
            else if(i&&nameObj[i]) infos.push(i);
        }

        async.mapLimit(infos,1,function (info,mapcb) {
           txclouder.deleteDir(cloudRoot+info,function (err,r) {
               if(!err) console.log("delete success:"+cloudRoot+info);
               else console.log("delete faild:"+cloudRoot+info);
               mapcb(0,r);
           });
        },callback)
    })
}


        module.exports=new transfer();

// module.exports.PVCheck({
//     "name": "6A2B.tmp",
//     "webname": "00bcdf24-7332-4ad8-be12-4b95d8e44f8f",
//     "size": 7663992,
//     "key": "37dd61b6ee33ad63df5c8835c9ad706d9bf58ed4",
//     "partsize": 2097152,
//     "partNum": 4,
//     "subfilenames": [
//         "0.park",
//         "1.park",
//         "2.park",
//         "3.park"
//     ],
//     "level": 1
// },function (err,rsult) {
//
// })
//         module.exports.getCloudFiles(function (err,a) {
//             async.mapLimit(a[0],1,function (item,mb) {
//                 module.exports.PVCheck(item,mb)
//             },function (err,r) {
//                 console.log(r)
//             })
//
//         })

// txclouder.deleteDir("PVter/test",function (a,b) {
//
// })
var updataS=0;
 //module.exports.uploadFile( { videofiles: [],
 //    imagefiles: [],
 //    dirs: [],
 //    isfile: true,
 //    type: 0,
 //    path: 'D:\\TDDOWNLOAD\\2016年3月16日\\3146.tmp',
 //    size: 1522878,
 //    name: '3146.tmp' },txclouder,function (isend,result,size) {
 //
 //    if(isend){
 //        console.log("update: completed ")
 //    }
 //    else {
 //        updataS+=size;
 //        console.log("update:"+(updataS/18268945)*100+"%")
 //    }
 //
 //})

// var ta=new Uint8Array([8,8,8,8,8]);
// var tb=encoderFun(ta);
// var tc=encoderFun([8,8,8,8,8]);
// console.log(1212)

deleteNoInfo()