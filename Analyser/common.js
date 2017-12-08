

var errs={
    202:"缺少参数"
}

var common=function () {
    
}

common.prototype.createResult=function (err,data) {
    var result={
        "status": {
            "code": err?err:200,
            "message": err?errs[err]: "获取数据成功"
        },
    }

    if(data) result.data=data;

    return result;
}

module.exports=new common();