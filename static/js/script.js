$(document).ready(function() {
    // Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $(window).resize(refresh_tags);

    $("#tags ul .tag").click(function() {
        $(this).toggleClass('active');
        refresh_resources();
    });

    $("#add-new-tag-modal").on('hidden.bs.modal', function() {
        $("#add-new-tag-modal #new-tag-name").val("");
        $("#add-new-tag-modal .error").html("");
    });

    $("#add-new-tag-modal button.mycls").click(function() {
        $("#add-new-tag-modal").modal("hide");
    });

    $("#add-new-tag-modal button.save").click(function() {
        var tag_name = $("#add-new-tag-modal #new-tag-name").val()

        if(!tag_name) { return }

        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify(tag_name),
            type: 'POST',
            url: '/add-new-tag'
        }).done(function(json) {
            if(json.status === 'success') {
                $("#tags ul .tag:first").before(
                    $(json['tag-html']).click(function() {
                        $(this).toggleClass('active');
                    })
                );
                $("#add-new-tag-modal").modal("hide");
                refresh_tags();

            } else {
                $("#add-new-tag-modal .error").html("Duplicated tag");
            }
        });
    });

    $("#search-options-modal button.mycls").click(function() {
        $("#search-options-modal").modal("hide");
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
        amount_of_tags_to_show = 2;
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
    $arrow_right.addClass("arrow-right col-xs-2 col-sm-1");

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
