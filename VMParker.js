var fork = require('child_process').fork;
var http = require('http');

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
    console.log(date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+":"+date.getMilliseconds()+"  "+str);
}

vm.prototype.startDataServer=function(){
    var worker= fork("DataQuery.js")

    worker.on("message",function(msg){

        module.exports.timeConsole(msg);
    })

    worker.on("exit",function(){
        console.log("DataQuery exit");
        worker.kill();
        worker=null;
        setTimeout(module.exports.startDataServer,5000);
    })
}

vm.prototype.startAdvan=function(){
    var worker= fork("dataAdvander.js")

    worker.on("message",function(msg){
        module.exports.timeConsole(msg);
    })

    worker.on("create",function(er){
        console.log("create")
    })

    setTimeout(function(){
        worker.send("1232");
    },1000)


    worker.on("exit",function(){
        console.log("DataQuery exit");
        worker.kill();
        worker=null;
        setTimeout(module.exports.startDataServer,5000);
    })
}


vm.prototype.start=function(){
   module.exports.startDataMeeter();
    //module.exports.startAdvan();
    module.exports.startDataServer();

}

module.exports=new vm();
module.exports.start();

