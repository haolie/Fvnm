/**
 * Created by LiuYouhao on 2017/6/26.
 */
var fs = require('fs');
var path = require('path');
//var COS = require('cos-nodejs-sdk-v5');
var cryptoObj = require('crypto');
var crypto = require('../../libs/crypto.js');
//var COS = require('./../lib/cos-js-sdk-v4.js');
var http = require('http');
var async=require("async");
var querystring=require('querystring');
var tool=require('../../tools');
var request=require("request");

var apiid='10028297',
    sid='AKIDmmGfV59KBtcPB1kQCh2ElU6ytlUQDAUC',
    sk="g2fvgK5hpAIk2KEYPUfmBelxwUhqs2iY",
    hostname="sh.file.myqcloud.com",
    pagesize=100;

var SLICE_UPLOAD_FILE_SIZE = 8 * 1024 * 1024;

var cosObj;

var Supporter=function(){}
module.exports=new Supporter();
Supporter.prototype.CurBucket="sparkmoon";

Supporter.prototype.getDirectories=function(basePath,callback){
    var list=[];
    var fun=function(file,funcb){
        var path=""

        if(tool.isObject(file))path=module.exports.getpath(file)
        else if(tool.isString(file))path=file;

        module.exports.GetFileStat(path,function(err,data){
            if(err){
                if(callback)callback(err,[]);
                return;
            }

            var fds=[];

            if(tool.isObject(file))file.children=data;
            data.forEach(function(d,i){
                d.parent=file;
//                d.isfile= d.sha
                if(!d.sha)fds.push(d);
            })

            var num=0;
            if(fds.length)async.mapLimit(fds,1,function(item,asc){
                num++;
                console.log(num +"/"+fds.length)
                fun(item,asc);
            },function(err,h){
                funcb(err,data);
            });
            else
                funcb(0,data);
        });
    }

    fun(basePath,function(err,dl){
        callback(err,dl);
    });
}

Supporter.prototype.getpath=function(file){
    if(file!=null&&file.parent!=null){
        if(tool.isString(file.parent)) return file.parent+"/"+ file.name;

        return  module.exports.getpath(file.parent)+"/"+ file.name
    }

    return  file.name;

}

Supporter.prototype.getWebObj=function(file,callback){
    var rpath=module.exports.createPath(file);

    var out = null;
    var  options = {
        //  hostname:module.exports.CurBucket+"-"+apiid+".cossh.myqcloud.com",
        host:'sparkmoon-10028297.cossh.myqcloud.com',
        port: 80,
        path: "/"+file,
        KeepAlive: true,
        headers: {
            'Authorization':module.exports.createAuthorization()
        }
    };

    module.exports.HttpRequest(options,function(err,result){
        callback(err,result);
    })
}

Supporter.prototype.downFile=function(file,output,callback){
    var rpath=module.exports.createPath(file);

    var out = null;
    var  options = {
      //  hostname:module.exports.CurBucket+"-"+apiid+".cossh.myqcloud.com",
        host:'sparkmoon-10028297.cossh.myqcloud.com',
        port: 80,
        path: "/"+file,
        KeepAlive: true,
        headers: {
            'Authorization':module.exports.createAuthorization()
        },
        ondata:tool.isFunction(output)?output : function(data){
            if(out==null)
             out= fs.createWriteStream(output);
            out.write(data);
        }
    };

    module.exports.HttpRequest(options,function(){
        if(out!=null){
            out.end(function(){  if(callback)callback(0,output)  });
        }

        else if(callback)callback(0,output)
    })
}

Supporter.prototype.deleteFile=function(remotePath,callback){
    var rpath=module.exports.createPath(remotePath);

    module.exports.basePost(rpath,{"op":"delete"},function(err,result){
        callback(err,result);
    })
}

Supporter.prototype.UploadFile=function(remotePath,name,file,callback){
    module.exports.getFileHash1(file,function(err,result){
        var path=module.exports.createPath(remotePath)+'/'+name;
        var params={
            'op':"upload",
            "sha":result.hash1,
            'biz_attr':"",
            'insertOnly':0
        };

        var boundary ='----------------------------aa502a40917c';
        var beginboundarr= "\r\n--" + boundary + "\r\n"
        var strs="";
        for( var i in params){
            strs+="\r\n--" + boundary + "\r\n";
            strs+="Content-Disposition: form-data; name=\"" + i + "\"\r\n\r\n";
            strs+=params[i].toString();
        }
        strs+=beginboundarr;
        var tmpbuf=new Buffer(strs);
        var length=tmpbuf.length;
        var bufs=[tmpbuf];
        tmpbuf=new Buffer("Content-Disposition: form-data; name=\"fileContent\"; filename=\""+name +"\"\r\n" +"Content-Type: application/octet-stream\r\n\r\n");
        bufs.push( tmpbuf);
        length+=tmpbuf.length;
        bufs.push(result.data);
        length+=result.data.length;
        tmpbuf=new Buffer(new Buffer("\r\n--" + boundary + "--\r\n"));
        bufs.push(tmpbuf);
        length+=tmpbuf.length;

        var  options = {
            hostname:hostname,
            port: 80,
            method: 'POST',
            path: path,
            KeepAlive: true,
            headers: {
                'Authorization':module.exports.createAuthorization(),
                'Content-Length':length,
                'Content-Type':' multipart/form-data; boundary=----------------------------aa502a40917c'
            }
        };

        var temp= module.exports.HttpRequest(options,callback);
        temp.write(Buffer.concat(bufs,length));
        temp.end();
    });


}

