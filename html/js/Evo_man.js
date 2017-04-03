/**
 * Created by youhao on 2016/12/24.
 */
jQuery(function($){
    var baseUrl="../meeter/";
   var Meeter=function(){};
    Meeter.prototype.init=function(container){
        this.option={};
        this.option.container=container;
    }

    Meeter.prototype.freshView=function(){



    }

    Meeter.prototype.create=function(dataitem){
        var $viewItem= $("#dateview_"+dataitem.date);
        if(!$viewItem.length){
            $viewItem=$("<div id='dateview_'" +dataitem.date+ " class='dateview-item'><span class='dateview-title'><span></div>");
        }


        $('.dateview-title',$viewItem).html(dataitem.date);

    }



    var current=new mcar();
    current.init();

});
