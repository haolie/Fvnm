var fork = require('child_process').fork;

var vm=function(){}

vm.prototype.startDataMeeter=function(){
    var worker= fork("DataMeeter.js")

    worker.on("message",function(msg){
        module.exports.timeConsole(msg);
    })

    worker.on("exit",function(){
        console.log("DataMeeter exit");
        worker.kill();
        worker=null;
        setTimeout(module.exports.startDataMeeter,5000);
    })
}

vm.prototype.timeConsole=function(str){
    var date=new Date();
    console.log(date.getHours()+":"+date.getMinutes()+"  "+str);
}

vm.prototype.startDataServer=function(){
    var worker= fork("DataQuery.js")
}

vm.prototype.start=function(){
    module.exports.startDataMeeter();
    module.exports.startDataServer();
}

module.exports=new vm();
module.exports.start();

