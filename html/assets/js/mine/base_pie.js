$(function () {
    $('#container4').highcharts({
        chart: {
        	backgroundColor: '#17bef2',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: '设备数量统计'
        },
        tooltip: {
    	    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: {
                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                    }
                }
            }
        },
        series: [{
            type: 'pie',
            name: '总占比',
            data: [
                ['摄像头',   45.0],
                ['光纤光栅',       24.8],
                {
                    name: '照明回路',
                    y: 12.8,
                    sliced: true,
                    selected: true
                },
                ['风机',    8.5],
                ['车道指示器',     6.2],
                ['情报板',   0.7],
                ['其他',   2.0]
            ]
        }]
    });
});