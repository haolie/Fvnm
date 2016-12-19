jQuery(function ($) {
    $("#eventInputLi").click(function () {
        $("#myModal").modal("show");
    });

    $("#modalUpdata").click(function () {
        var checked = true;
        $("#locationInput").value
    });

    //清空上次提交记录
    $("#myModal").on("show.bs.modal", function () {
        $(this).find("input").each(function () {
            this.type == "text" && (this.value = "");
            this.type == "checkbox" && (this.checked = false);
            this.type == "checkbox" && (this.disabled = false);
            this.type == "file" && (this.value = "");
            this.id == "occurTimeInput" && (this.value = new Date().toISOString().substr(0, 16));
            this.id == "recoverTimeInput" && (this.value = new Date().toISOString().substr(0, 16));
        })

        $(this).find("select").each(function () {
            this.selectedIndex = 0;
        })

        $("#xcqk").find("input").each(function () {
            this.value = 0;
        })
    })


    //事故原因逻辑
    $("table#reasonTable input").change(function (e) {
        var selectedGroup = $(this).parents("div .list-inline")[0];
        var curGroup = $(selectedGroup).find("input");
        var check = false;
        for (i = 0; i < curGroup.length; i++) {
            if (curGroup[i].type == "checkbox")
                check = check || curGroup[i].checked;
            else if (curGroup[i].type == "text")
                check = check || (curGroup[i].value)
        }

        var t = $("#occurTimeInput")[0];
        var mydate = new Date();
        var iso = mydate.toISOString();
        iso = iso.substr(0, 16);
        var ts = mydate.getFullYear() + '-' + mydate.getMonth() + '-' + mydate.getDay() + 'T' + mydate.getHours() + ':' + mydate.getMinutes();
        t.value = iso;
        // mydate = $(maydate).DateAdd("h",4)

        var allInput = $("table#reasonTable input");
        for (i = 0; i < allInput.length; i++) {

            if ($(allInput[i]).parents("div .list-inline")[0] != selectedGroup) {
                allInput[i].disabled = check;
                check || (allInput[i].checked = false);

            }
        }
    });

    //上传图片
    try {
        Dropzone.autoDiscover = false;
        var myDropzone = new Dropzone(".dropzone", {
            paramName: "file", // The name that will be used to transfer the file
            maxFilesize: 0.5, // MB

            addRemoveLinks: false,
            dictDefaultMessage:
            ' \ <br /> \
				<i class="upload-icon ace-icon fa fa-cloud-upload blue fa-3x" style="margin-top:0px"></i>'
      ,


            //change the previewTemplate to use Bootstrap progress bars
            previewTemplate: "<div class=\"dz-preview dz-file-preview\">\n  <div class=\"dz-details\">\n  <img data-dz-thumbnail />\n  </div>\n</div>"
        });

        $(document).one('ajaxloadstart.page', function (e) {
            try {
                myDropzone.destroy();
            } catch (e) { }
        });

    } catch (e) {
        alert('Dropzone.js does not support older browsers!');
    }

});