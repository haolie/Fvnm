$(function () {
    $('#calendar').datepicker({
    });

    !function ($) {
        $(document).on("click","ul.nav li.parent > a > span.icon", function(){
            $(this).find('em:first').toggleClass("glyphicon-minus");
        });
        $(".sidebar span.icon").find('em:first').addClass("glyphicon-plus");
    }(window.jQuery);

    $(window).on('resize', function () {
        if ($(window).width() > 768) $('#sidebar-collapse').collapse('show')
    })
    $(window).on('resize', function () {
        if ($(window).width() <= 767) $('#sidebar-collapse').collapse('hide')
    })

    $("#menu_left li").click(function () {
        var url=$(this).attr("data-url");
        if(url&&url.length){
            $.fn.showUrl(url);
        }
    })

    $.fn.showUrl=function (url) {
        if(sessionStorage.curUrl&&sessionStorage.curUrl!=url){
            if(!sessionStorage.urlList)sessionStorage.urlList=[];
            sessionStorage.urlList.push(sessionStorage.curUrl)
        }
        sessionStorage.curUrl=url
        $.get(url,function (html) {
            $("#mainContent").empty().append(html);
        })
    }

    sessionStorage.urlList=[];
    if(sessionStorage.curUrl){
        $.fn.showUrl(sessionStorage.curUrl);
    }
})