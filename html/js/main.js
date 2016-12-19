/**
 * Created by LYH on 2016/12/20.
 */

var baseUrl="http://58.20.245.98:8686/node/";
jQuery(function($){

    $( "#datepicker").change(function(a,b){
        var date=new Date(a.target.value);

        var datestr=date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
        $.get(baseUrl+ "dateface?date="+datestr,function(data,status){
            var items= eval(data);
            for(var i in items){
                var temp =  $('<li><a ><i class="menu-icon fa fa-caret-right"></i></a> <b class="arrow"></b></li>');
                $(temp).children("a").text(items[i].no);

                $("#aolist").append(temp);
                if(i>120) break;
            }

            $("#aolist li").click(function(a){
                var no= $(a.currentTarget).children("a").text().trim();
                var date="2016-12-19";
                var geturl=baseUrl+"dayvalue?no="+no+"&date="+date;

                $.get(geturl,function(data,status){
                    var myChart = echarts.init(document.getElementById('chart'));
                    data=eval(data);
                    var listy=[];
                    var listx=[];
                    var maxy=-1;
                    var miny=10000;
                    $.each(data,function(d,a){
                        var date=new Date(a.time*1000);
                        //list.push([date.getHours()+':'+date.getMinutes(), a.price]);
                        listy.push(date.getHours()+':'+date.getMinutes());
                        listx.push(a.price);
                        maxy=Math.max(maxy, a.price);
                        miny=Math.min(miny, a.price);
                    });

                    option = {
                        tooltip : {
                            trigger: 'axis'
                        },
                        toolbox: {
                            show : true,
                            feature : {
                                mark : {show: true},
                                dataView : {show: true, readOnly: false},
                                magicType : {show: true, type: ['line', 'bar', 'stack', 'tiled']},
                                restore : {show: true},
                                saveAsImage : {show: true}
                            }
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
                                data:listx
                            }
                        ]
                    };



                    myChart.setOption(option);
                })
            });

        });
    })




})