Supporter.prototype.HttpRequest=function(option,callback){
    var str="get";
    if(option.method=="POST") str="request";

    var request= http[str](option,function (res){
        var length=0;
        var chunks=[];
        res.on('error', function (chunk) {
            callback(1, null);
        });
        var ondata=function (chunk) {
            length+=chunk.length;
            chunks.push(chunk);
        };
       if(option.ondata) ondata=option.ondata;
        res.on('data',ondata);
        res.on('end', function (dd) {
            if(option.ondata) return callback(0,null);

            var buf=Buffer.concat(chunks, length);
            var str  =buf.toString()
            try {
               // console.log(str)
                var result=JSON.parse(str);
                callback(0,result);
            }catch (ex){
                console.log(ex);
                callback(1,null);
            }
        });
    })

    request.on("error",function(err){
        callback(1, null);
    })

    return request;

}


Supporter.prototype.createPath=function(remotePath){
    return "/files/v2/" +apiid + "/" + module.exports.CurBucket + "/" + remotePath;
}

Supporter.prototype.createAuthorization=function(expired,fileId){
    var now=Date.parse(new Date())/1000;
    var rdm=parseInt((Math.round()*10000 )+22);
  //  now=1498636483;rdm=12021;expired=1498696483;
    fileId="";
    if(!expired) expired=now+60*10;

    var plainText = "a=" + apiid + "&k=" + sid + "&e=" + expired + "&t=" + now + "&r=" + rdm + "&f=" + fileId + "&b=" + module.exports.CurBucket;
    var sha1Res= crypto.HmacSHA1(plainText,sk);

    var strWordArray = crypto.enc.Utf8.parse(plainText);
    var resWordArray = sha1Res.concat(strWordArray);
    var res = resWordArray.toString(crypto.enc.Base64);
    return res;
}

Supporter.prototype.GetFileStat=function(remotePath,callback){
    var list=[];
    var fun=function(context,n){
        var path=module.exports.createPath(remotePath);
        path+="?op=list&num="+(pagesize+1);
        if(context) path+="&context="+context;

        module.exports.baseRequest(path,"list",function(err,result){
            if(err){
                if(n>0)fun(context,n-1);
                else callback(err,null);
                return;
            }
            if(result.code!=0){
                callback(result.code,[]);
                return;
            }
            result=result.data;
            result.infos.forEach(function(d,i){list.push(d) });
            if(result.listover)
                callback(0,list);
            else
                fun(result.context,5);
        })
    }

    fun(null,5);
}

Supporter.prototype.createDir=function(remotePath,name,callback){
    var path=module.exports.createPath(remotePath);
    path+=""+name+"/";

    module.exports.basePost(path,{"op": "create","biz_attr": ""},function(err,result){
        callback(err,result);

    })
}

Supporter.prototype.deleteDir=function(remotePath,callback){
    if(remotePath.lastIndexOf("/")<remotePath.length-1){
        remotePath+="/";
    }
    var path=module.exports.createPath(remotePath);

    module.exports.GetFileStat(remotePath,function (err,file) {

        if(file.length==0){
            module.exports.basePost(remotePath,{"op": "delete"},function(err,result){
                callback(err,result);
            })
        }
        else {

            async.mapLimit(file,1,function (f,mb) {
                if(f.sha){
                    module.exports.deleteFile(remotePath+f.name,function () {
                        mb(0,0);
                    })
                }
                else {
                    module.exports.deleteDir(remotePath+f.name,function () {
                        mb(0,0)
                    })
                }

            },function (err,result) {
                module.exports.basePost(path,{"op": "delete"},function(err,result){
                    callback(err,result);
                })
            })

        }



    })


}



Supporter.prototype.getFileHash1=function(filepath,callback){
    try {
        var fileInfo = fs.statSync(filepath)

        var txt = fs.ReadStream(filepath);
        var length=0;
        var chunks=[];

        var shasum = cryptoObj.createHash("sha1");
        txt.on('data', function(d) {
            shasum.update(d);
            if(fileInfo.size<SLICE_UPLOAD_FILE_SIZE){
                length+=d.length;
                chunks.push(d);
            }
        });

        txt.on('end', function() {
            var d = shasum.digest('hex');
            var buf=null;
            if(length)
             buf=Buffer.concat(chunks, length);
            callback(0,{hash1:d,data:buf});
        });
    }catch (ex){
        callback(1,null);
    }

}

Supporter.prototype.baseRequest=function(queryPath,op,callback){
    var  options = {
        hostname:hostname,
        port: 80,
        method: 'GET',
        path: queryPath,
        headers: {
            'Authorization':module.exports.createAuthorization()
        }
    };

    if(op!=null) options.headers.op=op;

    module.exports.HttpRequest(options,callback);
}

Supporter.prototype.basePost=function(queryPath,param,callback){

    var postdata=JSON.stringify(param);
    var  options = {
        hostname:hostname,
        port: 80,
        method: 'POST',
        path: queryPath,
        headers: {
            "content-type": "application/json",
            'Authorization':module.exports.createAuthorization(),
            'Content-Length': postdata.length
        }
    };

    var temp=module.exports.HttpRequest(options,callback);
    temp.write(postdata);
    temp.end();
}

Supporter.prototype.start=function(){
    module.exports.CurBucket="sparkmoon";
    //module.exports.deleteDir("FMoon/2017" , function(err,str){
    //    console.log(str);
    //});

    //module.exports.UploadFile( "FMoon/2017","jfish.jpg","d:\\Jellyfish.jpg",function(err,result){
    //
    //})

    //module.exports.downFile("FMoon/2017/jfish.jpg","d:\\J22.jpg",function(err,result){
    //
    //})

    module.exports.deleteDir("FMoon/2017",function(err,result){

        console.log(result)
    })



    //module.exports.getDirectories(function(err,json){
    //
    //})
}


//module.exports.start()