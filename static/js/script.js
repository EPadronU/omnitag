$(document).ready(function() {
    tags_handler = new NavHandler("#tags .row .tag", "#tags .row .arrow-right");
    tags_handler.refresh_lis();

    // Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $(window).resize(function() {
        tags_handler.refresh_lis();
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
                $("#tags .row .tag:first").before(
                    $(json['tag-html']).click(function() {
                        $(this).toggleClass('active');
                    })
                );
                $("#add-new-tag-modal").modal("hide");
                tags_handler.refresh_lis();

            } else {
                $("#add-new-tag-modal .error").html("Duplicated tag");
            }
        });
    });

    $("#tags .row .arrow-left").click(function() {
        tags_handler.previous_group_of_lis();
    });

    $("#tags .row .arrow-right").click(function() {
        tags_handler.next_group_of_lis();
    });

    $("#tags .row .tag").click(function() {
        $(this).toggleClass('active');
        refresh_resources();
    });

    $("#new-files").click(function() {
        $.ajax({
            url: "/new-files",
            type: "GET",
        }).done(function(data) {
            $("#resources").html(data);
        });
    });

    $("#search-options-modal button.mycls").click(function() {
        $("#search-options-modal").modal("hide");
    });
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
});

// Classes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function NavHandler(lis_selector, right_arrow_selector) {
    this.$lis = $(lis_selector);
    this.$right_arrow = $(right_arrow_selector);
    this.amount_of_lis_to_show = 0;
    this.first_li_to_show = 0;
    this.lis_selector = lis_selector;
    this.right_arrow_default_classes = this.$right_arrow.attr("class");
}
NavHandler.prototype.next_group_of_lis = function() {
    this.first_li_to_show += this.amount_of_lis_to_show;
    while(this.first_li_to_show > 0 && this.first_li_to_show > this.$lis.length - this.amount_of_lis_to_show) { --this.first_li_to_show }
    this.refresh_lis();
}
NavHandler.prototype.previous_group_of_lis = function() {
    this.first_li_to_show -= this.amount_of_lis_to_show;
    while(this.first_li_to_show < 0) { ++this.first_li_to_show }
    this.refresh_lis();
}
NavHandler.prototype.refresh_lis = function() {
    this.$lis = $(this.lis_selector);

    if($(window).width() >= 720) {
        this.amount_of_lis_to_show = 8;

    } else {
        this.amount_of_lis_to_show = 2;
    }

    var first_li_to_show = this.first_li_to_show;
    var amount_of_lis_to_show = this.amount_of_lis_to_show;

    this.$lis.each(function(index) {
        if(first_li_to_show <= index && index < (first_li_to_show + amount_of_lis_to_show)) {
            $(this).css("display", "block");

        } else {
            $(this).css("display", "none");
        }
    });

    this.$right_arrow.attr("class", this.right_arrow_default_classes);

    if(this.$lis.length - this.first_li_to_show < this.amount_of_lis_to_show) {
        var offset = this.amount_of_lis_to_show - (this.$lis.length - this.first_li_to_show);
        this.$right_arrow.addClass("col-sm-offset-" + offset);
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Functions ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function refresh_resources() {
    var tags_ids = [];
    var regex = /tag-([0-9]+)/;

    $("#tags .row .tag.active").each(function(index) {
        tags_ids[index] = $(this).html().split(regex)[1];
    });

    $.ajax({
        contentType: "application/json",
        data: JSON.stringify(tags_ids),
        type: "POST",
        url: "/explorer"
    }).done(function(data) {
        $("#resources").html(data);
    });
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
