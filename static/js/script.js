$(document).ready(function() {
    // Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $(window).resize(refresh_tags);

    $("#tags ul .tag").click(function() {
        $(this).toggleClass('active');
        refresh_resources();
    });

    $("#add-new-tag").click(function() {
        $("#add-new-tag-dialog").dialog("open");
    });

    $("#add-new-tag-dialog").dialog({
        autoOpen: false,
        buttons: {
            "Add": function() {
                var $new_tag_name = $("#new-tag-name").val();
                var $dialog = $(this);

                $.ajax({
                    type: "POST",
                    url: "/add-new-tag",
                    contentType: "application/json",
                    data: JSON.stringify($new_tag_name),
                }).done(function(data) {
                    if(data.status == 'success') {
                        $("#tags ul .tag:first").before(
                            $(data['tag-html']).click(function() {
                                $(this).toggleClass('active')
                                refresh_resources();
                            })
                        );
                        $dialog.dialog("close");
                        refresh_tags();
                    } else {
                        $("#add-new-tag-dialog .error").html("Duplicated tag")
                    }
                });
            },
            Cancel: function() {
                $(this).dialog("close");
                $("#add-new-tag-dialog #new-tag-name").val("");
                $("#add-new-tag-dialog .error").html("");
            }
        },
        closeOnEspace: true,
        modal: true
    });

    $("#tags ul .arrow-left").click(previous_group_of_tags);

    $("#tags ul .arrow-right").click(next_group_of_tags);

    $("#new-files").click(function() {
        $.ajax({
            type: "GET",
            url: "/new-files",
        }).done(function(data) {
            $("#resources").html(data);
        });
    });
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    refresh_tags();
});

// Global variables ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var amount_of_tags_to_show = 0;
var current_tag_index = 0;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function next_group_of_tags() {
    var $tags = $("#tags ul .tag");

    current_tag_index += amount_of_tags_to_show;
    while(current_tag_index > 0 && current_tag_index > $tags.length - amount_of_tags_to_show) { current_tag_index-- }
    refresh_tags();
}

function previous_group_of_tags() {
    var $tags = $("#tags ul .tag");

    current_tag_index -= amount_of_tags_to_show;
    while(current_tag_index < 0) { current_tag_index++ }
    refresh_tags();
}

function refresh_tags() {
    var $tags = $("#tags ul .tag");

    if($(window).width() >= 720) {
        amount_of_tags_to_show = 8;
    } else {
        amount_of_tags_to_show = 4;
    }

    $tags.each(function(index) {
        if(current_tag_index <= index && index < (current_tag_index + amount_of_tags_to_show)) {
            $(this).css("display", "block");
        } else {
            $(this).css("display", "none");
        }
    });

    var $arrow_right = $("#tags ul .arrow-right");
    $arrow_right.removeClass();
    $arrow_right.addClass("arrow-right col-xs-1 col-sm-1");

    if($tags.length - current_tag_index < amount_of_tags_to_show) {
        var offset = amount_of_tags_to_show - ($tags.length - current_tag_index);
        $arrow_right.addClass("col-sm-offset-" + offset);
    }
}

function refresh_resources() {
    var tags_ids = [];
    var regex = /tag-([0-9]+)/;

    $("#tags ul .tag.active").each(function(index) {
        tags_ids[index] = $(this).html().split(regex)[1];
    });

    $.ajax({
        type: "POST",
        url: "/explorer",
        contentType: "application/json",
        data: JSON.stringify(tags_ids),
    }).done(function(data) {
        $("#resources").html(data);
    });
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
