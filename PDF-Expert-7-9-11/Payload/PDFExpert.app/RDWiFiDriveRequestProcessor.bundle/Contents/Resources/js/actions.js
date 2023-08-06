

function renameItemAtPath(filePath) {
    var path = filePath;
    log.log("action-rename: " + path);
    if (path[path.length - 1] == "/") {
        path = path.slice(0, path.length - 1);
    }
    var name = path.substr(path.lastIndexOf('/') + 1);
    $("#move-input").data("path", path);
    $("#move-input").val(name);
    $("#move-modal").modal("show");
}

function actionRename() {
    var path = optionsPopoverPathToProcess();
    renameItemAtPath(path);
    hideAllPopovers();
    clearOptionsPopoverPathToProcess();
}

function actionMultipleRename() {
    var paths_to_process = StringUtils.cloneStringsArray(pathsToProcess());
    var arrayLength = paths_to_process.length;
    if(arrayLength==1){
        var path = paths_to_process[0];
        renameItemAtPath(path);
    }
    hideAllPopovers();
    clearLastSelectedPaths();
}

function actionDownload() {
    var path = optionsPopoverPathToProcess();
    log.log("action-download: " + path);
    downloadItemAtPath(path);
    hideAllPopovers();
    deselectAllCells();
    clearOptionsPopoverPathToProcess();
}

function downloadItemAtPath(path) {
    log.log("downloadItemAtPath: " + path);
    $.ajax({
        cache: false,
        url: 'rdwifidrive/supports_direct_download',
        type: 'GET',
        beforeSend: function(request) {
            request.setRequestHeader("Session-Id", getSID());
        },
        data: {path: path},
        dataType: 'json'
    }).fail(function (jqXHR, textStatus, errorThrown) {
        var pathsArray = [path];
        downloadItemsAtPaths(pathsArray);
    }).done(function (data, textStatus, jqXHR) {
        log.log("direct_url: " + data.supports_direct_download);
        setTimeout(function () {
            openInCurrentTabURL("rdwifidrive/download?sid="+getSID()+"&path=" + encodeURIComponent(path));
        }, 0);
    });
}

function downloadItemsAtPaths(pathsArray) {
    log.log("downloadItemsAtPaths: " + pathsArray.length);
    var paths = JSON.stringify(pathsArray);
    //send archive command and download archived file
    $.ajax({
        cache: false,
        url: 'rdwifidrive/archive',
        type: 'POST',
        beforeSend: function(request) {
            request.setRequestHeader("Session-Id", getSID());
        },
        data: {paths: paths},
        dataType: 'json'
    }).fail(function (jqXHR, textStatus, errorThrown) {
        showError("%failed_downloading_items_str%", textStatus, errorThrown);
    }).done(function (data, textStatus, jqXHR) {
        log.log("downloadItemsAtPaths: archiving started");
    });
}

function actionMultipleDownload() {
    var paths_to_process = StringUtils.cloneStringsArray(pathsToProcess());
    log.log("action-multiple-download: " + paths_to_process.length);
    var arrayLength = paths_to_process.length;
    if (arrayLength > 0) {
        var paths = JSON.stringify(paths_to_process);
        if(arrayLength===1){
            downloadItemAtPath(paths_to_process[0]);
        }
        else{
            downloadItemsAtPaths(paths_to_process);
        }
    }
    hideAllPopovers();
    deselectAllCells();
    clearLastSelectedPaths();
}

function actionDelete() {
    var path = optionsPopoverPathToProcess();
    deleteItemAtPath(path);
    hideAllPopovers();
    clearOptionsPopoverPathToProcess();
}

function deleteItemAtPath(path){
    log.log("action-delete: " + path);
    
    var deleteModal = $("#delete-modal");
    var deleteConfirm = $("#delete-confirm");
    
    var singleDelete = function (event) {
        deleteModal.modal("hide");
        deleteConfirm.off("click", singleDelete);
        $.ajax({
            cache: false,
            url: 'rdwifidrive/delete',
            type: 'POST',
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
    };
    deleteConfirm.on("click", singleDelete);
    deleteModal.on('hidden.bs.modal', function () {
        deleteConfirm.off("click", singleDelete);
    });
    deleteModal.modal("show");
}

function actionMultipleDelete() {
    var paths_to_process = StringUtils.cloneStringsArray(pathsToProcess());
    log.log("action-multiple-delete: " + paths_to_process.length);
    var deleteModal = $("#delete-modal");
    var deleteConfirm = $("#delete-confirm");
    var multipleDelete = function (event) {  
        clearLastSelectedPaths();
        paths_to_process.forEach(function (path) {
            deleteModal.modal("hide");
            deleteConfirm.off("click", multipleDelete);
        });
        var paths = JSON.stringify(paths_to_process);
        var arrayLength = paths_to_process.length;
        $.ajax({
           cache: false,
            url: 'rdwifidrive/delete',
            type: 'POST',
            data: {paths: paths},
            beforeSend: function(request) {
                request.setRequestHeader("Session-Id", getSID());
            },
            dataType: 'json'
        }).fail(function (jqXHR, textStatus, errorThrown) {
            showError("%failed_deleting_items_str%", textStatus, errorThrown);
        }).done(function () {
            if(arrayLength>1){
                log.log("deleteItemsAtPaths: background task started");
            }
            else{
                reloadWithPath(_path);
            }
        });
    };
    deleteConfirm.on("click", multipleDelete);
    deleteModal.on('hidden.bs.modal', function () {
        deleteConfirm.off("click", multipleDelete);
    });
    deleteModal.modal("show");
    hideAllPopovers();
}

function actionSortByName() {
    if (_contentSort == "sortByNameAsc") {
        _contentSort = "sortByNameDesc";
    }
    else {
        _contentSort = "sortByNameAsc";
    }
    reloadWithPath(_path);
}

function actionSortByDate() {
    if (_contentSort == "sortByDateAsc") {
        _contentSort = "sortByDateDesc";
    }
    else {
        _contentSort = "sortByDateAsc";
    }
    reloadWithPath(_path);
}

function actionSortBySize() {
    if (_contentSort == "sortBySizeDesc") {
        _contentSort = "sortBySizeAsc";
    }
    else {
        _contentSort = "sortBySizeDesc";
    }
    reloadWithPath(_path);
}

function pathsToProcess() {
    var paths_to_process = _paths_selected;
    if(paths_to_process===null || paths_to_process.length===0){
        paths_to_process = _last_paths_selected;
    }
    if(paths_to_process===null){
        paths_to_process = [];
    }
    return paths_to_process;
}

function clearLastSelectedPaths() {
    _paths_selected = [];
    _last_paths_selected = [];
}

function optionsPopoverPathToProcess() {
    var path_to_process = _optionsPopoverPath;
    if(path_to_process===null || path_to_process.length===0){
        path_to_process = _last_optionsPopoverPath;
    }
    if(path_to_process===null){
        path_to_process = '';
    }
    return path_to_process;
}

function clearOptionsPopoverPathToProcess(){
    _last_optionsPopoverPath = null;
    _optionsPopoverPath = null;
}

function actionListLayout() {
    setLayout('list');
    reload();
    sendWebCommandAndData("LAYOUT_CHANGED","list");
}

function actionGridLayout() {
    setLayout('grid');
    reload();
    sendWebCommandAndData("LAYOUT_CHANGED","grid");
}

function actionCreateFolder() {
    $("#create-input").val("%untitled_folder_str%");
    $("#create-modal").modal("show");
}
