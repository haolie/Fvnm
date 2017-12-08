function appApi(code) {

    var appApi = {

        // 分页，一页显示多少条数据
        "PAGE_SIZE": 10,

        // 退出系统
        'LOGOUT': 'sys/logout',

        // 查询日期列表
        'QUERY_DATASBYNO': 'querydates',

        // 根据日期查询编号列表
        'QUERY_LISTNOBYDATE': 'queryNoByDate',

        // 根据编号、日期查询交易数据
        'QUERY_LISTNODATEVALUE': 'queryNoDateValue',

    };


    var url = appApi[code];
    return url;
}