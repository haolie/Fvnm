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



Date.prototype.add = function (part, value) {
    value *= 1;
    if (isNaN(value)) {
        value = 0;
    }
    switch (part) {
        case "y":
            this.setFullYear(this.getFullYear() + value);
            break;
        case "m":
            this.setMonth(this.getMonth() + value);
            break;
        case "d":
            this.setDate(this.getDate() + value);
            break;
        case "h":
            this.setHours(this.getHours() + value);
            break;
        case "n":
            this.setMinutes(this.getMinutes() + value);
            break;
        case "s":
            this.setSeconds(this.getSeconds() + value);
            break;
        default:

    }
}

module.exports=new tool();