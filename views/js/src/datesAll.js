$(function () {
   var  $http = appController()

    function createRandomItemStyle() {
        return {
            normal: {
                color: 'rgb(' + [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160)
                ].join(',') + ')'
            }
        };
    }

    function init() {
       $http.get({
           url:"QUERY_DATASBYNO",
           param:{},
           callback:function (data) {
               debugger
               var dates=[];
               $.each(data,function (i,item) {
                   dates.push({
                       name:item.date,
                       value:i*100
                   })
               })

               var myChart = echarts.init(document.getElementById('chart_dates'));
               option = {
                   series: [{
                       type: 'wordCloud',
                       gridSize: 20,
                       sizeRange: [5, 50],
                       rotationRange: [0, 0],
                       shape: 'circle',
                       textStyle: {
                           normal: {
                               color: function () {
                                   return 'rgb(' + [
                                       Math.round(Math.random() * 160),
                                       Math.round(Math.random() * 160),
                                       Math.round(Math.random() * 160)
                                   ].join(',') + ')';
                               }
                           },
                           emphasis: {
                               shadowBlur: 10,
                               shadowColor: '#333'
                           }
                       },
                       data: dates
                   }]
               }

               myChart.on('click', function (params) {
                   console.log(params);
               });


               myChart.setOption(option);
           }
       })

        test()
    }
    
    function test() {
        var labelTop = {
            normal : {
                label : {
                    show : true,
                    position : 'center',
                    formatter : '{b}',
                    textStyle: {
                        baseline : 'bottom'
                    }
                },
                labelLine : {
                    show : false
                }
            }
        };
        var labelFromatter = {
            normal : {
                label : {
                    formatter : function (params){
                        return 100 - params.value + '%'
                    },
                    textStyle: {
                        baseline : 'top'
                    }
                }
            },
        }
        var labelBottom = {
            normal : {
                color: '#ccc',
                label : {
                    show : true,
                    position : 'center'
                },
                labelLine : {
                    show : false
                }
            },
            emphasis: {
                color: 'rgba(0,0,0,0)'
            }
        };
        var radius = [40, 55];
        option = {
            legend: {
                x : 'center',
                y : 'center',
                data:[
                    'GoogleMaps','Facebook','Youtube','Google+','Weixin',
                    'Twitter', 'Skype', 'Messenger', 'Whatsapp', 'Instagram'
                ]
            },
            title : {
                text: 'The App World',
                subtext: 'from global web index',
                x: 'center'
            },
            toolbox: {
                show : true,
                feature : {
                    dataView : {show: true, readOnly: false},
                    magicType : {
                        show: true,
                        type: ['pie', 'funnel'],
                        option: {
                            funnel: {
                                width: '20%',
                                height: '30%',
                                itemStyle : {
                                    normal : {
                                        label : {
                                            formatter : function (params){
                                                return 'other\n' + params.value + '%\n'
                                            },
                                            textStyle: {
                                                baseline : 'middle'
                                            }
                                        }
                                    },
                                }
                            }
                        }
                    },
                    restore : {show: true},
                    saveAsImage : {show: true}
                }
            },
            series : [
                {
                    name:'访问来源',
                    type:'pie',
                    center : ['10%', '30%'],
                    radius : radius,
                    avoidLabelOverlap: false,
                    label: {
                        normal: {
                            show: 0,
                            position: 'center'
                        },
                        emphasis: {
                            show: 0,
                            textStyle: {
                                fontSize: '30',
                                fontWeight: 'bold'
                            }
                        }
                    },
                    labelLine: {
                        normal: {
                            show: false
                        }
                    },
                    "data": [
                        {
                            "name": "职位",
                            "value": "0",
                            itemStyle: {
                                normal :{
                                    labelLine : {
                                        show : false
                                    },
                                    label : {
                                        show :1,
                                        position : 'center',
                                        formatter :"访问来源",

                                    }

                                }
                            }
                        },
                        {
                            "name": "社会保障卡卡号",
                            "value": "1"
                        },
                        {
                            "name": "车牌号",
                            "value": "1"
                        },
                        {
                            "name": "模糊化类",
                            "value": "1"
                        },
                        {
                            "name": "地址类",
                            "value": "1"
                        },
                        {
                            "name": "图像识别",
                            "value": "1"
                        },
                        {
                            "name": "工商登记号",
                            "value": "1"
                        },
                        {
                            "name": "港澳通行证",
                            "value": "1"
                        },
                        {
                            "name": "纳税人识别号",
                            "value": "1"
                        },
                        {
                            "name": "驾驶证",
                            "value": "1"
                        },
                        {
                            "name": "年龄",
                            "value": "1"
                        },
                        {
                            "name": "军官证",
                            "value": "1"
                        },
                        {
                            "name": "疾病",
                            "value": "2"
                        },
                        {
                            "name": "合同编号",
                            "value": "2"
                        },
                        {
                            "name": "企业代码",
                            "value": "2"
                        },
                        {
                            "name": "金额",
                            "value": "2"
                        },
                        {
                            "name": "性别",
                            "value": "2"
                        },
                        {
                            "name": "汽车品牌",
                            "value": "2"
                        },
                        {
                            "name": "个人名称",
                            "value": "3"
                        },
                        {
                            "name": "日期信息",
                            "value": "3"
                        },
                        {
                            "name": "公司名称",
                            "value": "3"
                        },
                        {
                            "name": "邮编",
                            "value": "3"
                        },
                        {
                            "name": "电子邮件",
                            "value": "3"
                        },
                        {
                            "name": "电话号码",
                            "value": "4"
                        },
                        {
                            "name": "身份证件",
                            "value": "4"
                        },
                        {
                            "name": "银行卡卡号",
                            "value": "4"
                        },
                        {
                            "name": "地名",
                            "value": "5"
                        }
                    ]
                },
                {
                    type : 'pie',
                    center : ['30%', '30%'],
                    radius : radius,
                    x:'20%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:56, itemStyle : labelBottom},
                        {name:'Facebook', value:44,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['50%', '30%'],
                    radius : radius,
                    x:'40%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:65, itemStyle : labelBottom},
                        {name:'Youtube', value:35,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['70%', '30%'],
                    radius : radius,
                    x:'60%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:70, itemStyle : labelBottom},
                        {name:'Google+', value:30,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['90%', '30%'],
                    radius : radius,
                    x:'80%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:73, itemStyle : labelBottom},
                        {name:'Weixin', value:27,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['10%', '70%'],
                    radius : radius,
                    y: '55%',   // for funnel
                    x: '0%',    // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:78, itemStyle : labelBottom},
                        {name:'Twitter', value:22,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['30%', '70%'],
                    radius : radius,
                    y: '55%',   // for funnel
                    x:'20%',    // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:78, itemStyle : labelBottom},
                        {name:'Skype', value:22,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['50%', '70%'],
                    radius : radius,
                    y: '55%',   // for funnel
                    x:'40%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:78, itemStyle : labelBottom},
                        {name:'Messenger', value:22,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['70%', '70%'],
                    radius : radius,
                    y: '55%',   // for funnel
                    x:'60%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:83, itemStyle : labelBottom},
                        {name:'Whatsapp', value:17,itemStyle : labelTop}
                    ]
                },
                {
                    type : 'pie',
                    center : ['90%', '70%'],
                    radius : radius,
                    y: '55%',   // for funnel
                    x:'80%', // for funnel
                    itemStyle : labelFromatter,
                    data : [
                        {name:'other', value:89, itemStyle : labelBottom},
                        {name:'Instagram', value:11,itemStyle : labelTop}
                    ]
                }
            ]
        };

        var myChart = echarts.init(document.getElementById('chart_test'));
        myChart.setOption(option);

    }

    init();
    
})