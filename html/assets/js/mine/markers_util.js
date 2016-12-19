$(function() {
	$(document).on("mouseup", function(evt) {
		$(document).off("mousemove");
	});
	$(document).on("mouseleave", function(evt) {
		$(document).off("mousemove");
	});

	$(".marker-device").on(
			"mousedown",
			function(evt) {
				var lastMoveObj = evt.currentTarget;
				var tunnelObj = lastMoveObj.offsetParent;
				var leftEdge = 0;
				var topEdge = tunnelObj.offsetTop;
				var bottomEdge = tunnelObj.offsetHeight - lastMoveObj.height;
				var rightEdge = tunnelObj.offsetWidth - lastMoveObj.width;

				$(document).on(
						"mousemove",
						function(event) {
							var toLeft = event.pageX - tunnelObj.offsetLeft
									- lastMoveObj.width / 2;
							var toTop = event.pageY - tunnelObj.offsetTop
									- lastMoveObj.height / 2;
							if (toLeft >= leftEdge && toLeft <= rightEdge) {
								lastMoveObj.style.left = toLeft + "px";
							}
							if (toTop >= topEdge && toTop <= bottomEdge) {
								lastMoveObj.style.top = toTop + "px";
							}
							return false;
						});
				return false;
			});
});

/**
 * 创建图层
 * @param layerName 图层名称
 */
function createLayers(layerName) {
	var text = "<div id='"+layerName+"' class='div-marker-layer'></div>";
	$("#tunnel-div").append(text);
}

/**
 * 隧道添加标注
 * @param type 设备类型
 * @param lonlat 坐标，如：{x:300,y:200}
 */
function addTunnelMarker(type, lonlat) {
	
}