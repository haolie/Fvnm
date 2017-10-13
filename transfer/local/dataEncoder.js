/**
 * Created by LiuYouhao on 2017/8/22.
 */

var coder=function(){

}

coder.prototype.EncodeArray=function(datas){

    var t=5;
    t=~t;
    t=t<<1;
    t=t>>1;
    console.log(t);
    t=~t;
    console.log(t);
}

coder.prototype.DecodeArray=function(datas){

}

module.exports=new coder();
module.exports.EncodeArray();


