
var SelectElements = null;

var initSelectPanel = function () {
    
    SelectElements = {
        selectPanel: $("#global-select-panel"),
        selectStatus: $("#global-select-status")
    };
    
    setSelectPanelBottomPositionDefault();
    
    $("#btn-multi-download").click(function (event) {
        if ($(this).hasClass("disabled")) {
            return false;
        }
        actionMultipleDownload();
    });

    $("#btn-multi-delete").click(function (event) {
        if ($(this).hasClass("disabled")) {
            return false;
        }
        actionMultipleDelete();
    });
    
};

var updateGlobalSelectStatusText = function () {
    var statusText = selectedItemsTitle();
    SelectElements.selectStatus.text(statusText);
};

function selectedItemsTitle(){
    var title = "";  
    if(selectedPathsCount()>1){
       title = "%selected_str%: " + selectedPathsCount();
    } 
    else{
        var name = selectedPathName();
        title = "%selected_str%: " + name;
    }
    return title;
}

var totalSelectedFilesCount = function (){
    return selectedPathsCount();
};

var selectedFileName = function (){
    return selectedPathName();
};

var selectedItemsDidChange = function () {
    updateSelectPanelVisibility();
    updateGlobalSelectStatusText();
    updateHeaderActions();
};

function updateHeaderActions() {

    //update create folder visibility
    if(isPhotoLibraryContent()===true){
        DomUtils.hideElement($("#btn-create-folder"));
    }
    else{
         DomUtils.showElement($("#btn-create-folder"));
    }
   
    //update download/delete button visibility
    var array = _paths_selected;
    var arrayLength = array.length;
    if (arrayLength > 0) {
        DomUtils.showElement($("#btn-multi-download"));
        DomUtils.showElement($("#btn-multi-delete"));
        $("#btn-create-folder").addClass('disabled');
    }
    else {
        DomUtils.hideElement($("#btn-multi-download"));
        DomUtils.hideElement($("#btn-multi-delete"));
        $("#btn-create-folder").removeClass('disabled');
    } 
   
    if(isPhotoLibraryAlbumDetailContent()===true){
        DomUtils.hideElement($("#btn-multi-delete"));
    }
    
}

var updateSelectPanelVisibility = function () {
    if(totalSelectedFilesCount()){
        showSelectPanel();
    }
    else{
        hideSelectPanel();
    }
};  

var hideSelectPanel = function () {
    DomUtils.hideElement(SelectElements.selectPanel);
};

var showSelectPanel = function () {
    DomUtils.showElement(SelectElements.selectPanel);
};

var setSelectPanelBottomPositionDefault = function () {
    SelectElements.selectPanel.removeClass("global-select-panel-bottom-position-top");
    SelectElements.selectPanel.addClass("global-select-panel-bottom-position-default");
};

var setSelectPanelBottomPositionTop = function () {
    SelectElements.selectPanel.removeClass("global-select-panel-bottom-position-default");
    SelectElements.selectPanel.addClass("global-select-panel-bottom-position-top");
};
