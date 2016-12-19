$(function() {
	$('#container3')
			.highcharts(
					{
						chart : {
							type : 'column',
							backgroundColor : '#17bef2'
						},
						title : {
							text : 'LOLI Real Monitor'
						},
						xAxis : {
							categories : [ 'LO', 'LI' ],
							type : 'category'
						},
						yAxis : {
							min : 0,
							title : {
								text : 'Value(Lux)'
							}
						},

						plotOptions : {
							column : {
								pointPadding : 0,
								borderWidth : 0
							},
							series : {
								color : '#0d181e'
							}
						},
						series : [ {
							name : 'Value',
							data : [ 200, 50 ],
							tooltip : {
								valueSuffix : '(Lux)'
							}
						} ]
					},
					function(chart) {
						if (!chart.renderer.forExport) {
							setInterval(
									function() {
										var point1 = chart.series[0].points[0], newVal, inc = Math
												.round((Math.random() - 0.5) * 20);

										newVal = point1.y + inc;
										if (newVal < 0 || newVal > 200) {
											newVal = point1.y - inc;
										}
										point1.update(newVal);

										var point2 = chart.series[0].points[1];
										inc = Math
												.round((Math.random() - 0.5) * 20);
										newVal = point2.y + inc;
										if (newVal < 0 || newVal > 200) {
											newVal = point2.y - inc;
										}
										point2.update(newVal);
									}, 1000);
						}
					});
});