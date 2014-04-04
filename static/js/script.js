$(document).ready(function() {
    searches_handler = new NavHandler("#searches .row .search", "#searches .row .arrow-right", 2, 10);
    tags_handler = new NavHandler("#tags .row .tag", "#tags .row .arrow-right", 2, 8);

    refresh_tags_and_searches();

    // Events ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    $(window).resize(function() {
        searches_handler.refresh_lis();
        tags_handler.refresh_lis();
    });

    $("#add-new-tag-modal").on('hidden.bs.modal', function() {
        $("#add-new-tag-modal #new-tag-name").val("");
        $("#add-new-tag-modal .error").html("");
    });

    $("#add-new-tag-modal button.save").click(function() {
        var tag_name = $("#add-new-tag-modal #new-tag-name").val();

        if(!tag_name) { return }

        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify({
                tag_name: tag_name
            }),
            type: 'POST',
            url: '/tag'
        }).done(function(json) {
            if(json.status === 'success') {
                $("#add-new-tag-modal").modal("hide");
                $("#tags .row li:nth-child(2)").after(
                    $(json['tag-html']).click(tag_behaviour)
                );
                tags_handler.refresh_lis();

            } else {
                $("#add-new-tag-modal .error").html("Duplicated tag");
            }
        });
    });

    $("#new-files").click(function() {
        $.ajax({
            url: "/untagged-resources",
            type: "GET",
        }).success(function(data) {
            $("#resources .row").html(data);
            $.each($("#resources .row .resource a"), function(i, item) {
                resource_behaviour($(item));
            })
        });
    });

    $("#resources #select-all-none").click(function() {
        $(this).toggleClass("active");

        if($(this).hasClass("active")) {
            $("#resources .row .resource a").addClass("active");

        } else {
            $("#resources .row .resource a").removeClass("active");
        }
    });

    $("#save-search-modal").on('hidden.bs.modal', function() {
        $("#save-search-modal #new-search-name").val("");
        $("#save-search-modal .error").html("");
    });

    $("#save-search-modal button.save").click(function() {
        var tags_ids = get_active_tags_ids();
        var search_name = $("#save-search-modal #new-search-name").val();

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
            url: '/search'
        }).done(function(json) {
            if(json.status === 'success') {
                $("#save-search-modal").modal("hide");
                $("#searches .row li:first").after(
                    $(json['search-html']).click(search_behaviour)
                );
                searches_handler.refresh_lis();

            } else {
                $("#save-search-modal .error").html("This search already exists");
            }
        });
    });

    $("#searches .row .arrow-left").click(function() {
        searches_handler.previous_group_of_lis();
    });

    $("#searches .row .arrow-right").click(function() {
        searches_handler.next_group_of_lis();
    });

    $("#searches .row .search").click(search_behaviour);

    $("#tags .row .arrow-left").click(function() {
        tags_handler.previous_group_of_lis();
    });

    $("#tags .row .arrow-right").click(function() {
        tags_handler.next_group_of_lis();
    });

    $('#devices-modal').on('show.bs.modal', function() {
        load_devices($(this));
    });

    $('#tags-and-searches-modal').on('show.bs.modal', function() {
        load_tag_search_general_view($(this));
    });

    $('#tags-and-searches-modal').on('show.bs.modal', function() {
        $(this).find('.icon-undo').click();
    });

    $('#settings-modal').on('show.bs.modal', function() {
        var $this = $(this);

        $.ajax({
            type: 'GET',
            url: '/settings',
        }).success(function(response) {
            $this.find('#token').val(response.token);
            $this.find('#firstname').val(response.firstname);
            $this.find('#lastname').val(response.lastname);
        });
    });

    $('#settings-modal .btn-default').click(function() {
        var $this = $('#settings-modal');
        var firstname = $this.find('#firstname').val();
        var lastname = $this.find('#lastname').val();

        $.ajax({
            type: 'POST',
            url: '/settings',
            contentType: 'application/json',
            data: JSON.stringify({firstname: firstname, lastname: lastname}),
        });
    });
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
});

// Classes ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function NavHandler(lis_selector, right_arrow_selector, xs, sm) {
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

    if($(window).width() >= 768) {
        this.amount_of_lis_to_show = this.sm;

    } else {
        this.amount_of_lis_to_show = this.xs;
    }

    // To expose this variables to the following block of code
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
function get_active_resources_ids() {
    var resources_ids = [];

    $("#resources .row .resource a.active").each(function(index) {
        resources_ids[index] = $(this).attr('data-id');
    });
    return resources_ids;
}


