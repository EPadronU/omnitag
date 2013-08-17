$(document).ready(function() {
    $("#tags ul .tag").on('click', function() {
        $(this).toggleClass('active');
        update_resources();
    });

    $("#add-tag").on('click', function() {
        var tag_name = prompt("Give your new tag a name");

        $.ajax({
            type: "POST",
            url: "/add-tag",
            contentType: "application/json",
            data: JSON.stringify(tag_name),
            dataType: "html"
        }).done(function(json) {
            var data = JSON.parse(json);
            alert(data.status);
            window.location.reload();
        });
    });
});



function update_resources() {
    var regex = /tag-([0-9]+)/;
    var ids = [];

    $("#tags ul .tag.active").each(function(index) {
        ids[index] = $(this).children("a").attr("href").split(regex)[1];
    });

    $.ajax({
        type: "POST",
        url: "/explorer",
        contentType: "application/json",
        data: JSON.stringify(ids),
        dataType: "html"
    }).done(function(data) {
        $("#main-section").html(data);
    });
}
