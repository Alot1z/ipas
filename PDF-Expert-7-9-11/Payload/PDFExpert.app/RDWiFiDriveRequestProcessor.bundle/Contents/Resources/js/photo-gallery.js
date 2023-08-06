
var _photo_gallery_visible = false;

var _photo_swipe_gallery = null;

var _photo_grid_gallery = null;
var _photo_grid_gallery_needs_update = false;
var _photo_grid_gallery_data_current_index = 0;
    
//http://photoswipe.com/documentation/getting-started.html
function initPhotoSwipe(gallerySelector) {

    // find nearest parent element
    var closest = function closest(el, fn) {
        return el && ( fn(el) ? el : closest(el.parentNode, fn) );
    };

    // triggers when user clicks on thumbnail
    var onThumbnailsClick = function(e) {
        e = e || window.event;
        //e.preventDefault ? e.preventDefault() : e.returnValue = false;
        
        var eTarget = e.target || e.srcElement;

        // find root element of slide
        var clickedListItem = closest(eTarget, function(el) {
            return (el.tagName && el.tagName.toUpperCase() === 'IMG');
        });

        if(!clickedListItem) {
            return;
        }

        var clickedGallery = clickedListItem.parentNode.parentNode;
        var index = clickedListItem.getAttribute('data-index');
        var video = clickedListItem.getAttribute('data-video-src'); 

        if(video!==undefined && video!==null && video.length > 1 ){
            setTimeout(function () {
               openInNewTabURL("rdwifidrive/open?sid="+getSID()+"&path=" + encodeURIComponent(video));
            }, 0);
        }
        else if(index >= 0) {
            // open PhotoSwipe if valid index found
            openPhotoSwipe( index, clickedGallery, false);
        }
        return false;
    };

    var openPhotoSwipe = function(index, galleryElement, disableAnimation) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;

        items = buildPhotoSwipeGalleryElementsFromContentData(0,true);

        // define options (if needed)
        options = {

            // define gallery index (for URL)
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),
            
            //disable hash change
            history : false,
            
            //disable share button
            shareEl: true,
            
            getThumbBoundsFn: function(index) {
                try { 
                    // See Options -> getThumbBoundsFn section of documentation for more info
                    var thumbnail = items[index].el.getElementsByTagName('img')[0]; // find thumbnail
                    var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
                    var rect = thumbnail.getBoundingClientRect(); 
                    //var elrect = items[index].elrect;
                    //var rect = elrect; 
                    return {x:rect.left, y:rect.top + pageYScroll, w:rect.width, h:rect.height};
                }catch(error) {
                    return {x:0, y:0, w:0, h:0};
                }
            },

        };

        options.index = parseInt(index, 10);

        // exit if index not found
        if( isNaN(options.index) ) {
            return;
        }

        if(disableAnimation) {
            options.showAnimationDuration = 0;
        }

        // Pass data to PhotoSwipe and initialize it
        gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.init();
        
        // Share(Download) button clicked
        gallery.listen('download', function(e, target) { 
            var path = gallery.currItem.path;
            downloadItemAtPath(path);
        });
        
        //Scroll document to last visible photo
        gallery.listen('destroy', function() {
            scrollWindownToCurrentPhotoSwipeItem();
            _photo_swipe_gallery = null;
        });
        
        gallery.listen('close', function() { 
            //notify server
            sendWebCommand("PHOTO_SWIPE_WILL_CLOSE");
            resumePhotoLoadingQueue();
            resumePhotoPrefetchQueue();
        });
        
        //notify server
        sendWebCommand("PHOTO_SWIPE_WILL_OPEN");
        
        pausePhotoLoadingQueue();
        pausePhotoPrefetchQueue();
        
        _photo_swipe_gallery = gallery;
    };

    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }
    
};

