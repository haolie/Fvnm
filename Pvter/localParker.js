var fs = require('fs');
var path = require('path');
var http = require('http');
var async=require("async");
var util = require('util');

var vidoefiletypes=["temp","mp4","tmp"];
var imagefiletypes=["png","jpg","jpeg","gif"];

var parker=function () {

}

parker.prototype.LocalParkerPath="K:\\parker\\P_V";

parker.prototype.OutParkPaths=["D:\\TDDOWNLOAD"];

parker.prototype.OutParkVideo=[];

parker.prototype.OutParkImage=[];

parker.prototype.InitParker=function () {

}

parker.prototype.getOutParkerFiles=function (level) {
    var files=[];
    module.exports.OutParkPaths.forEach(function (t,i) {
        files.push(module.exports.getFileInfos(t,level))
    })

    return files;
}

parker.prototype.getFileInfos=function (path,level) {
    var fileInfo={
        videofiles:[],
        imagefiles:[],
        dirs:[],
        isfile:false,
        type:0,//1 视频  2图片
        path:path,
        size:0
    };

    var stat= fs.statSync(path);
    fileInfo.isfile=stat.isFile();
    if(fileInfo.isfile) {
        fileInfo.size=stat.size;
    }
    else {
        var files= fs.readdirSync(path)
        files.forEach(function (file,index) {
            var temp=module.exports.getFileInfos(path+"\\"+ file,level);
            temp.name=file;
            if(temp.isfile){
                fileInfo.type=fileTypeCheck(file);
                if(fileInfo.type==1){
                    fileInfo.videofiles.push(temp);
                    fileInfo.size+=temp.size;
                    module.exports.OutParkVideo.push(temp);
                }else if(fileInfo.type==2){
                    fileInfo.imagefiles.push(temp);
                    fileInfo.size+=temp.size;
                }
                else return;
            }
            else{
                fileInfo.dirs.push(temp);
                fileInfo.size+=temp.size;
            }
        })
    }

    return fileInfo;

}
/*
* 文件类型检查
* 返回：0 无关类型 1 视频 2 图片
* */
function fileTypeCheck(file) {
    var index=file.lastIndexOf(".");
    file=file.substr(index+1);
    for(var i=0;i<imagefiletypes.length;i++){
        if(imagefiletypes[i]==file) return 2;
    }

    for(var i=0;i<vidoefiletypes.length;i++){
        if(vidoefiletypes[i]==file) return 1;
    }

    return 0;
}

module.exports=new parker();
 //var result= module.exports.getFileInfos("D:\\TDDOWNLOAD\\2016年3月16日")
 //console.log(result);

