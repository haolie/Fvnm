var VMEncoder =require("./VMEncoder/build/Release/VMEncoder")
var fs = require('fs');
var fn = VMEncoder();

function tester(cfn,callback) {
    var txt = fs.ReadStream("E:\\softwire\\mysql-5.7.17-winx64.zip");
    console.time()
    txt.on('data', function(d) {
        cfn(d);
    });

    txt.on('end', function() {
        console.timeEnd()
        callback()
    });
}

function decder(array) {
    var temp=[];
    for (var i =0;i<array.length;i++){
        temp.push(255-array[i]);
    }

    return temp;
}

tester(decder,function () {
    tester(fn,function () {
        
    })
})