function scrollWindownToCurrentPhotoSwipeItem() {
    try {
        var index = _photo_swipe_gallery.getCurrentIndex();
        var position = _photo_swipe_gallery.options.getThumbBoundsFn(index);
        var scrollX = window.scrollX;
        var scrollY = window.scrollY;
        var innerHeight = window.innerHeight;
        var posYMid = position.y+position.h*0.5;
        var posYTop = position.y;
        var posYBottom = position.y+position.h;
        var pointInside = (posYTop>=scrollY && posYTop<=(scrollY+innerHeight)) || (posYBottom>=scrollY && posYBottom<=(scrollY+innerHeight));
        if(pointInside===false){
            window.scrollTo(scrollX, posYMid);
        }
    }
    catch(error) {}
}



function buildPhotoSwipeGalleryElementsFromContentData(startIndex,assignLinkEl) {

    var result_items = [];

    //parse content data and build slide objects
    for (var i = startIndex, file; file = _content_data[i]; i++) {

        //use original photos for large displays (TV)
        var photoPath = file.photoOriginal;
        var photoSize = file.photoOriginalSize;
        
        //use smaller photos for desktop monitors
        if(window.innerWidth<2000){
            photoPath = file.photoLargeThumbnail;
            photoSize = file.photoLargeThumbnailSize;
        }

        var size = photoSize.split('x');

        // create slide object
        var item = {
            src: photoPath+"&source=photoswipe",
            w: parseInt(size[0], 10),
            h: parseInt(size[1], 10)
        };

        //retrieving thumbnail url
        item.msrc = file.photoLargeThumbnail+"&source=photoswipe";

        //original file path
        item.path = file.path;

        result_items.push(item);

    }

    if(assignLinkEl===true){
        //parse all existing links <a> in photo gallery and assign them to result array
        var thumbElements = $('#photo-gallery-body .photo-cell');
        var numNodes = thumbElements.length;

        for(var i = 0; i < numNodes; i++) {
            
            var linkEl = thumbElements[i]; // <a> element
            var linkIndex = linkEl.getAttribute('data-index');
            
            // save link to element for getThumbBoundsFn
            result_items[linkIndex].el = linkEl; 
            
            // save link rect for getThumbBoundsFn
            //var thumbnail = linkEl.getElementsByTagName('img')[0];
            //var elrect = thumbnail.getBoundingClientRect(); 
            //result_items[linkIndex].elrect = elrect;
            
        }
    }

    return result_items;

};

function pushMissedItemsToPhotoSwipeGalleryIfVisible() {
    if(isPhotoGalleryVisible() && _photo_swipe_gallery!==null){
        var additionalItems = buildPhotoSwipeGalleryElementsFromContentData(_photo_grid_gallery_data_current_index+1,false);
        var numItems = additionalItems.length;
        for(var i = 0; i < numItems; i++) {
            var item = additionalItems[i];
            _photo_swipe_gallery.items.push(item);
        }
        _photo_swipe_gallery.ui.update();
    }
}

function isPhotoGalleryVisible() {
    return _photo_gallery_visible;
}

function showErrorOnPhotoSwipeGallery(message, textStatus, errorThrown) {
    if(_photo_swipe_gallery!==null){

        $("#pswp_alerts").prepend(tmpl("template-pswp-alert", {
                    level: "danger",
                    title: (errorThrown != "" ? errorThrown : textStatus) + ": ",
                    description: message
        }));

        //alert callbacks
        $('#pswp-error-alert').on('closed.bs.alert', function () {
            alertDismissed();
        });

        $("#btn-close-alert").click(function (event) {
            alertDismissed();
        }); 

        hideAllErrorsAfterTimeout(3000);
        
        return true;
    }
    return false;
}

function hidePhotoGallery() {
    _photo_gallery_visible = false;  
    resetPhotoLoadingQueue();
    clearPhotoCellImageSrc();
    emptyPhotoGalleryBody();
    hidePhotoGalleryBody();
    destroyPhotoGallery();
}

//http://miromannino.github.io/Justified-Gallery/lightboxes/
function showPhotoGallery() {
    _photo_gallery_visible = true;
    initPhotoGridGallery();
    initPhotoSwipeGallery();
}