function get_active_tags_ids() {
    var tags_ids = [];

    $("#tags .row .tag.active").each(function(index) {
        tags_ids[index] = $(this).html().split(/tag-([0-9]+)/)[1];
    });
    return tags_ids;
}


function refresh_resources() {
    $.ajax({
        contentType: "application/json",
        data: JSON.stringify({
            tags_ids: get_active_tags_ids()
        }),
        type: "POST",
        url: "/tag-resources"
    }).done(function(data) {
        $("#resources .row").html(data);
        $.each($("#resources .row .resource a"), function(i, item) {
            resource_behaviour($(item));
        })
    });
}


function resource_behaviour($el) {
    $el.click(function() {
        $el.toggleClass("active");

        if($('#resources .row .resource a.active').length >= 1) {
            $("#resources #select-all-none").addClass("active");

        } else {
            $("#resources #select-all-none").removeClass("active");
        }

    }).dblclick(function() {
        $.ajax({
            url: '/resource/' + $el.attr('data-id'),
            type: 'GET',
        }).success(function(data) {
            var $modal = $('#detailed-resource-view-modal');
            $modal.find('#detailed-resource-view-name').html(data.result.name);
            $modal.find('#detailed-resource-view-device').html(data.result.device.name);
            $modal.find('#detailed-resource-view-path').html(data.result.path);
            $modal.modal('show');
        });
    });
}


function search_behaviour() {
    $.ajax({
        data: {
            search_id: $(this).html().split(/search-([0-9]+)/)[1]
        },
        type: 'GET',
        url: '/search'
    }).done(function(json) {
        if(json.status === 'success') {
            $("#tags .row .tag").each(function() {
                var tag_id = parseInt($(this).html().split(/tag-([0-9]+)/)[1]);

                if(json.tags_ids.indexOf(tag_id) !== -1) {
                    $(this).addClass("active");

                } else {
                    $(this).removeClass("active");
                }
            });
            refresh_resources();
            $('#search-options-modal').modal('hide');
        }
    });
    $('#searches .search').removeClass('active');
    $(this).toggleClass('active');
}


function tag_behaviour() {
    $(this).toggleClass('active');

    var action;
    var active_resources = get_active_resources_ids();

    if(active_resources.length !== 0) {
        if($(this).hasClass('active')) {
            action = 'add';

        } else {
            action = 'remove';
        }
    }

    if(action) {
        $.ajax({
            contentType: 'application/json',
            data: JSON.stringify({
                action: action,
                resources_ids: active_resources,
                tag_id: $(this).html().split(/tag-([0-9]+)/)[1]
            }),
            type: 'POST',
            url: '/update-resources-tags'
        });

    } else {
        refresh_resources();
    }
}


function tag_and_search_edit_or_delete(type, cls, id, new_name) {
    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify({
            id: id,
            new_name: new_name,
        }),
        type: type,
        url: '/' + cls,
    });
}


function load_devices($el) {
    var device_template = _.template($('#device-template').html());
    var devices_template = _.template($('#devices-template').html());
    var add_device_template = _.template($('#add-device-template').html());
    var show_device_template = _.template($('#show-device-template').html());

    $.ajax({
        contentType: 'application/json',
        url: '/device',
    }).success(function(data) {
        var $devices = $(devices_template());

        $.each(data.result, function(i, device) {
            var $device = $(device_template({id: device.id, name: device.name}));

            $device.find('a').click(function() {
                var $show_device = $(show_device_template({id: device.id, name: device.name, token: device.token}));

                $show_device.find('.icon-disk').click(function() {
                    $.ajax({
                        contentType: 'application/json',
                        data: JSON.stringify({
                            new_name: $show_device.find('#device-name input').val(),
                        }),
                        method: 'PUT',
                        url: '/device/' + device.id,
                    }).success(function() {
                        $el.trigger('show.bs.modal');
                    });
                });

                $show_device.find('.icon-trashcan').click(function() {
                    $.ajax({
                        contentType: 'application/json',
                        data: JSON.stringify({
                            id: device.id,
                        }),
                        method: 'DELETE',
                        url: '/device/' + device.id,
                    }).success(function() {
                        $el.trigger('show.bs.modal');
                    });
                });

                $show_device.find('.icon-undo').click(function() {
                    $el.trigger('show.bs.modal');
                });

                $el.find('.modal-body').html($show_device);
            });

            $devices.find('ul').append($device);
        });

        $devices.find('.icon-plus').click(function() {
            var $add_device = $(add_device_template());

            $add_device.find('.icon-disk').click(function() {
                var device_name = $add_device.find('#device-name input').val();

                if(!device_name) return;

                $.ajax({
                    contentType: 'application/json',
                    data: JSON.stringify({
                        device_name: device_name,
                    }),
                    method: 'POST',
                    url: '/device',
                }).success(function() {
                    $el.trigger('show.bs.modal');
                });
            });

            $add_device.find('.icon-undo').click(function() {
                $el.trigger('show.bs.modal');
            });

            $el.find('.modal-body').html($add_device);
        });

        $el.find('.modal-body').html($devices);
    });
}


