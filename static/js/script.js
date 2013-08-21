$(document).ready(function() {
    searches_handler = new NavHandler("#searches .row .search", "#searches .row .arrow-right", 2, 10);
    searches_handler.refresh_lis();

    tags_handler = new NavHandler("#tags .row .tag", "#tags .row .arrow-right", 2, 8);
    tags_handler.refresh_lis();

    // Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $(window).resize(function() {
        searches_handler.refresh_lis();
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

    $("#new-files").click(function() {
        $.ajax({
            url: "/new-files",
            type: "GET",
        }).done(function(data) {
            $("#resources").html(data);
        });
    });

    $("#save-search-modal").on('hidden.bs.modal', function() {
        $("#save-search-modal #new-search-name").val("");
        $("#save-search-modal .error").html("");
    });

    $("#save-search-modal button.mycls").click(function() {
        $("#save-search-modal").modal("hide");
    });

    $("#save-search-modal button.save").click(function() {
        var tags_ids = [];
        var regex = /tag-([0-9]+)/;
        var search_name = $("#save-search-modal #new-search-name").val()

        $("#tags .row .tag.active").each(function(index) {
            tags_ids[index] = $(this).html().split(regex)[1];
        });

        if(!search_name) { return; }

        if(tags_ids.length === 0) {
            $("#save-search-modal .error").html("You can't save a void search");
            return;
        }

        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify({
                search_name: search_name,
                tags_ids: tags_ids
            }),
            type: 'POST',
            url: '/save-search'
        }).done(function(json) {
            if(json.status === 'success') {
                $("#searches .row .search:first").before(
                    $(json['search-html']).click(function() {
                        $(this).toggleClass('active');
                    })
                );
                $("#save-search-modal").modal("hide");
                searches_handler.refresh_lis();

            } else {
                $("#save-search-modal .error").html("This search already exists");
            }
        });
    });

    $("#search-options-modal button.mycls").click(function() {
        $("#search-options-modal").modal("hide");
    });

    $("#searches .row .search").click(function() {
        $(this).toggleClass('active');
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
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
});

// Classes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function NavHandler(lis_selector, right_arrow_selector, xs, sm) {
    this.$lis = $(lis_selector);
    this.$right_arrow = $(right_arrow_selector);
    this.amount_of_lis_to_show = 0;
    this.first_li_to_show = 0;
    this.lis_selector = lis_selector;
    this.right_arrow_default_classes = this.$right_arrow.attr("class");
    this.sm = sm;
    this.xs = xs;
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
        this.amount_of_lis_to_show = this.sm;

    } else {
        this.amount_of_lis_to_show = this.xs;
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