function clearPhotoCellImageSrc() {
    //clear src attribute for exiting cells
    $('.photo-cell-image').each(function() {
        $(this).attr('src', '/images/blank.gif');
        $(this).attr('onload', null);
        $(this).attr('onerror', null);
        $(this).data('jg.originalSrc', undefined);
        $(this).data('safe-src', undefined);
    });
    
}
function emptyPhotoGalleryBody() {
    $("#photo-gallery-body").empty();
}

function hidePhotoGalleryBody() {
    DomUtils.hideElement($("#photo-gallery-body"));
}

function destroyPhotoGallery() {
    destroyPhotoGridGallery();
    destroyPhotoSwipeGallery();
}

function destroyPhotoGridGallery() {
    $('#photo-gallery-body').justifiedGallery('destroy');
    _photo_grid_gallery = null;
}

function destroyPhotoSwipeGallery() {
    if(_photo_swipe_gallery!==null){
        try { _photo_swipe_gallery.destroy();}catch(error) {}
    }
    _photo_swipe_gallery = null;
}

function initPhotoSwipeGallery() {
    initPhotoSwipe(".photo-gallery-body");
}

function initPhotoGridGallery() {
    _photo_grid_gallery = $('#photo-gallery-body').justifiedGallery({
        captions: false,
        waitThumbnailsLoad: false,
        sort: false,
        filter : false,
        rowHeight : 220,
        maxRowHeight : 320,
        imagesAnimationDuration : 250,
        lastRow : 'nojustify',
        margins : 4
    }).on('jg.complete', function () {
        //log.log("photo_gallery.complete");
        updatePhotoGridGallery(false);
    });
}

function isPhotoGridGalleryNeedsUpdate() {
    return _photo_grid_gallery_needs_update;
}

//http://miromannino.github.io/Justified-Gallery/
function updatePhotoGridGallery(forced) {
    if(isPhotoGalleryVisible() && (isPhotoGridGalleryNeedsUpdate() || forced===true)){
        $('#photo-gallery-body').justifiedGallery('norewind');
    }
}

function appendPhotoGridGalleryFirstPageItems() {
    _photo_grid_gallery_data_current_index = 0;
    appendPhotoGridGalleryItemsToContentView(50);
    buildPhotoLoadingQueue(true);
}

function appendPhotoGridGalleryNextPageItems() {
    appendPhotoGridGalleryItemsToContentView(25);
    //reinit popovers for newly created items
    initPopovers();
    buildPhotoLoadingQueue(false);
}

function appendPhotoGridGalleryItemsToContentView(items_count) {
    var currentIndex = _photo_grid_gallery_data_current_index;
    var startIndex = currentIndex;
    while(currentIndex<=(_content_data.length-1)){
        _photo_grid_gallery_needs_update = true;
        var file = _content_data[currentIndex];
        currentIndex++;
        
        var photoCell = $(tmpl("template-photo-gallery-body", file)).data(file).appendTo("#photo-gallery-body");
        
        //hide checkbox and options button by default
        updateVisibilityForPhotoCellControls(photoCell,false);
        
        //add action for options button
        var options = photoCell.find('.button-cell-options');
        options.click(cellOptionsButtonClicked);
       
        //show checkbox and more button on photo cell hover
        photoCell.hover(
            function(){ 
                updateVisibilityForPhotoCellControls($(this),true);
            },
            function(){ 
                updateVisibilityForPhotoCellControls($(this),false);
            }
        );

        if((currentIndex-startIndex)>=items_count){
            break;
        }
        
    }
    
    _photo_grid_gallery_data_current_index = currentIndex;
    
 }
    
var _photoLoadingQueueImages = null;
var _photoLoadingQueueIndex = 0;
var _photoLoadingQueuePaused = false;

function resetPhotoLoadingQueue() {
    _photoLoadingQueueImages = Array();
    _photoLoadingQueueIndex = 0;
}