function load_tag_search_general_view($modal) {
    var template = _.template('<li class="col-xs-6 col-sm-3 <%= cls %>"><a href="<%= href %>"> <%= val %> </a></li>');

    var $el = $modal.find('#view-tags ul').empty();
    $('#tags .tag a').each(function(i, item) {
        $el.append(template({href: $(item).attr('href'), val: $(item).html(), cls: 'tag'}));
    });

    var $el = $modal.find('#view-searches ul').empty();
    $('#searches .search a').each(function(i, item) {
        $el.append(template({href: $(item).attr('href'), val: $(item).html(), cls: 'search'}));
    });

    $modal.find('li.tag a').click(function() {
        load_tag_search_detailed_view($(this), 'tag');
    })

    $modal.find('li.search a').click(function() {
        load_tag_search_detailed_view($(this), 'search');
    })
}


function load_tag_search_detailed_view($el, cls) {
    var template = _.template($('#tag-search-detailed-view-template').html());
    var $modal = $('#tags-and-searches-modal');
    var old_modal_body = $modal.find('.modal-body').html();

    $modal.find('.modal-body').html(template({
        id: $el.attr('href').split(/tag-([0-9]+)/)[1] || $el.attr('href').split(/search-([0-9]+)/)[1],
        name: $el.html(),
    }));

    $modal.find('.modal-body .icon-disk').click(function() {
        var $el = $(this);
        tag_and_search_edit_or_delete('PUT', cls, $el.attr('data-id'), $modal.find('.modal-body .name').val());
        refresh_tags_and_searches();
        $modal.find('.modal-body .icon-undo').click();
    });

    $modal.find('.modal-body .icon-trashcan').click(function() {
        var $el = $(this);
        tag_and_search_edit_or_delete('DELETE', cls, $el.attr('data-id'), $modal.find('.modal-body .name').attr('value'));
        refresh_tags_and_searches();
        $modal.find('.modal-body .icon-undo').click();
    });

    $modal.find('.modal-body .icon-undo').click(function() {
        $modal.find('.modal-body').html(old_modal_body);
        load_tag_search_general_view($modal);
    });
}


function refresh_tags_and_searches() {
    $.ajax({
        type: 'GET',
        url: '/searches'
    }).success(function (response) {
        var  template =  _.template('<li class="search col-xs-2 col-sm-1"><a class="animated" href="#search-<%= id %>"> <%= name %> </a></li>');
        var $el = $('#searches li.arrow-left');

        $('#searches .search').remove();
        $.each(response.result, function(i, item) {
            var tag = template
            $el.after(template({id: item.id, name: item.name}));
        });

        $('#searches .search').click(search_behaviour);
        searches_handler.refresh_lis();
    });

    $.ajax({
        type: 'GET',
        url: '/tags'
    }).success(function (response) {
        var  template =  _.template('<li class="tag col-xs-2 col-sm-1"><a class="animated" href="#tag-<%= id %>"> <%= name %> </a></li>');
        var $el = $('#tags ul li.arrow-left');

        $('#tags .tag').remove();
        $.each(response.result, function(i, item) {
            $el.after(template({id: item.id, name: item.name}));
        });

        $('#tags .tag').click(tag_behaviour);
        tags_handler.refresh_lis();
    });
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
