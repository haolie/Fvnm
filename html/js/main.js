/**
 * Created by LYH on 2016/12/20.
 */

var baseUrl="http://localhost:8080/node/";
jQuery(function($){

    $("#chart").ready(function(){
        //alert($("#chart").width())
        $("#chart").height(Math.min($(document).height()-162,$("#chart").width()));
    })

    $( "#btncodeface").click(function(a,b){
        var date=$("#datepicker").datepicker("getDate");
        $("#aolist").html("");
        var datestr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
        $.get(baseUrl+ "dateface?face=2&per=0.03&date="+datestr,function(data,status){
            var items= eval(data);
            for(var i in items){
                var temp =  $('<li style="cursor: pointer"><a ><i class="menu-icon fa fa-caret-right"></i></a> <b class="arrow"></b></li>');
                $(temp).children("a").text(items[i].no);

                $("#aolist").append(temp[0]);
                if(i>120) break;
            }

            $("#aolist li").click(function(a){
                var no= $(a.currentTarget).children("a").text().trim();
                var geturl=baseUrl+"dayvalue?no="+no+"&date="+datestr;

                $.get(geturl,function(data,status){
                    var myChart = echarts.init(document.getElementById('chart'));
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
            });

        });
    })




})