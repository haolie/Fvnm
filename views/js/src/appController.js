var ajaxNum = 0;
function appController() {

    function dataHandle(o) {

        if (!o.loading) {
            ajaxNum += 1;
          //  libs.showLoading();
        }
        if (!o.method) {
            throw 'method 参数未设置';
        }

        // if (_.isFunction(o.params)) {
        //     o.callback = o.params;
        //     o.params = null;
        // }

        o.params = o.params || {};
        o.async = o.async || true;

        $.ajax({
            async: o.async,
            url: o.url,
            dataType: 'json',
            data: o.params,
            type: o.method,
            timeout: o.timeout ? o.timeout : 300000, //超时时间设置，单位毫秒
            contentType: 'application/json;charset=UTF-8',
            complete: function (xhr, status) {
                /**************************************/
                if (xhr.status === 0) window.location.href = appApi("LOGOUT");
                if (xhr.responseText.indexOf("<!DOCTYPE html>") != -1) {
                    if (xhr.responseText.indexOf("<title>统战大数据_分析系统</title>") != -1) {
                        libs.alert("登录超时，请重新登录！", function () {
                            window.location.href = appApi("LOGOUT");
                        });
                        return false;
                    }
                   // libs.alert("对不起，服务器接口出错！请联系技术人员！");
                    return false;
                }
                /**************************************/
                if (!o.loading) {
                    ajaxNum -= 1;
                 //   if (ajaxNum == 0) libs.hideLoading();
                }
                if (status == 'timeout') {
                 //   libs.alert("服务端请求超时，请重新请求！");
                    return false;
                }

                if (xhr.responseText.indexOf("<!DOCTYPE html>") != -1) {
                    if (xhr.responseText.indexOf("<title>统战大数据_分析系统</title>") != -1) {
                        window.location.href = appApi("LOGOUT");
                        return false;
                    }
                }

                var result = JSON.parse(xhr.responseText),
                    code = parseInt(result.status.code),
                    message = result.status.message;


                if (code === 888 || code === 800) {
                    window.location.href = appApi("LOGOUT");
                    return false;
                }

                if (code !== 200 && code !== 900) {
                    if (typeof code == "undefined") {
                        console.log('错误码：0000\n异常信息：频繁操作 操作拒绝');
                        return;
                    }
                 //   libs.alert("异常信息：</p><p>" + message);
                    return;
                } else {
                    o.callback(result.data);
                }
            }
        });
    }

    function getP(o) {
        o.url = id ? appApi(o.url) + "/" + id : appApi(o.url);
        if(o.params){
            var id = o.params.urlid ? o.params.urlid : 0;
            delete o.params.urlid;
        }
        return o;
    }

    // TODO: 需要添加请求未成功的验证

    return {
        'post': function (o) {

            o.method = 'post';
            o = getP(o);
            o.params = JSON.stringify(o.params);
            dataHandle(o);
        },
        'delete': function (o) {

            o.method = 'delete';
            o = getP(o);
            o.params = JSON.stringify(o.params);
            dataHandle(o);
        },
        'put': function (o) {

            o.method = 'put';
            o = getP(o);
            o.params = JSON.stringify(o.params);
            dataHandle(o);
        },
        'get': function (o) {

            o.method = 'get';
            o = getP(o);
            dataHandle(o);
        }
    };
}