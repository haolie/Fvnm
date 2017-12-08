var dbsuport = require('./../MYSQLDBSuport.js');
var common= require('./common');

var DS=function () {

}

DS.prototype.searchDates=function(req,res){

    var no=global.shcode;
    if(req.query.no)no=req.query.no;
    dbsuport.getfaces({no:no},function (err,items) {
        var codes=[];
        items.forEach(function (item) {
            if(item.state>0)
            codes.push({date:item.date,state:item.state});
        })

        res.send(common.createResult(0,codes));
    })

}

DS.prototype.searchNoInDate=function(req,res){
    if(!req.query.date){
        res.send(common.createResult(202))
        return;
    };
    dbsuport.getfaces({date:req.query.date},function (err,items) {
        res.send(common.createResult(0,items));
    })

}

DS.prototype.searchDateNoData=function(req,res){
    if(!req.query.date||!req.query.no){
        res.send(common.createResult(202))
        return;
    };
    dbsuport.getValueByDayNo({date:req.query.date,no:req.query.no},function (err,items) {
        res.send(common.createResult(0,items));
    })

}

module.exports=new DS();