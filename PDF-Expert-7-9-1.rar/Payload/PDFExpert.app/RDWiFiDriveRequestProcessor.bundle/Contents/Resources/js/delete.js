
var _filesDeletingData = {};
var DeleteElements = null;

var initDeletePanel = function () {
    
    _filesDeletingData = {};
    
    DeleteElements = {
        deletePanel: $("#global-delete-panel"),
        deleteStatus: $("#global-delete-status"),
        deleteCancelCtrl: $("#global-delete-action-cancel"),
        deleteProgress: $("#global-delete-progress")
    };
    
    setDeletePanelBottomPositionDefault();
    
    DeleteElements.deleteCancelCtrl.click(function (event) {
        Object.keys(_filesDeletingData).forEach(function(key) { delete _filesDeletingData[key]; });
        sendWebCommand("DELETE_CANCEL");
        updateDeleteProgressBar(DeleteElements.deleteProgress, 0);
        hideDeletePanel();
    });
};

var updateGlobalDeleteStatusText = function (filesCount, progress) {
    var statusText = "%delete_str%";
    if(filesCount>0){
        var progressText = progress + "%";
        statusText = filesCount === 1
        ? "%deleting_file_str% " + progressText
        : "%deleting_str% " + filesCount + " %files_dots_str% " + progressText;
    }
    DeleteElements.deleteStatus.text(statusText);
};

var totalDeletingOperationsCount = function (){
    return Object.keys(_filesDeletingData).length;
};

var totalDeletingFilesCount = function (){
    var totalCount = 0;
    var operationsCount = totalDeletingOperationsCount();
    if(operationsCount>0){
        Object.keys(_filesDeletingData).forEach(function(key) {
            var jsonObj = _filesDeletingData[key];
            var count = jsonObj.count;
            totalCount+=count;
        });
        return totalCount;
    }
    return 0;
};
    
var totalDeletingFilesProgress = function (){
    var totalProgress = 0;
    var itemsCount = totalDeletingOperationsCount();
    if(itemsCount>0){
        Object.keys(_filesDeletingData).forEach(function(key) {
            var jsonObj = _filesDeletingData[key];
            var progress = jsonObj.progress;
            totalProgress+=progress;
        });
        return totalProgress/itemsCount;
    }
    return 0;
};

var updateFilesDeletingData = function (obj){
    if(_filesDeletingData[obj.path]!==null){
        _filesDeletingData[obj.path] = obj;
    }
};

var deleteOperationChangedProgress = function (data){
    var obj = jsonObjFromMessageData(data);
    if(totalDeletingOperationsCount()>0){
        updateFilesDeletingData(obj);
        updateGlobalDeleteStatusText(totalDeletingFilesCount(), totalDeletingFilesProgress());
        updateDeleteProgressBar(DeleteElements.deleteProgress, totalDeletingFilesProgress());
    }
}

var deleteOperationStarted = function (data) {
    var obj = jsonObjFromMessageData(data);
    _filesDeletingData[obj.path] = obj;
    updateDeletePanelVisibility();
    updateGlobalDeleteStatusText(totalDeletingFilesCount(), totalDeletingFilesProgress());
};

var deleteOperationCompleted = function (data,success) {
    var obj = jsonObjFromMessageData(data);
    var deleteOperationPath = obj.path;
    delete _filesDeletingData[deleteOperationPath];
    updateDeletePanelVisibility();
    if(success){
        reloadWithPath(_path);
    }
};  

var updateDeletePanelVisibility = function () {
    if(totalDeletingOperationsCount()){
        showDeletePanel();
    }
    else{
        hideDeletePanel();
        resetDeleteProgressBar();
    }
};  

var hideDeletePanel = function () {
    DomUtils.hideElement(DeleteElements.deletePanel);
};

var showDeletePanel = function () {
    DomUtils.showElement(DeleteElements.deletePanel);
};

var setDeletePanelBottomPositionDefault = function () {
    DeleteElements.deletePanel.removeClass("global-delete-panel-bottom-position-top");
    DeleteElements.deletePanel.addClass("global-delete-panel-bottom-position-default");
};

var setDeletePanelBottomPositionTop = function () {
    DeleteElements.deletePanel.removeClass("global-delete-panel-bottom-position-default");
    DeleteElements.deletePanel.addClass("global-delete-panel-bottom-position-top");
};

var updateDeleteProgressBar = function (element, progress) {
    element.css("width", progress + "%");
};

var resetDeleteProgressBar = function () {
    updateDeleteProgressBar(DeleteElements.deleteProgress, 0);
};

