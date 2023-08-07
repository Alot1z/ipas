

function renderBreadcrumb() {
    
    if (!_path) {
        reloadWithPath();
    }
    var $pathContainer = $("#path");
    var breadcrumbsHeight = 50;
    var breadcrumbsContainterWith = $pathContainer.width();
    
    $pathContainer.empty();
    if (_path === "/") {
        // $pathContainer.append('<li class="active breadcrumb-root">' +
        //     '<img class="breadcrumb-icon breadcrumb-icon-root" src="/images/app-icon.png"/>'
        //     + _device + '</li>');

        var breadcrumbRootItem = $( '<li class="active breadcrumb-root"></li>' );
        breadcrumbRootItem.text( _device );
        $pathContainer.append(breadcrumbRootItem);

        var imgRootItem = $( '<img class="breadcrumb-icon breadcrumb-icon-root"></img>' );
        imgRootItem.attr( 'src', "/images/app-icon.png" );
        breadcrumbRootItem.append(imgRootItem);

    } else {
        // $pathContainer.append('<li class="breadcrumb-root" data-path="/"><a>' +
        //     '<img class="breadcrumb-icon breadcrumb-icon-root" src="/images/app-icon.png"/>'
        //     + _device + '</a></li>');

        var breadcrumbItem = $( '<li class="breadcrumb-root"></li>' );
        breadcrumbItem.attr( 'data-path', "/" );
        breadcrumbItem.text( _device );
        $pathContainer.append(breadcrumbItem);

        var imgItem = $( '<img class="breadcrumb-icon breadcrumb-icon-root"></img>' );
        imgItem.attr( 'src', "/images/app-icon.png" );
        breadcrumbItem.append(imgItem);

        var components = _content_options.navigation;

        for (var i = 0; i < components.length - 1; ++i) {
            var breadcrumbItemPath = components[i].fullPath;
            var breadcrumbItemName = components[i].displayName;
            var breadcrumbIconPath = components[i].iconPath;
            // $pathContainer.append('<li class = "crop-breadcrumb-item" data-path="' + breadcrumbItemPath + '">' +
            //     '<a><img class="breadcrumb-icon breadcrumb-icon-child" src="' + breadcrumbIconPath + '"/>' + breadcrumbItemName + '</a>' +
            //     '</li>');

            var breadcrumbItem = $( '<li class="crop-breadcrumb-item"></li>' );
            breadcrumbItem.attr( 'data-path', breadcrumbItemPath );
            $pathContainer.append(breadcrumbItem);

            var linkItem = $( '<a></a>' );
            linkItem.text( breadcrumbItemName );
            breadcrumbItem.append(linkItem);

            var imgItem = $( '<img class="breadcrumb-icon breadcrumb-icon-child"/>' );
            imgItem.attr( 'src', breadcrumbIconPath );
            linkItem.append(imgItem);

        }

        //var lastBreadcrumbItemPath = components[components.length - 1].fullPath;
        var lastBreadcrumbItemName = components[components.length - 1].displayName;
        var lastBreadcrumbItemIconPath = components[components.length - 1].iconPath;
            
        // $pathContainer.append('<li class="active crop-breadcrumb-item">' +
        //     '<img class="breadcrumb-icon breadcrumb-icon-child" src="' + lastBreadcrumbItemIconPath + '"/>'
        //     + lastBreadcrumbItemName + '</li>');

        var breadcrumbItem = $( '<li class="active crop-breadcrumb-item"></li>' );
        breadcrumbItem.text( lastBreadcrumbItemName );
        $pathContainer.append(breadcrumbItem);

        var imgItem = $( '<img class="breadcrumb-icon breadcrumb-icon-child"></img>' );
        imgItem.attr( 'src', lastBreadcrumbItemIconPath );
        breadcrumbItem.append(imgItem);
    
        //reset max width of breadcrumb items to default 
        var cropBreadcrumbItemInitialMaxWidth = 160.0;
        var cropBreadcrumbItems = document.getElementsByClassName('crop-breadcrumb-item');
        var cropBreadcrumbItemsLength = cropBreadcrumbItems.length;
        for (var i = 0; i < cropBreadcrumbItemsLength; i++) {
            var breadcrumbItem = cropBreadcrumbItems[i]; 
            breadcrumbItem.style.maxWidth = "" + cropBreadcrumbItemInitialMaxWidth + "px";
        }

        //if items does not fit show options button with popover
        if ($pathContainer.height() > breadcrumbsHeight) {
            $pathContainer.find(".breadcrumb-root").remove();
            $pathContainer.find(".crop-breadcrumb-item:not(.active)").remove();

            var activeBreadcrumbItem = $pathContainer.find(".crop-breadcrumb-item.active");
            activeBreadcrumbItem.before('<li class="breadcrumb-expanding">' +
                    '<ol class="hidden-items"></ol>' +
                    '<div class="button-cell-options"></div>');

            var expandContainer = $pathContainer.find(".breadcrumb-expanding .hidden-items");
            var showHiddenItems = $pathContainer.find(".breadcrumb-expanding .button-cell-options");

            // expandContainer.append('<li class="crop-breadcrumb-item" data-path="/">' +
            //                        '<a class="inline-breadcrumb-popover-item">' +
            //                        '<img class="breadcrumb-icon breadcrumb-icon-root" src="/images/app-icon.png"/>' +
            //                        '<span class="doc-name">' + _device + '</span>' +
            //                        '</a></li>');

            var breadcrumbItem = $( '<li class="crop-breadcrumb-item"></li>' );
            breadcrumbItem.attr( 'data-path', "/" );
            expandContainer.append(breadcrumbItem);

            var linkItem = $( '<a class="inline-breadcrumb-popover-item"></a>' );
            breadcrumbItem.append(linkItem);

            var imgItem = $( '<img class="breadcrumb-icon breadcrumb-icon-root"/>' );
            imgItem.attr( 'src', "/images/app-icon.png" );
            linkItem.append(imgItem);

            var spanItem = $( '<span class="doc-name"></span>' );
            spanItem.text( _device );
            linkItem.append(spanItem);


            for (var j = 0; j < components.length - 1; ++j) {
                var breadcrumbItemPath = components[j].fullPath;
                var breadcrumbItemName = components[j].displayName;
                var breadcrumbIconPath = components[j].iconPath;
                
                // expandContainer.append('<li class = "crop-breadcrumb-item" data-path="' + breadcrumbItemPath + '">' +
                //     '<a class="inline-breadcrumb-popover-item">' +
                //     '<img class="breadcrumb-icon breadcrumb-icon-child" src="' + breadcrumbIconPath + '"/>' +
                //     '<span class="doc-name">' + breadcrumbItemName + '</span>' +
                //     '</a></li>');

                var breadcrumbItem = $( '<li class="crop-breadcrumb-item"></li>' );
                breadcrumbItem.attr( 'data-path', breadcrumbItemPath );
                expandContainer.append(breadcrumbItem);
    
                var linkItem = $( '<a class="inline-breadcrumb-popover-item"></a>' );
                breadcrumbItem.append(linkItem);
    
                var imgItem = $( '<img class="breadcrumb-icon breadcrumb-icon-child"/>' );
                imgItem.attr( 'src', breadcrumbIconPath );
                linkItem.append(imgItem);
    
                var spanItem = $( '<span class="doc-name"></span>' );
                spanItem.text( breadcrumbItemName );
                linkItem.append(spanItem);

            }
            
            showHiddenItems.on("click", function () {
                expandContainer.toggleClass("visible");
                if (expandContainer.hasClass("visible")) {
                    $("body").on("click", handleBreadcrumbOutsideClick);
                }
                return false;
            });
            
            //resize active breadcrumb item
            var breadcrumbOptionsItemWidth = showHiddenItems["0"].clientWidth;
            var activeBreadcrumbItemMaxWidth = (breadcrumbsContainterWith-breadcrumbOptionsItemWidth);
            activeBreadcrumbItem["0"].style.maxWidth = "" + activeBreadcrumbItemMaxWidth + "px";
        }
        else{
            
            //calculate  maxWidth for breadcrumb items 
            var breadcrumbRootItem = $pathContainer.find(".breadcrumb-root");
            var breadcrumbRootItemWidth = breadcrumbRootItem["0"].clientWidth;
            var cropBreadcrumbItemsMaxWidth = (breadcrumbsContainterWith-breadcrumbRootItemWidth);
            var cropBreadcrumbItemProportionalMaxWidth = Math.floor(cropBreadcrumbItemsMaxWidth/cropBreadcrumbItemsLength);
            var cropBreadcrumbItemsRealWidth = 0;
            var cropBreadcrumbItemCurrentPreferredMaxWidth = cropBreadcrumbItemProportionalMaxWidth;
            var cropBreadcrumbItemResultPreferredMaxWidth = cropBreadcrumbItemCurrentPreferredMaxWidth;
            
            for (var j = 0; j < 100; j++) {
                var cropBreadcrumbItemDeltaWidth = 0;
                if($pathContainer.height() > breadcrumbsHeight){
                    break;
                }
                if(cropBreadcrumbItemsRealWidth>0){
                    cropBreadcrumbItemsRealWidth = Math.ceil(cropBreadcrumbItemsRealWidth);
                    if(cropBreadcrumbItemsRealWidth>=cropBreadcrumbItemsMaxWidth){
                        break;
                    }
                    cropBreadcrumbItemDeltaWidth = Math.floor((cropBreadcrumbItemsMaxWidth-cropBreadcrumbItemsRealWidth)/cropBreadcrumbItemsLength);
                    if(cropBreadcrumbItemDeltaWidth < 1.0){
                        break;
                    }
                    cropBreadcrumbItemsRealWidth = 0;
                    cropBreadcrumbItemResultPreferredMaxWidth = cropBreadcrumbItemCurrentPreferredMaxWidth;
                    cropBreadcrumbItemCurrentPreferredMaxWidth+=cropBreadcrumbItemDeltaWidth;
                }
                for (var i = 0; i < cropBreadcrumbItemsLength; i++) {
                    var breadcrumbItem = cropBreadcrumbItems[i]; 
                    if(cropBreadcrumbItemDeltaWidth>0){
                        var fixedMaxWidth = breadcrumbItem.clientWidth + cropBreadcrumbItemDeltaWidth;
                        breadcrumbItem.style.maxWidth = "" + fixedMaxWidth + "px";
                    }
                    else{
                        breadcrumbItem.style.maxWidth = "" + cropBreadcrumbItemProportionalMaxWidth + "px";
                    }
                    cropBreadcrumbItemsRealWidth += breadcrumbItem.clientWidth;
                }
            }
            
            //assign max width for breadcrumb items
            for (var i = 0; i < cropBreadcrumbItemsLength; i++) {
                var breadcrumbItem = cropBreadcrumbItems[i]; 
                breadcrumbItem.style.maxWidth = "" + cropBreadcrumbItemResultPreferredMaxWidth + "px";
            }
                
        }

        $pathContainer.find("li").click(function (event) {
            var path = $(this).data("path");
            if (path) {
                window.location.hash = "#" + encodeURIComponent(path);
                event.preventDefault();
            }
        });
    }
}

var handleBreadcrumbOutsideClick = function (event) {
    var hiddenItems = $(".hidden-items");
    var body = $("body");
    hiddenItems.removeClass("visible");
    body.off("click", handleBreadcrumbOutsideClick);
};


var _resizeTimeout;
$(window).on("resize", function () {
    clearTimeout(_resizeTimeout);
    _resizeTimeout = setTimeout(function () {
        renderBreadcrumb();
    }, 10);
});

