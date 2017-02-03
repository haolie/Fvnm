/**
 * Created by youhao on 2016/12/24.
 */
jQuery(function($){
    var baseUrl="../node/";
    var mcar=function(){};
    mcar.prototype.init=function(){
        $('#tab_charts').on('shown.bs.tab', function (e) {
            if(e.target&&!$("#head_"+e.target.innerHTML).attr("state")){
                current.queryDataByDateNo(current.currentno,e.target.innerHTML);

            }

        })
        $("#chart").ready(function(){
            //alert($("#chart").width()) tab_charts
            $("#chart").height(Math.min($(document).height()-162,$("#chart").width()));
            $('#chart').bind('swiperight swiperightup swiperightdown',function(){

                current.setcurCode(Number(curindex)+1,true);
            })

            $('#chart').bind('swipeleft swipeleftup swipeleftdown',function(){

                current.setcurCode(Number(curindex)-1,true);
            })
        })

        $("#tab_charts").ready(function(){
            //alert($("#chart").width()) tab_charts
            $("#tab_charts").height(Math.min($(document).height()-162,$("#tab_charts").width()));
        })

        $("#btnper").click(function(){
            if(curindex<=0) return;
            current.setcurCode(Number(curindex)-1,true);

        })

        $("#btnafter").click(function(){
            if(curindex<0) return;
            if(curindex==allitems.length-1)return;

            current.setcurCode(Number(curindex) +1);
        })

        $( "#btncodeface").click(function(a,b){
            var date=$("#datepicker").datepicker("getDate");

            $("#aolist").html("");
            var datestr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
            current.date =datestr;
            $.get(baseUrl+ "dateface?face=2&per=0.03&date="+datestr,function(data,status){
                var items= eval(data);
                allitems=[];
                for(var i in items){
                    if(items[i].no==global.shcode) continue;
                    allitems.push(items[i]);
                    var temp =  $('<li style="cursor: pointer"><a ><i class="menu-icon fa fa-caret-right"></i></a> <b class="arrow"></b></li>');
                    $(temp).children("a").text(items[i].no);
                    $("#aolist").append(temp[0]);
                    if(i>120) break;
                }

                current.setcurCode(0);


                $("#aolist li").click(function(a){
                    var no= $(a.currentTarget).children("a").text().trim();
                    for(var i in allitems){
                        if(allitems[i].no==no){
                            this.queryDataByDateNo(no,current.date);
                            break;
                        }
                    }

                });



            });
        })

    }

    var allitems=null;
    var curindex=-1;
    mcar.prototype.queryDataByDateNo=function(no,date){

        var geturl=baseUrl+"dayvalue?no="+no+"&date="+date;

        $("#titleno").text(no);
        $("#head_"+date).attr("state",1);

        $.get(geturl,function(data,status){
            var myChart = echarts.init($('#item_'+date).children(".chart-view")[0]);

            data=JSON.parse(data);
            if(data.face==3){
                var $btn= $("#tab_charts").children(".tab-content").children(".active").children(".chart-btn-set")[0];
                $($btn).addClass("btn-success")
            }
            var listy=[];
            var listx=[];
            $.each(data.data,function(d,a){
                var date=new Date(a.time);
                //list.push([date.getHours()+':'+date.getMinutes(), a.price]);
                listy.push(date.getHours()+':'+date.getMinutes());
                listx.push(a.price);
            });
            var price=data.lastprice-data.ud;
            maxy=Math.max(Math.abs(data.max-price),Math.abs(data.min-price));
            miny=price-maxy;
            maxy=price+maxy;

            option = {
                tooltip : {
                    trigger: 'axis'
                },
                calculable : true,
                xAxis : [
                    {
                        type : 'category',
                        boundaryGap : false,
                        data : listy
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        max:maxy,
                        min:miny
                    }
                ],
                series : [
                    {
                        name:'搜索引擎',
                        type:'line',
                        stack: '总量',
                        data:listx,
                        markLine : {
                            data : [
                                { yAxis: price }
                            ]
                        }
                    }
                ]
            };



            myChart.setOption(option);
        })
    }

    mcar.prototype.currentno="";
    mcar.prototype.date="";
    mcar.prototype.setcurCode=function(index){
        curindex=index;
        current.settable(allitems[index].no ,current.date)

    }

    mcar.prototype.settable=function(code,date){
        $("#tab_charts").children("ul").html('');
        $("#tab_charts").children(".tab-content").html('');
        current.currentno=code;
        current.insertTabItem(date,1);
        current.queryDataByDateNo(code,date);
        var geturl=baseUrl+"afterdays?no="+code+"&date="+date+"&count=5";
        $.get(geturl,function(data,status){
            dates=JSON.parse(data);
            for(var i in dates){
                current.insertTabItem(dates[i]);
            }
        })

    }

    mcar.prototype.insertTabItem=function(date,active){
        var $headhtml=$('<li id="head_' +date+
            '"><a data-toggle="tab" aria-expanded="false"><i class="pink ace-icon fa fa-tachometer bigger-110"></i></a></li>');
        $headhtml.children("a").attr("href","#item_"+date).text(date);
        if(active)
        $headhtml.addClass("active");
        var $contenthtml=$(' <div id="item_' +
            date+'" class="tab-pane item-chart" />');
        if(active)
            $contenthtml=$(' <div id="item_' +
                date+'" class="tab-pane item-chart active">');


        var $btn=$('<button class="chart-btn-set ace-icon fa fa-pencil align-top bigger-125"/>');
        $($btn).click(function(a,b){
           var date= $("#tab_charts").children("ul").children(".active").children("a")[0].innerHTML
            var geturl=baseUrl+"faceset?no="+current.currentno+"&date="+date+"&face=3";
            $.get(geturl,function(data,status){
                var $btn= $("#tab_charts").children(".tab-content").children(".active").children(".chart-btn-set")[0];
                $($btn).addClass("btn-success")
            })
        })
        $contenthtml.append($('<div class="chart-view "/>'));
        $contenthtml.append($btn);

        $("#tab_charts").children("ul").append($headhtml);
        $("#tab_charts").children(".tab-content").append($contenthtml);



    }

    var current=new mcar();
    current.init();

});
