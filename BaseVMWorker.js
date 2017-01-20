/**
 * Created by LYH on 2017/1/16.
 */
var  process = require('process');
var util=require('util');

var baseworker=function(){

      var current=this;
      process.on('message',function(msg){
          current.onmessage(msg);
    });
}

baseworker.prototype.onmessage=function(msg){
    this.test2();
    var mo=null;
    try {
        mo=JSON.parse(msg);
    }catch (ex){

    }

    this.handlemessage()
}

baseworker.prototype.handlemessage=function(msg){

}

baseworker.prototype.sendMsg=function(msg){
    if(!util.isString(msg)){
        if(util.isObject(msg))msg=JSON.stringify(msg);
        else msg=msg.toString();
    }

    if(process.send)
    process.send(msg);
    else
    console.log(msg);
}


module.exports=baseworker;