function buildPhotoLoadingQueue(resetQueue) {
    if(resetQueue===true){
        resetPhotoLoadingQueue();
        resetPhotoPrefetchQueue();
    }
    $(".photo-cell-image").each(function() {
        var el = $(this);
        var index = el.attr("data-index"); 
        _photoLoadingQueueImages[index] = el;
    });
    loadNextPhoto();  
}

function photoImageDidLoad() {
    setTimeout(function () {
        loadNextPhoto();
    }, 50);
}

function loadNextPhoto() {
    
    if(isPhotoLoadingQueuePaused()){
        return;
    }
   
    if(_photoLoadingQueueImages!==null && (_photoLoadingQueueImages.length > _photoLoadingQueueIndex )){
        var nextImg = _photoLoadingQueueImages[_photoLoadingQueueIndex];
        nextImg.one("load", function() {
            $(this).removeClass('fade-image');
            $(this).addClass('fade-image-visible');
        }); 
        nextImg.attr("src",nextImg.attr("data-src"));
        _photoLoadingQueueIndex++;
        nextImg.ready(photoImageDidLoad);
    }
    
}

function pausePhotoLoadingQueue() {
    _photoLoadingQueuePaused = true;
}

function resumePhotoLoadingQueue() {
    _photoLoadingQueuePaused = false;
    loadNextPhoto();
}

function isPhotoLoadingQueuePaused() {
    return _photoLoadingQueuePaused;
}

var _needsPhotoPrefetch = false;
var _prefetchedImage = null;
var _photoPrefetchQueueImages = null;
var _photoPrefetchQueueIndex = 0;
var _photoPrefetchQueuePaused = false;

function setNeedsPhotoPrefetch(flag) {
    _needsPhotoPrefetch = flag;
}

function isNeedsPhotoPrefetch() {
    return _needsPhotoPrefetch;
}

function prefetchPhotosIfNeeded() {
    if(isNeedsPhotoPrefetch()){
        setNeedsPhotoPrefetch(false);
        sendWebCommand("PREFETCHED_PHOTOS");
    }
}

function prefetchedPhotosDidLoad(content) {
    if(content!==undefined && content!==null && isPhotoGalleryVisible()===false){
        log.log("prefetchedPhotosDidLoad: " + content.length);
        buildPhotoPrefetchQueue(true,content);
    }
}

function resetPhotoPrefetchQueue() {
    _prefetchedImage = null;
    _photoPrefetchQueueImages = Array();
    _photoPrefetchQueueIndex = 0;
    log.log("resetPhotoPrefetchQueue");
}

function buildPhotoPrefetchQueue(resetQueue,content) {
    if(resetQueue===true){
        resetPhotoPrefetchQueue();
    }
    var currentIndex = 0;
    while(currentIndex<=(content.length-1)){
        var file = content[currentIndex];
        _photoPrefetchQueueImages[currentIndex] = file.photoSmallThumbnail;
        currentIndex++;
    }
    prefetchNextPhoto();
}

function pausePhotoPrefetchQueue() {
    _photoPrefetchQueuePaused = true;
}

function resumePhotoPrefetchQueue() {
    _photoPrefetchQueuePaused = false;
    prefetchNextPhoto();
}

function isPhotoPrefetchQueuePaused() {
    return _photoPrefetchQueuePaused;
}

function prefetchNextPhoto() {
    if(isPhotoPrefetchQueuePaused()){
        return;
    }
    if(_photoPrefetchQueueImages!==null && (_photoPrefetchQueueImages.length > _photoPrefetchQueueIndex )){
        var nextImgSrc = _photoPrefetchQueueImages[_photoPrefetchQueueIndex];
        _prefetchedImage = new Image();
        _prefetchedImage.onload = function(){
            photoDidPrefetched();
        };
        _prefetchedImage.src = nextImgSrc;
        _photoPrefetchQueueIndex++;
        log.log("prefetchNextPhoto: " + nextImgSrc);
    }
}

function photoDidPrefetched() {
    setTimeout(function () {
        prefetchNextPhoto();
    }, 500);
}