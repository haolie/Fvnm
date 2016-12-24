/**
 * Created by youhao on 2016/12/24.
 */
jQuery(function($){
    var baseUrl="../node/";
    var mcar=function(){};
    mcar.prototype.init=function(){
        $("#chart").ready(function(){
            //alert($("#chart").width()) tab_charts
            $("#chart").height(Math.min($(document).height()-162,$("#chart").width()));
            $('#chart').bind('swiperight swiperightup swiperightdown',function(){
                current.queryDataByDateNo(Number(curindex)+1);
            })

            $('#chart').bind('swipeleft swipeleftup swipeleftdown',function(){
                current.queryDataByDateNo(Number(curindex)-1);
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
            $.get(baseUrl+ "dateface?face=2&per=0.03&date="+datestr,function(data,status){
                var items= eval(data);
                allitems=items;
                for(var i in items){
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
                            querynodata(i);
                            break;
                        }
                    }

                });



            });
        })

    }

    var allitems=null;
    var curindex=-1;
    mcar.prototype.queryDataByDateNo=function(date,no){

        var geturl=baseUrl+"dayvalue?no="+no+"&date="+date;
        $("#titleno").text(no);

        $.get(geturl,function(data,status){
            var myChart = echarts.init(document.getElementById("item_"+date));
            data=JSON.parse(data);
            var listy=[];
            var listx=[];
            $.each(data.data,function(d,a){
                var date=new Date(a.time*1000);
                //list.push([date.getHours()+':'+date.getMinutes(), a.price]);
                listy.push(date.getHours()+':'+date.getMinutes());
                listx.push(a.price);
            });
            var price=data.lastPrice-data.ud;
            maxy=Math.max(Math.abs(data.max-price),Math.abs(data.min-price));
            miny=price-maxy;
            maxy=price+maxy;

            option = {
                tooltip : {
                    trigger: 'axis'
                },
                toolbox: {
                    show : false
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
        current.queryDataByDateNo(current.currentno,current.date);
    }

    mcar.prototype.settable=function(code,date){
        $("#tab_charts").children("ul").html('');
        $("#tab_charts").children(".tab-content").html('');

        current.insertTabItem(date);
        var geturl=baseUrl+"afterdays?no="+code+"&date="+date+"$count=5";
        $get(geturl,function(data,status){
            dates=JSON.parse(data);
            for(var i in dates){
                current.insertTabItem(dates[1]);
            }
        })

    }

    mcar.prototype.insertTabItem=function(date){
        var $headhtml=$('<li><a data-toggle="tab" aria-expanded="false"><i class="pink ace-icon fa fa-tachometer bigger-110"></i></a></li>');
        $headhtml.children("a").href("#item_"+date).text(date);

        var $contenthtml=$(' <div class="tab-pane">');
        $contenthtml.id("#item_"+date);

        $("#tab_charts").children("ul").append($headhtml);
        $("#tab_charts").children(".tab-content").append($contenthtml);
    }

    var current=new mcar();
    current.init();

});
