/*
 Copyright (c) 2012-2015, Pierre-Olivier Latour
 All rights reserved.
 
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright
 notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in the
 documentation and/or other materials provided with the distribution.
 * The name of Pierre-Olivier Latour may not be used to endorse
 or promote products derived from this software without specific
 prior written permission.
 
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL PIERRE-OLIVIER LATOUR BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var ENTER_KEYCODE = 13;

var $document = $(document);

var _path = "/";
var _content_data = [];
var _content_options = null;
var _contentSort = "sortByNameAsc";
var _optionsPopoverPath = null;
var _last_optionsPopoverPath = null;
var _pendingReloads = [];
var _reloadingDisabled = 0;
var _paths_selected = [];
var _last_paths_selected = null;
var _dropZonePath = null;
var _webSocket = null;
var _tab_close_confirmation = true;
var _shortKeysAdded = false;
var _open_url_on_server_did_stop = null;
        
var _isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

var _isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
                   navigator.userAgent && !navigator.userAgent.match('CriOS');

function disableReloads() {
    _reloadingDisabled += 1;
}

function reloadWillStart() {
    log.log("reloadWillStart");
    var currentHash = null;
    if(_content_options!==null && _content_options.requestHash!==null){
        currentHash = "" + _content_options.requestHash;
    }
    pausePhotoLoadingQueue();
    pausePhotoPrefetchQueue();
    sendWebCommandAndData("LIST_REQUEST_WILL_START",currentHash);
}

function reloadWillFinish() {
    resumePhotoLoadingQueue();
    resumePhotoPrefetchQueue();
    prefetchPhotosIfNeeded();
}

function enableReloads() {
    _reloadingDisabled -= 1;
    if (_pendingReloads.length > 0) {
        reloadWithPath(_pendingReloads.shift());
    }
}

function reload() {
    reloadWithPath(_path);
}

function reloadWithPath(path) {
    
    log.log("reloadWithPath: " + path); 
    
    path = decodeURIComponent(path) || "/";
    path = StringUtils.appendFinalSlash(path);
    
    if (_reloadingDisabled) {
        if ($.inArray(path, _pendingReloads) < 0) {
            _pendingReloads.push(path);
        }
        return;
    }
    
    reloadWillStart();
    
    disableReloads();

    deselectAllCells();
    
    //Destroy photo gallery and all pending requests
    hidePhotoGallery();

    $.ajax({
       cache: false,
        url: 'rdwifidrive/list',
        type: 'GET',
        data: {path: path, sort: _contentSort},
        beforeSend: function(request) {
            request.setRequestHeader("Session-Id", getSID());
        },
        dataType: 'json'
    }).fail(function (jqXHR, textStatus, errorThrown) {
        reloadWillFinish();
        showError("%failed_retrieving_contents_at_path_str% \"" + path + "\"", textStatus, errorThrown);
        renderBreadcrumb();
        if(jqXHR.status===401){
            startPinCodeAuth();
        }
        
    }).done(function (data, textStatus, jqXHR) {
        
        reloadWillFinish();  
        
        updateWebSocketIfNull();
        
        var scrollPosition = $document.scrollTop();
        
        _path = path;
        _content_data = data.content;
        _content_options = data.options;

        var $pageTitle = $("#page-title");
        $pageTitle.text(_content_options.header);

        renderBreadcrumb();

        clearContentViews();
        
        updateCurrentLayoutVisibility();

        updateContentViewWithData();
        
        selectedItemsDidChange();
        
        updateUploadCtrlVisibility();
        
        updateOptionsCtrl();
        
        updateSelectAllCtrlVisibility();

        updateCellActions();
        
        disableDragStartEventForCellIcon();

        updateCellContextMenu();

        reloadShortKeys();
        
        $document.scrollTop(scrollPosition);
        
        updateEcho();

        initPopovers();

    }).always(function () {
        enableReloads();
    });
}

function updateVisibilityForPhotoCellControls(row,visible){
    var checkbox = row.find('.photo-cell-checkbox');
    var options = row.find('.button-cell-options');
    var overlay = row.find('.photo-cell-overlay');
    var alwaysVisibleOverlay = row.find('.photo-cell-overlay-always-visible');
    var isOverlayAlwaysVisible = false;
    if(alwaysVisibleOverlay!==undefined && alwaysVisibleOverlay!==null){
        isOverlayAlwaysVisible=true;
    }
    var favorite = row.find('.favorite-icon');

    if(visible===true){
        DomUtils.showElement(checkbox);
        DomUtils.showElement(options);
        if(isOverlayAlwaysVisible===false){
            DomUtils.showElement(overlay);
        }
        DomUtils.showElement(favorite);
    }
    else{
        if(row.hasClass('selected')===false){
            DomUtils.hideElement(checkbox);
            DomUtils.hideElement(options);
            if(isOverlayAlwaysVisible===false){
                DomUtils.hideElement(overlay);
            }
            DomUtils.hideElement(favorite);
        }
    }
    
}

//https://makandracards.com/makandra/5885-flexible-overflow-handling-with-css-and-javascript
function updateVisibilityForRowActions(row,visible){

    var title = row.find('.column-name__text');
    var actions = row.find('.column-name__actions');
    var containerWidth = row.width();  
    
    if(visible===true){
        actions.removeClass('hidden');
        title.css('text-overflow', 'ellipsis');
        title.css('overflow', 'hidden');
        $.each([ title, actions ], function(index, self) {
            $(self).css('float', 'left');
            $(self).css('white-space', 'nowrap');
        });
        var actionsWidth = actions.outerWidth();
        title.css('max-width', (containerWidth - actionsWidth) + 'px');
    }
    else{
        actions.addClass('hidden');
        title.css('max-width', containerWidth + 'px');
    }
}

//clear selected items array and update table rows state
function deselectAllCells() {

    //clear selected items array
    _paths_selected.splice(0, _paths_selected.length);

    selectedItemsDidChange();
    updateOptionsCtrl();

    //deselect all cells
    if(isPhotoGalleryLayout()){
        $(".photo-cell").removeClass('selected');
        //hide all checkboxes and options for photo cells
        $(".photo-cell .photo-cell-checkbox").addClass('hidden');
        $(".photo-cell .button-cell-options").addClass('hidden');
    }
    else if(isGridLayout()){
        $(".thumbnail").removeClass('selected');
    }
    else{
        $(".row-file").removeClass('selected');
    }

    //deselect all checkboxes
    var $chkbox_all = null;
    var $chkbox_select_all = null;
    
    if(isPhotoGalleryLayout()){
        var $grid = $("#photo-gallery-body");
        $chkbox_all = $('.photo-cell input[type="checkbox"]', $grid);
        $chkbox_select_all = $('#photo-gallery-header input[type="checkbox"]');
    }
    else if(isGridLayout()){
        var $grid = $("#files-grid-body");
        $chkbox_all = $('.thumbnail input[type="checkbox"]', $grid);
        $chkbox_select_all = $('#files-grid-header input[type="checkbox"]');
    }
    else{
        var $table = $("#files-table");
        $chkbox_all = $('tbody input[type="checkbox"]', $table);
        $chkbox_select_all = $('thead input[type="checkbox"]', $table);
    }

    $chkbox_all.each(function () {
        $(this).prop('checked', false);
        $(this).prop('indeterminate', false);
    });

    //uncheck 'select all' checkbox
    $chkbox_select_all.each(function () {
        $(this).prop('checked', false);
        $(this).prop('indeterminate', false);
    });

}

function contentDataEmpty(){  
    return (_content_data===null || _content_data.length===0);
}

function isPhotoLibraryContent(){
    return (_content_options!==null && _content_options.photoLibraryContent!==null && _content_options.photoLibraryContent===true);
}

function isPhotoLibraryAllAlbumsContent(){
    return (_content_options!==null && _content_options.photoLibraryAllAlbumsContent!==null && _content_options.photoLibraryAllAlbumsContent===true);
}

function isPhotoLibraryAlbumDetailContent(){
    return (_content_options!==null && _content_options.photoLibraryAlbumContent!==null && _content_options.photoLibraryAlbumContent===true);
}

function isCurrentPathReadOnly() {
    return (_content_options!==null && _content_options.readOnly!==null && _content_options.readOnly===true);
}

//select all items and update table rows selected state
function selectAllCells() {
    //clear selected paths array
    _paths_selected.splice(0, _paths_selected.length);
    //fill selected items array
    if(_content_data.length>=0){
        for (var i = 0, file; file = _content_data[i]; ++i) {
            if(file.readOnly===false || isPhotoLibraryAlbumDetailContent()){
                _paths_selected.push(file.path);
            }
        }
    }
    
    selectedItemsDidChange();
    updateOptionsCtrl();
    
    //select all cells
    if(isPhotoGalleryLayout()){
        $('.photo-cell').each(function() {
            if($(this).data("readOnly")===false || isPhotoLibraryAlbumDetailContent()){
                $(this).addClass('selected');
                //show checkbox and options for photo cell
                updateVisibilityForPhotoCellControls($(this),true)
            }
        });
    }
    else if(isGridLayout()){
        $('.thumbnail').each(function() {
            if($(this).data("readOnly")===false){
                $(this).addClass('selected');
            }
        });
    }
    else{
        $('.row-file').each(function() {
            if($(this).data("readOnly")===false){
                $(this).addClass('selected');
            }
        });
    }
    //select checkboxes for table rows
    var $chkbox_all = null;
    var $chkbox_select_all = null;
    
    if(isPhotoGalleryLayout()){
        var $gallery = $("#photo-gallery-body");
        $chkbox_all = $('.photo-cell input[type="checkbox"]', $gallery);
        $chkbox_select_all = $('#photo-gallery-header input[type="checkbox"]');
    }
    else if(isGridLayout()){
        var $gallery = $("#files-grid-body");
        $chkbox_all = $('.thumbnail input[type="checkbox"]', $gallery);
        $chkbox_select_all = $('#files-grid-header input[type="checkbox"]');
    }
    else{
        var $table = $("#files-table");
        $chkbox_all = $('tbody input[type="checkbox"]', $table);
        $chkbox_select_all = $('thead input[type="checkbox"]', $table);
    }
    
    $chkbox_all.each(function () {
        $(this).prop('checked', true);
        $(this).prop('indeterminate', false);
    });

    //uncheck 'select all' checkbox
    $chkbox_select_all.each(function () {
        $(this).prop('checked', true);
        $(this).prop('indeterminate', false);
    });

}

function selectTableRow(selectedRow){
    var $row = selectedRow;
    var $checkbox = $row.find("input[type=checkbox]");
    var rowId = $row.data("path");
    var index = $.inArray(rowId, _paths_selected);
    if (index === -1) {
        _paths_selected.push(rowId);
        $checkbox.prop("checked", true);
        $row.addClass('selected');
        updateSelectAllCtrl();
        selectedItemsDidChange();
        updateOptionsCtrl();
    } 
}

function selectedPathsCount(){
    var paths_selected_count = 0;
    if(_paths_selected!==null && _paths_selected.length>0){
        paths_selected_count = _paths_selected.length;
    }
    return paths_selected_count;
}

function selectedPathName(){
    if(selectedPathsCount()===1){
        var path = _paths_selected[0];
        var name = path;
        if (name[name.length - 1] === "/") {
            name = name.slice(0, name.length - 1);
        }
        name = name.substr(name.lastIndexOf('/') + 1);
        
        for (var i = 0, file; file = _content_data[i]; i++) {
            if(file.path===path && file.filename.length>0){
                name = file.filename;
                break;
            }
        }
        
        return name;
    }
    return "";
}
     
function deselectTableRow(selectedRow){
    var $row = selectedRow;
    var $checkbox = $row.find("input[type=checkbox]");
    var rowId = $row.data("path");
    var index = $.inArray(rowId, _paths_selected);
    if (index !== -1){
        _paths_selected.splice(index, 1);
        $checkbox.prop("checked", false);
        $row.removeClass('selected');
        updateSelectAllCtrl();
        selectedItemsDidChange();
        updateOptionsCtrl();
    }
}

function updateContentViewWithData() {
    
    //header data
    var dataOptions = _content_options;
           
    if(isPhotoGalleryLayout()){
        DomUtils.hideElement($("#files-table-no-data-placeholder"));
        $(tmpl("template-photo-gallery-header", dataOptions)).data(dataOptions).appendTo("#photo-gallery-header");
        
        if(_content_data.length>0){
            appendPhotoGridGalleryFirstPageItems();
            showPhotoGallery();
            DomUtils.hideElement($("#photo-album-no-data-placeholder"));
        }
        else{
            hidePhotoGallery();
            DomUtils.showElement($("#photo-album-no-data-placeholder"));
            DomUtils.hideElement($("#photo-gallery-header"));
        }
    }
    else{
        
        DomUtils.hideElement($("#photo-album-no-data-placeholder"));
        hidePhotoGallery();
    
        if(isGridLayout()){
            $(tmpl("template-files-grid-header", dataOptions)).data(dataOptions).appendTo("#files-grid-header");
        }
        else{
            $(tmpl("template-files-table-header", dataOptions)).data(dataOptions).appendTo("#files-table-header");
        }  

        if(_content_data.length>0){

            //cells data
            for (var i = 0, file; file = _content_data[i]; ++i) {
                
                if(isPhotoLibraryAllAlbumsContent()){
                    var element = $(tmpl("template-albums-grid-body", file)).data(file).find(".album-thumbnail").data(file).end().appendTo("#files-grid-body");
                    $(element).find(".item-name").text(""+file.filename);
                }
                else if(isGridLayout()){
                    var element = $(tmpl("template-files-grid-body", file)).data(file).find(".thumbnail").data(file).end().appendTo("#files-grid-body");
                    $(element).find(".item-name").text(""+file.filename);
                }
                else{
                    var element = $(tmpl("template-files-table-body", file)).data(file).appendTo("#files-table-body");
                    $(element).find(".column-name__text").text(""+file.filename);
                }
            }
            
            $(".fade-image").one("load", function() {
                $(this).removeClass('fade-image');
                $(this).addClass('fade-image-visible');
            }).each(function() {
                if(this.complete) $(this).load();
            });

            //hide placeholder
            DomUtils.hideElement($("#files-table-no-data-placeholder"));
        }
        else{
            //show placeholder
            DomUtils.showElement($("#files-table-no-data-placeholder"));
        }
    }
    
}

function clearContentViews() {
    $("#files-grid-header").empty();
    $("#files-grid-body").empty();
    $("#files-table-header").empty();
    $("#files-table-body").empty();
    $("#photo-gallery-header").empty();
    $("#photo-gallery-body").empty();
}

function updateCurrentLayoutVisibility() {
        
    if(isPhotoGalleryLayout()){
        DomUtils.hideElement($("#files-table"));
        DomUtils.hideElement($("#files-grid-header"));
        DomUtils.hideElement($("#files-grid-body"));
        DomUtils.showElement($("#photo-gallery-body"));
//        DomUtils.showElement($("#photo-gallery-header"));
    }
    else{
        
        DomUtils.hideElement($("#photo-gallery-body"));
        DomUtils.hideElement($("#photo-gallery-header"));
        
        if(isGridLayout()){
            DomUtils.hideElement($("#files-table"));
            DomUtils.showElement($("#files-grid-header"));
            DomUtils.showElement($("#files-grid-body"));
        }
        else{
            DomUtils.showElement($("#files-table"));
            DomUtils.hideElement($("#files-grid-header"));
            DomUtils.hideElement($("#files-grid-body"));
        }
        
        //hide sort toolbar
        if(isPhotoLibraryAllAlbumsContent()){
            DomUtils.hideElement($("#files-grid-header"));
        }
        
    }

}

function disableDragStartEventForCellIcon() {
    //disable drag start event for cell icon
    $(".btn-file-icon").on('dragstart', function () {
         return false;
    });
}

function updateCellContextMenu() {
    
    $(".row-file").contextmenu(function (event) {
        var $row = $(this);
        if(isPhotoLibraryAllAlbumsContent()===false){
            log.log("row-file.contextmenu: " + $row);
            updateVisibilityForRowActions($row,false);
            $row.find(".button-cell-contextmenu").click();
            event.preventDefault();
            centerPopover(event);
        }
    });        

    $(".button-cell-contextmenu").click(function (event) {
        log.log("button-cell-contextmenu.click");

        var $elem = $(this);

        var title = "";  
        var icon = ""; 
        var iconClass = "";

        //deselect all files on popover dismiss if we selected files with right click
        //and no files were selected before
        if(_paths_selected!==null && _paths_selected.length===0){
            setShouldDeselectAllFilesOnPopoverDismiss();
        }
        else{
            clearShouldDeselectAllFilesOnPopoverDismiss();
        }
        //select clicked row
        var _paths_selected_count = selectedPathsCount();
        var $row = DomUtils.getClosestRow($elem);
        selectTableRow($row);
        var _paths_selected_count_updated = selectedPathsCount();

        if(_paths_selected.length>1){
           title = "%selected_str%: "+_paths_selected.length;
           iconClass =  "list-heading-icon-large";
           if(_paths_selected.length===2){
              icon = "../images/items-selected-2.png";
           }
           else {
              icon = "../images/items-selected-3.png";
           }

           //update rename action state
           $("#action-rename-multiple-id").addClass('disabled');
           $("#span-rename-multiple-id").addClass('disabled');
           $("#img-rename-multiple-id").attr("src","../images/options-rename-dis.png");

        } 
        else{
            var path = _paths_selected[0];
            title = selectedPathName();
            icon = "/fileicons?path=" + encodeURIComponent(path) + "&sid=" + getSID();
            iconClass =  "list-heading-icon";

            //update rename action state
            $("#action-rename-multiple-id").removeClass('disabled');
            $("#span-rename-multiple-id").removeClass('disabled');
            $("#img-rename-multiple-id").attr("src","../images/options-rename.png");

        }

        //update popover title     
        $("#popover-contextmenu-title-id").text(title);

        //update popover icon
        $("#popover-contextmenu-img-id").attr("src",icon);
        $("#popover-contextmenu-img-id").removeClass('list-heading-icon');
        $("#popover-contextmenu-img-id").removeClass('list-heading-icon-large');
        $("#popover-contextmenu-img-id").addClass(iconClass);

        event.stopPropagation();

        //show popover only if selected paths were updated
        if(_paths_selected_count_updated!==_paths_selected_count || isCurrentPopoverTargetActive()===false){
            showDefaultPopoverForTarget($(event.target));
        }

    });
}

function cellOptionsButtonClicked(event) {
    
    //skip options event if we have selected items
    if(_paths_selected.length!==0){
        event.stopPropagation();
        return false;
    }
    
    var $elem = $(this);
    var currentOptionsPopoverPath = _optionsPopoverPath;
    var modelObj = null;

    if(isPhotoGalleryLayout()){
        modelObj = DomUtils.getClosestPhotoCell($elem);
    }
    else if(isGridLayout()){
        modelObj = DomUtils.getClosestThumbnail($elem).parent();
    }
    else{
        modelObj = DomUtils.getClosestRow($elem);
    }

    var path = modelObj.data("path");
    var name = modelObj.data("filename");
    var readOnly = modelObj.data("readOnly");

    log.log("button-cell-options.click: " + path);

    //update popover title
    $("#popover-options-title-id").text(name);

    //update popover icon
    $("#popover-options-img-id").attr("src","/fileicons?path=" + encodeURIComponent(path) + "&sid=" + getSID());

    if(readOnly){
        DomUtils.hideElement($("#action-rename-id"));
        DomUtils.hideElement($("#action-delete-id"));
    }
    else{
        DomUtils.showElement($("#action-rename-id"));
        DomUtils.showElement($("#action-delete-id"));
    }        

    _optionsPopoverPath = path;

    //Prevent click event from propagating to parent so table cell selection will not trigger
    if(isPhotoGalleryLayout()===false){
        event.stopPropagation();
    }

    if(currentOptionsPopoverPath!==_optionsPopoverPath){
        showDefaultPopoverForTarget($(event.target));
    }
    else{
        hideAllPopovers();
    }

    if(isPhotoGalleryLayout()){
        return false;
    }
}

function updateCellActions() {
    function openFile(event) {
        hideAllPopovers();
        var $elem = $(this);
        var path = DomUtils.getClosestRow($elem).data("path");
        if (path) {
            setTimeout(function () {
               openInNewTabURL("rdwifidrive/open?sid="+getSID()+"&path=" + encodeURIComponent(path));
            }, 0);
            event.stopPropagation();
        }
    }

    function openFolder(event) {
        hideAllPopovers();
        var $elem = $(this);
        var path = DomUtils.getClosestRow($elem).data("path");
        window.location.hash = "#" + encodeURIComponent(path);
        event.stopPropagation();
    }

    $(".button-cell-download").click(openFile);
    $(".file-name").click(openFile);
    $(".button-cell-open").click(openFolder);
    $(".folder-name").click(openFolder);
    
    $(".button-cell-delete").click(function (event) {
        var $elem = $(this);
        var path = DomUtils.getClosestRow($elem).data("path");
        hideAllPopovers();
        $.ajax({
           cache: false,
            url: 'rdwifidrive/delete',
            type: 'GET',
            data: {path: path},
            beforeSend: function(request) {
                request.setRequestHeader("Session-Id", getSID());
            },
            dataType: 'json'
        }).fail(function (jqXHR, textStatus, errorThrown) {
            showError("%failed_deleting_str% \"" + path + "\"", textStatus, errorThrown);
        }).done(function () {
            reloadWithPath(_path);
        });
        event.stopPropagation();
    });  
    
    if(isPhotoGalleryLayout()===false){
        $(".button-cell-options").click(cellOptionsButtonClicked);
    }
    
    //show actions on title hover
    $(".column-name").hover(
        function(){ 
            if(_paths_selected.length===0){
                updateVisibilityForRowActions($(this),true);
            }
        },
        function(){ 
            updateVisibilityForRowActions($(this),false);
        }
    ); 

    //show popover on single action hover
    $(".btn-single-download").hover(
        function(){ 
            showTooltipPopoverForTarget($(this));
        },
        function(){ 
            hideCurrentPopover();
        }
    );

    //show tooltip rename
    $(".btn-single-rename").hover(
        function(){ 
            showTooltipPopoverForTarget($(this));
        },
        function(){ 
            hideCurrentPopover();
        }
    );

    //show tooltip delete
    $(".btn-single-delete").hover(
        function(){ 
            showTooltipPopoverForTarget($(this));
        },
        function(){ 
            hideCurrentPopover();
        }
    );

    $(".btn-single-download").click(function (event) {
        var $elem = $(this);
        var $row = DomUtils.getClosestRow($elem);
        var path = $row.data("path");
        downloadItemAtPath(path);
    });
    

    $(".btn-single-delete").click(function (event) {
        var $elem = $(this);
        var $row = DomUtils.getClosestRow($elem);
        var path = $row.data("path");
        deleteItemAtPath(path);
    });

    $(".btn-single-rename").click(function (event) {
        var $elem = $(this);
        var $row = DomUtils.getClosestRow($elem);
        var path = $row.data("path");
        renameItemAtPath(path);
    });

    $(".thumbnail button.btn-file-icon").hover(
        function(e) {
            DomUtils.getClosestThumbnail($(this)).find(".item-info .item-name").addClass("hover");
        },
        function(e) {
            DomUtils.getClosestThumbnail($(this)).find(".item-info .item-name").removeClass("hover");
        }
    );
    
    $("img[data-echo]").error(imageNotFound);

}

function reloadShortKeys() {
    removeShortKeys();
    addShortKeys();
    updateModalShortKeys();
}

function updateModalShortKeys(){
    $(document).on('show.bs.modal', function() {
        removeShortKeys();
    });
    $(document).on('hide.bs.modal', function() {
        addShortKeys();
    });
}

function addShortKeys() {
    if(_shortKeysAdded===false){
        
        if(isPhotoLibraryAlbumDetailContent()===false){
            shortcut.add("ctrl+a", function() {
               selectAllCells();
            });
            shortcut.add("meta+a", function() {
                selectAllCells();
            });
        }

        shortcut.add("delete", function() {
            if(_paths_selected!==null && _paths_selected.length>0){
                actionMultipleDelete();
            }
        });
        _shortKeysAdded = true;
    }
}

function removeShortKeys() {
    if(_shortKeysAdded===true){
        shortcut.remove("ctrl+a");
        shortcut.remove("meta+a");
        shortcut.remove("delete");
        _shortKeysAdded = false;
    }
}

// Updates "..." control for all cells in collection
function updateOptionsCtrl() {
    var array = _paths_selected;
    var arrayLength = array.length;
    var $options_ctrl_all = null;
    
    if(isPhotoGalleryLayout()){
        var $list = $("#photo-gallery-body");
        $options_ctrl_all = $('.photo-cell .button-cell-options', $list);
    }
    else if(isGridLayout()){
        var $list = $("#files-grid-body");
        $options_ctrl_all = $('.thumbnail .button-cell-options', $list);
    }
    else{
        var $table = $("#files-table");
        $options_ctrl_all = $('tbody tr td .button-cell-options', $table);
    }
    
    if (arrayLength > 0) {
        $('.button-cell-options').each(function() {
            $(this).addClass('disabled');
        });
    }
    else {
        $('.button-cell-options').each(function() {
            $(this).removeClass('disabled');
        });
    }
}

// Updates "Select all" control in header

function updateSelectAllCtrl() {

    var $chkbox_all = null;
    var $chkbox_checked = null;
    var chkbox_select_all = null;
    
    if(isPhotoGalleryLayout()){
        var $list = $("#photo-gallery-body");
        $chkbox_all = $('.photo-cell input[type="checkbox"]', $list);
        $chkbox_checked = $('.photo-cell input[type="checkbox"]:checked', $list);
        chkbox_select_all = $('#photo-gallery-header input[type="checkbox"]').get(0);
    }
    else if(isGridLayout()){
        var $list = $("#files-grid-body");
        $chkbox_all = $('.thumbnail input[type="checkbox"]', $list);
        $chkbox_checked = $('.thumbnail input[type="checkbox"]:checked', $list);
        chkbox_select_all = $('#files-grid-header input[type="checkbox"]').get(0);
    }
    else{
        var $table = $("#files-table");
        $chkbox_all = $('tbody input[type="checkbox"]', $table);
        $chkbox_checked = $('tbody input[type="checkbox"]:checked', $table);
        chkbox_select_all = $('thead input[type="checkbox"]', $table).get(0);
    }

    // If none of the checkboxes are checked
    if ($chkbox_checked.length === 0) {
        chkbox_select_all.checked = false;
        if ('indeterminate' in chkbox_select_all) {
            chkbox_select_all.indeterminate = false;
        }
    // If all of the checkboxes are checked
    } else if ($chkbox_checked.length === $chkbox_all.length) {
        chkbox_select_all.checked = true;
        if ('indeterminate' in chkbox_select_all) {
            chkbox_select_all.indeterminate = false;
        }

    // If some of the checkboxes are checked
    } else {
        chkbox_select_all.checked = true;
        if ('indeterminate' in chkbox_select_all) {
            chkbox_select_all.indeterminate = true;
        }
    }
}

function updateSelectAllCtrlVisibility() {

    var $chkbox_select_all = null;
    
    if(isPhotoGalleryLayout()){
        $chkbox_select_all = $('#photo-gallery-header input[type="checkbox"]');
    }
    else if(isGridLayout()){
        $chkbox_select_all = $('#files-grid-header input[type="checkbox"]');
    }
    else{
        var $table = $("#files-table");
        $chkbox_select_all = $('thead input[type="checkbox"]', $table);
    }
    
    $chkbox_select_all.each(function () {
        if(contentDataEmpty()){
            $(this).prop('hidden', true);
        }
        else{
            $(this).prop('hidden', false);
        }
    });
    
}

function updateUploadCtrlVisibility() {       
    if(isPhotoLibraryContent()===true){
        DomUtils.hideElement($("#btn-upload"));
    }
    else{
        DomUtils.showElement($("#btn-upload"));
    }        
}

function updateEcho() {
    
    log.log("updateEcho");  
    
    echo.init({
            offset: 100,
            throttle: 250,
            unload: false,
            callback: function (element, op) {
                  console.log(element, 'has been', op + 'ed')
            }
    });
}

$document.ready(function () {
    
    log.log("$document.ready");  
    
    if (!_isIE11) {
        document.documentElement.classList.add("good-browser");
    }
    
    setNeedsPhotoPrefetch(true);
                        
    updateWebSocket();

    var sidUpdate = updateSID();

    initUpload();
    
    initArchivePanel();
    
    initNotificationPanel();
    
    initDeletePanel();
    
    initSelectPanel();
    
    initPopovers();

    updateEcho();
              
    $("#create-input").keypress(function (event) {
        if (event.keyCode === ENTER_KEYCODE) {
            $("#create-confirm").click();
        }
    });

    $("#create-modal").on("shown.bs.modal", function (event) {
        $("#create-input").focus();
        $("#create-input").select();
    });

    $("#btn-create-folder").click(function (event) {
        actionCreateFolder();
    });

    $("#create-confirm").click(function (event) {
        $("#create-modal").modal("hide");
        var name = $("#create-input").val();
        if (name !== "") {
            $.ajax({
               cache: false,
                url: 'rdwifidrive/create',
                type: 'GET',
                data: {path: _path + name},
                beforeSend: function(request) {
                    request.setRequestHeader("Session-Id", getSID());
                },
                dataType: 'json'
            }).fail(function (jqXHR, textStatus, errorThrown) {
                showError("%failed_creating_folder_str% \"" + name + "\"", textStatus, errorThrown);
            }).done(function () {
                reloadWithPath(_path);
            });
        }
    });

    $("#move-input").keypress(function (event) {
        if (event.keyCode === ENTER_KEYCODE) {
            $("#move-confirm").click();
        }
    });

    $("#move-modal").on("shown.bs.modal", function (event) {
        $("#move-input").focus();
        var name = $("#move-input").val();
        var selectionIndex = name.lastIndexOf(".");
        if(selectionIndex===-1){
            selectionIndex = name.length;
        }
        var input = document.getElementById("move-input");
        input.setSelectionRange(0,selectionIndex);
    });

    $("#move-confirm").click(function (event) {
        $("#move-modal").modal("hide");
        var oldPath = $("#move-input").data("path");
        var parentPath = oldPath.substr(0, oldPath.lastIndexOf('/'));
        var newName = $("#move-input").val();
        var newPath = parentPath.concat("/", newName);
        var oldName = oldPath.substr(oldPath.lastIndexOf('/') + 1);

        if ((newName !== "") && (newPath !== oldPath)) {
            $.ajax({
               cache: false,
                url: 'rdwifidrive/move',
                type: 'GET',
                data: {oldPath: oldPath, newPath: newPath},
                beforeSend: function(request) {
                    request.setRequestHeader("Session-Id", getSID());
                },
                dataType: 'json'
            }).fail(function (jqXHR, textStatus, errorThrown) {
                showError("%failed_renaming_str% \"" + oldName + "\" to \"" + newName + "\"", textStatus, errorThrown);
            }).done(function () {
                reloadWithPath(_path);
            });
        }
    });
    
    $("#close-session").click(function (event) {
        sendWebCommand("STOP_SERVER");
        if(_open_url_on_server_did_stop!==null){
           window.location = _open_url_on_server_did_stop;
        }
        else{
            showConnectionClosed();
        }
    });  
    
    // Handle click on grid item checkbox
    $("#files-grid-body").on('click', 'input[type="checkbox"]', function (e) {
        hideAllPopovers();
        var $elem = $(this);
        var $row = $elem.closest('.thumbnail');
        var rowId = DomUtils.getClosestThumbnail($elem).parent().data("path");
        log.log("files-grid-body-checkbox.click: " + rowId);
        var index = $.inArray(rowId, _paths_selected);
        if ($elem.prop("checked") ) {
            _paths_selected.push(rowId);
            $row.addClass('selected');
        } else {
            _paths_selected.splice(index, 1);
            $row.removeClass('selected');
        }
        updateSelectAllCtrl();
        selectedItemsDidChange();
        updateOptionsCtrl();
        e.stopPropagation();
    });

    $("#files-grid-header").on('click', 'input[type="checkbox"]', function (e) {
        hideAllPopovers();
        if (this.checked) {
            selectAllCells();
        } else {
            deselectAllCells();
        }
        e.stopPropagation();
    });

    // Handle click on table row checkbox
    $("#files-table tbody").on('click', 'input[type="checkbox"]', function (e) {
        hideAllPopovers();
        var $elem = $(this);
        var $row = $elem.closest('tr');
        var rowId = DomUtils.getClosestRow($elem).data("path");
        log.log("files-table-checkbox.click: " + rowId);
        var index = $.inArray(rowId, _paths_selected);
        if (index === -1) {
            _paths_selected.push(rowId);
            $row.addClass('selected');
        } else if (index !== -1) {
            _paths_selected.splice(index, 1);
            $row.removeClass('selected');
        }
        updateSelectAllCtrl();
        selectedItemsDidChange();
        updateOptionsCtrl();
        e.stopPropagation();
    });

    // Handle click on select all checkbox
    $("#files-table thead").on('click', 'input[type="checkbox"]', function (e) {
        hideAllPopovers();
        if (this.checked) {
            selectAllCells();
        } else {
            deselectAllCells();
        }
        e.stopPropagation();
    });
    
    // Handle click on photo item checkbox
    $("#photo-gallery-body").on('click', 'input[type="checkbox"]', function (e) {
        hideAllPopovers();
        var $elem = $(this);
        var $row = $elem.closest('.photo-cell');
        var rowId = DomUtils.getClosestPhotoCell($elem).data("path");
        log.log("photo-gallery-body-checkbox.click: " + rowId);
        var index = $.inArray(rowId, _paths_selected);
        if (index === -1) {
            _paths_selected.push(rowId);
            $row.addClass('selected'); 
        } else {
            _paths_selected.splice(index, 1);
            $row.removeClass('selected');
        }
        updateSelectAllCtrl();
        selectedItemsDidChange();
        updateOptionsCtrl();
        e.stopPropagation();
    });
    
    //handle click on select all in photo gallery
    $("#photo-gallery-header").on('click', 'input[type="checkbox"]', function (e) {
        hideAllPopovers();
        if (this.checked) {
            selectAllCells();
        } else {
            deselectAllCells();
        }
        e.stopPropagation();
    });
    
    //update photo gallery when user scroll page
    $(window).scroll(function() {
        
        //sticky headers
        var panel_navigation = document.getElementById("panel-navigation");
//        var panel_navigation = document.getElementById("path-container");
        var sticky_navigation = panel_navigation.offsetTop;
        var files_table_header = document.getElementById("files-table-header");
        var files_grid_header = document.getElementById("files-grid-header");   
        var panel_content = document.getElementById("panel-content");
     
//        log.log("scroll top: " + $(window).scrollTop() + "sticky_navigation: " + sticky_navigation);

        if ($(window).scrollTop() >= 123) {
//        if (window.pageYOffset > sticky_navigation) {
            panel_navigation.classList.add("sticky-container");
            panel_navigation.classList.add("sticky-panel-navigation");
            files_grid_header.classList.add("sticky-container");
            files_grid_header.classList.add("sticky-content-header");
            files_table_header.classList.add("sticky-container");
            files_table_header.classList.add("sticky-content-header");
            if(isPhotoLibraryContent()){
                panel_content.classList.add("panel-content-sticky-padding-top-photo");
            }
            else{
                panel_content.classList.add("panel-content-sticky-padding-top-table");
            }
        } else {
            panel_navigation.classList.remove("sticky-container");
            panel_navigation.classList.remove("sticky-panel-navigation");
            files_grid_header.classList.remove("sticky-container");
            files_grid_header.classList.remove("sticky-content-header");
            files_table_header.classList.remove("sticky-container");
            files_table_header.classList.remove("sticky-content-header");
            panel_content.classList.remove("panel-content-sticky-padding-top-table");
            panel_content.classList.remove("panel-content-sticky-padding-top-photo");
        }

        //photo gallery pagination
        if($(window).scrollTop() + $(window).height() === $(document).height()) {
            if(isPhotoGalleryVisible()){
                appendPhotoGridGalleryNextPageItems();
            }
        }
    });
    
    $document.on('click', function (e) {
        //log.log("$document.click: " + e + " this: "+ $(this) + " target: " + e.target);
    });

    $('html').on('click', function(e) {
       //log.log("html.click: " + e + " this: "+ $(this) + " target: " + e.target);
       hideAllPopovers();
    });
    
    //popover did show 
    $(document).on('shown.bs.popover', function (ev) {
      log.log("shown.bs.popover");
    });

    //popover dismiss
    $(document).on('hidden.bs.popover', function (ev) {
      log.log("hidden.bs.popover");  
    });

    $("#reload").click(function () {
        reloadWithPath(_path);
    });

    var locationHash = window.location.hash.replace("#", "");
    log.log("locationHash: " + locationHash);
    
    var location = "/";
    if (locationHash) {
        location = locationHash;
    } 
    
    log.log("location: " + location);  
    
    if(sidUpdate===false){
        log.log("sidUpdate==false"); 
        bindWindowUnload();
        bindHashChange();
        reloadWithPath(location);
    }
    else {
        log.log("sidUpdate==true"); 
        setTimeout(function () {
            log.log("fetch_new_location_from: " + location); 
            var origin = '';     
            if (!window.location.origin || window.location.origin=== undefined ) {
                log.log("window.location.origin unavailable");
                origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
            }
            else{
                log.log("window.location.origin available");
                origin = window.location.origin;
            }
            log.log("origin: " + origin);
            var newLocation = origin + "/" + "#" + location;
            log.log("window.location: " + newLocation);
//            setTimeout(function () {
                window.location = newLocation;
                bindWindowUnload();
                bindHashChange();
                prefetchPhotosIfNeeded();
//            }, 5000);
            
        }, /*5000*/0);
    }
    
});

function bindWindowUnload() {
    $(window).bind("unload", function() { 
        log.log("window unload");
        sendWebCommand("WINDOW_UNLOAD");
    });
}

function bindHashChange() {
    $(window).bind("hashchange", function () {
        reloadWithPath(window.location.hash.replace("#", ""));
    });
}

function openURLOnServerDidStop() {
    if(_open_url_on_server_did_stop!==null){
        window.location = _open_url_on_server_did_stop;
        return true;
    }
    return false;
}

function openInNewTabURL(url) {
    var win = window.open(url, '_blank');
    win.focus();
}

function openInCurrentTabURL(url) {
    window.location = url;
}

function imageNotFound() {
    var $this = $(this);
    $this.attr('src', $this.attr('data-echo-icon') );
	$this.addClass('item-icon-shown');
    $this.off();
}

function hideAllModals(){
    $('.modal').modal('hide'); // closes all active pop ups.
    $('.modal-backdrop').remove(); // removes the grey overlay.
}

