/**
 * Created by youhao on 2017/1/1.
 */
var tool=function(){}

tool.prototype.getSpiedList=function(array,percount,listcount,enfun){
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

tool.prototype.convertToTIMESTAMP=function(time){
    var date=new Date(time*1000);
    return date.getFullYear()+"-"+
        (date.getMonth()+1)+"-"+date.getDate()+" "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

module.exports=new tool();