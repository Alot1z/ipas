
var _filesArchivingData = {};
var ArchiveElements = null;

var initArchivePanel = function () {
    
    _filesArchivingData = {};
    
    ArchiveElements = {
        archivePanel: $("#global-archive-panel"),
        archiveStatus: $("#global-archive-status"),
        archiveCancelCtrl: $("#global-archive-action-cancel"),
        archiveProgress: $("#global-archive-progress")
    };
    
    setArchivePanelBottomPositionDefault();
    
    ArchiveElements.archiveCancelCtrl.click(function (event) {
        Object.keys(_filesArchivingData).forEach(function(key) { delete _filesArchivingData[key]; });
        sendWebCommand("ARCHIVE_CANCEL");
        updateArchiveProgressBar(ArchiveElements.archiveProgress, 0);
        hideArchivePanel();
    });
};

var updateGlobalArchiveStatusText = function (filesCount,fileName, progress) {
    var statusText = "%preparing_download_str%";
    if(filesCount>0){
        var progressText = progress.toFixed(0) + "%";
        statusText = filesCount === 1
        ? "%preparing_download_dots_str% " + progressText
        : "%preparing_download_str% " + filesCount + " %files_dots_str% " + progressText;
    }
    ArchiveElements.archiveStatus.text(statusText);
};

var totalArchivingFilesCount = function (){
    return Object.keys(_filesArchivingData).length;
};

var totalArchivingFilesProgress = function (){
    var totalProgress = 0;
    var itemsCount = totalArchivingFilesCount();
    if(itemsCount>0){
        Object.keys(_filesArchivingData).forEach(function(key) {
            var jsonObj = _filesArchivingData[key];
            var progress = jsonObj.progress;
            totalProgress+=progress;
        });
        return totalProgress/itemsCount;
    }
    return 0;
};

var archivingFileName = function (){
    if(totalArchivingFilesCount()>0){
        return Object.keys(_filesArchivingData)[0];
    }
    return "";
};

var updateFilesArchivingData = function (obj){
    if(_filesArchivingData[obj.path]!==null){
        _filesArchivingData[obj.path] = obj;
    }
};

var archiveOperationChangedProgress = function (data){
    var obj = jsonObjFromMessageData(data);
    if(totalArchivingFilesCount()>0){
        updateFilesArchivingData(obj);
        updateGlobalArchiveStatusText(totalArchivingFilesCount(),archivingFileName(), totalArchivingFilesProgress());
        updateArchiveProgressBar(ArchiveElements.archiveProgress, totalArchivingFilesProgress());
    }
}

var archiveOperationStarted = function (data) {
    var obj = jsonObjFromMessageData(data);
    _filesArchivingData[obj.path] = obj;
    updateArchivePanelVisibility();
    updateGlobalArchiveStatusText(totalArchivingFilesCount(),archivingFileName(), totalArchivingFilesProgress());
};

var archiveOperationCompleted = function (data,success) {
    var obj = jsonObjFromMessageData(data);
    var archivePath = obj.path;
    delete _filesArchivingData[archivePath]; 
    updateArchivePanelVisibility();
    if(success){
        setTimeout(function () {
            window.location = "rdwifidrive/archives?sid="+getSID()+"&path=" + encodeURIComponent(archivePath);
        }, 0);
    }
};  

var updateArchivePanelVisibility = function () {
    if(totalArchivingFilesCount()){
        showArchivePanel();
    }
    else{
        hideArchivePanel();
        resetArchiveProgressBar();
    }
};  

var hideArchivePanel = function () {
    DomUtils.hideElement(ArchiveElements.archivePanel);
};

var showArchivePanel = function () {
    resetArchiveProgressBar();
    DomUtils.showElement(ArchiveElements.archivePanel);
};

var setArchivePanelBottomPositionDefault = function () {
    ArchiveElements.archivePanel.removeClass("global-archive-panel-bottom-position-top");
    ArchiveElements.archivePanel.addClass("global-archive-panel-bottom-position-default");
};

var setArchivePanelBottomPositionTop = function () {
    ArchiveElements.archivePanel.removeClass("global-archive-panel-bottom-position-default");
    ArchiveElements.archivePanel.addClass("global-archive-panel-bottom-position-top");
};

var updateArchiveProgressBar = function (element, progress) {
    element.css("width", progress + "%");
};

var resetArchiveProgressBar = function () {
    updateArchiveProgressBar(ArchiveElements.archiveProgress, 0);
};

