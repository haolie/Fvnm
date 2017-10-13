Vue.component('menu-item', {
    template: '\
    <li>\n' +
    '                        <a class="active-menu" href="#"><i class="fa fa-dashboard"></i> Dashboard</a>\n' +
    '                    </li>\
      ',
    props: ['title']
})
new Vue({
    el: '#main-menu',
    data: {
                menus: [
                    {
                        id: "totalFace",
                        name: 'totalFace',
                        icon:"icon-th-large",
                        active:"true",
                        page:""
                    },
                    {
                        id: "dataViewer",
                        name: 'dataViewer',
                icon:"",
                active:"",
                page:""
            },
            {
                id: "dataViewer",
                name: 'dataViewer',
                icon:"",
                active:"",
                page:""
            }
        ],
    },
    methods: {
        showMenuItemView: function (menu) {

        }
    }
})