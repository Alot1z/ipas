

function initUpload() {
    
    var filesUploading = 0;
    var filesUploaded = 0;
    var filesFailed = 0;
    var filesCancelled = 0;
    var lastUploadedFileName = "";
    var lastFailedFileName = "";
    var lastCancelledFileName = "";

    var Elements = {
        
        uploadPanel: $("#global-upload-panel"),
        uploadStatus: $("#global-upload-status"),
        uploadDetailCtrl: $("#global-upload-panel-details-id"),
        
        uploadHeader: $("#modal-upload-header"),
        uploadDialogOpener: $("#upload-dialog-opener"),
        uploadModal: $("#modal-upload-id"),
        uploadList: $("#table-uploads-id"),
        totalProgress: $("#global-upload-progress"),
        
        globalUploadHint: $("#global-upload-dragover-hint"),
        globalUploadHintFolder: $("#global-upload-dragover-hint-folder"),
        
        uploadResultPanel: $("#global-upload-result-panel"),
        uploadResultStatus: $("#global-upload-result-status"),
        uploadResultDetailCtrl: $("#global-upload-result-action__details"),
        uploadResultCloseCtrl: $("#global-upload-result-action__close"),
        uploadResultStatusIconImg: $("#global-upload-result__icon_img"),
        
        clearUploadsListCtrl: $("#btn-clear-uploads-list-id"),
        cancelAllUploadsCtrl: $("#btn-cancel-all-uploads-id"),
        retryAllCtrl: $("#btn-retry-all-id"),
    };

    var StatusTemplates = {
        success: "<div class='file-upload-list__success'></div>",
        fail: "<div class='file-upload-list__fail'></div>",
        remove: "<a class='file-upload-list__remove'></a>"
    }

    var Selectors = {
        uploadListItem: ".file-upload-list__item",
        uploadListItemProgress: ".file-upload-list__progress",
        uploadListItemRemove: ".file-upload-list__remove",
        uploadListItemRetry: ".file-upload-list__retry",
        uploadListItemSize: ".file-upload-list__size",
        uploadListItemStatusAction: ".file-upload-list__action"
    };

    var updateGlobalUploadStatusText = function (filesCount, progress) {
        var statusText = "%uploads_str%";
        if(filesCount>0){
            var progressText = progress + "%";
            statusText = filesCount === 1
            ? "%uploading_file_str% " + progressText
            : "%uploading_str% " + filesCount + " %files_dots_str% " + progressText;
        }
        Elements.uploadStatus.text(statusText);
        Elements.uploadHeader.text(statusText);
    };
    
    var showUploadOperationResult = function () {
        
        DomUtils.showElement(Elements.uploadResultPanel);
        setArchivePanelBottomPositionTop();
        setDeletePanelBottomPositionTop();
        
        var statusText = "";
        var statusIcon = "";

        DomUtils.hideElement(Elements.uploadResultDetailCtrl);
        DomUtils.hideElement(Elements.uploadResultCloseCtrl);

        var filesFailedOrCancelled = filesFailed + filesCancelled;
        var lastFailedOrcancelledFileName = lastFailedFileName.length>0?lastFailedFileName:lastCancelledFileName;
        
        if(filesUploaded>0){
            statusText = (filesUploaded === 1)
                        ? "" + StringUtils.fitLenMiddle(lastUploadedFileName,15) + " %has_been_uploaded_str%"
                        : "" + filesUploaded + " %files_have_been_uploaded_str% ";
            statusIcon = "../images/upload-success.png"; 
            DomUtils.showElement(Elements.uploadResultCloseCtrl);
            if(filesFailedOrCancelled>0){
                DomUtils.showElement(Elements.uploadResultDetailCtrl);
            }
        }
        else if(filesFailedOrCancelled>0){
            statusText = (filesFailedOrCancelled === 1)
                ? "%failed_to_upload_str% " + lastFailedOrcancelledFileName
                : "%failed_to_upload_str% " + filesFailedOrCancelled + " %files_str%";
            statusIcon = "../images/upload-fail.png";
            DomUtils.showElement(Elements.uploadResultDetailCtrl);
            DomUtils.showElement(Elements.uploadResultCloseCtrl);
        }

        Elements.uploadResultStatus.text(statusText);
        Elements.uploadResultStatusIconImg.attr("src",statusIcon);
    };
    
    var hideUploadOperationResult = function () {
        DomUtils.hideElement(Elements.uploadResultPanel);
        setArchivePanelBottomPositionDefault();
        setDeletePanelBottomPositionDefault();
    };
    
    var hideUploadPanel = function () {
        DomUtils.hideElement(Elements.uploadPanel);
        setArchivePanelBottomPositionDefault();
        setDeletePanelBottomPositionDefault();
    };
    
    var showUploadPanel = function () {
        DomUtils.showElement(Elements.uploadPanel);
        setArchivePanelBottomPositionTop();
        setDeletePanelBottomPositionTop();
    };

    var updateUploadProgressBar = function (element, progress) {
        element.css("width", progress + "%");
    };
    
    var resetUploadProgressBar = function () {
        updateUploadProgressBar(Elements.totalProgress, 0);
    };

    var resetUploadProgressData = function () {
        filesUploading = 0;
        filesUploaded = 0;
        filesFailed = 0;
        filesCancelled = 0;
        lastUploadedFileName = "";
        lastFailedFileName = "";
        lastCancelledFileName = "";
    };
    
    var updateUploadProgressData = function(){
        resetUploadProgressData();

        $('.file-upload-list__item-progress-wrapper').each(function() {
            var jsonData = $(this).data('data') || {};
            
            var isCompleted =  (jsonData.completed!==null && jsonData.completed==='1');
            var isSuccess =  (jsonData.success!==null && jsonData.success==='1');
            var isFailed =  (jsonData.failed!==null && jsonData.failed==='1');
            var isCancelled =  (jsonData.cancelled!==null && jsonData.cancelled==='1');
            var fileName =  (jsonData.file!==null)?jsonData.file.name:'';
            
            if(isCompleted){
                if(isSuccess){
                    filesUploaded++;
                    lastUploadedFileName = fileName;
                }
                else if(isFailed){
                    filesFailed++;
                    lastFailedFileName = fileName;
                }
                else if(isCancelled){
                    filesCancelled++;
                    lastCancelledFileName = fileName;
                }
            }
            else{
                filesUploading++;
            }
        });

    };

    var renderUploadListItem = function (path, file) {
        var cleanPath = path === "/"
            ? path
            : "/"+StringUtils.lastPathComponenet(path);

        var $item = $(tmpl("template-uploads", {
            name: file.name,
            path: cleanPath,
            size: StringUtils.humanFileSize(file.size)
        }));
        $item.find(Selectors.uploadListItemStatusAction).append(StatusTemplates.remove);
        $item.appendTo(Elements.uploadList);
        return $item;
    };
    
    var addDataContext = function (e, data, file, destinationPath) {
        
        var uploadItem = renderUploadListItem(destinationPath, file);
        data.context = uploadItem;
        
        //fix for Safari 
        //when we upload package files
        var files = [];
        files.push(file);
        data.files = files;
        
        var jqXHR = data.submit();
        uploadItem.data('data',{jqXHRequest: jqXHR, completed: '0', failed: '0', cancelled: '0', success: '0', file: file});

        data.context.find(Selectors.uploadListItemRemove).click(function (event) {
            log.log("cancel", file);
            jqXHR.abort();
        });
        
        DomUtils.hideElement(data.context.find(Selectors.uploadListItemRetry));
        DomUtils.showElement(data.context.find(Selectors.uploadListItemSize));
        data.context.find(Selectors.uploadListItemRetry).click(function (event) {
            log.log("retry", file);
            data.context.remove();
            addDataContext(e,data,file,destinationPath);
            updateUploadProgressData();
            event.stopPropagation();
        });
        
    };

    // Workaround Firefox and IE not showing file selection dialog when clicking on "btn-upload" <button>
    // Making it a <div> instead also works but then it the button doesn't work anymore with tab selection or accessibility
    $("#btn-upload").click(function (event) {
        $("#file-upload").click();
    });

    // Prevent event bubbling when using workaround above
    $("#file-upload").click(function (event) {
        hideAllPopovers();
        _dropZonePath = null;
        event.stopPropagation();
    });

    $("#file-upload").fileupload({
        dropZone: $(".dropzone"),
        pasteZone: null,
        autoUpload: true,
        sequentialUploads: false,
        limitConcurrentUploads: 3,
        progressInterval: 500,
        bitrateInterval: 1000,  
        url: 'rdwifidrive/upload',
        type: 'POST',
        dataType: 'json',
                
        beforeSend: function(xhr, data) {
            xhr.setRequestHeader("Session-Id", getSID());
        },

        start: function (e) {
            showUploadPanel();
            hideUploadOperationResult();
        },

        stop: function (e) {
           hideUploadPanel();
           showUploadOperationResult();
           updateGlobalUploadStatusText(0, 0);
           updateUploadProgressBar(Elements.totalProgress, 0);
           if(filesFailed===0 && filesCancelled===0){
                setTimeout(function () {
                     hideUploadOperationResult();
                     resetUploadProgressData();
                     resetUploadProgressBar();
                     reloadWithPath(_path);
                }, 2000);
            }
        },

        add: function (e, data) {
            if (!filesUploading) {
                Elements.uploadList.empty();
            }
            var obj = data.files[0];
            var file = obj;
                  
            ////File Example             
            //lastModified: 1522352277000
            //name: "8 Course Mini - Calculator 1 Into.mp4"
            //relativePath: ""
            //size: 4074060
            //type: "video/mp4"
            //webkitRelativePath: ""

            if(obj instanceof File){
                file = obj;
            }
            //===========check Safari case===========================
            //Example entry:
            //FileSystemDirectoryEntry
            //filesystem: FileSystem {name: "6bd82a21-419c-4448-ad00-592b9cbfbe7f", root: FileSystemDirectoryEntry}
            //fullPath: "/OpenOffice Landscape xls.numbers.zip"
            //isDirectory: true
            //isFile: false
            //name: "OpenOffice Landscape xls.numbers.zip"

            else if(obj.entry._file !== undefined && obj.entry._file instanceof File){
                file = obj.entry._file;
            }
            else if(obj.entry !== undefined && obj.entry instanceof FileSystemDirectoryEntry && StringUtils.pathExtension(obj.entry.name)==="zip"){
                file = {name: obj.entry.name.replace(/^.*\\/, ''), type: "application/zip"};
            }
            
            if(file!==null){
                filesUploading++;
                var destinationPath = _dropZonePath || _path;
        
                if (file.relativePath !== undefined){
                    destinationPath = destinationPath + file.relativePath;
                }
                data.formData = {
                    path: destinationPath
                };
                
                var components = destinationPath.split("/").slice(1, -1);
                var destinationPathValid = true;
                
                //check destination path components
                for (var i = 0; i < components.length; i++) {
                    var subpath = "" + components[i];
                    if(StringUtils.checkIfFileNameSupported(subpath)===false){
                        destinationPathValid = false;
                        break;
                    }
                }
                
                if(isCurrentPathReadOnly() &&  destinationPath.indexOf(StringUtils.trimFinalSlash(_path)) === 0 ){
                    destinationPathValid = false;
                }
                
                if(StringUtils.checkIfFileNameSupported(file.name)===true && destinationPathValid===true){
                    addDataContext(e,data,file,destinationPath);
                }
                
            }
        },

        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);

            var $uploadListItem = data.context.find(Selectors.uploadListItem);
            var $uploadListItemProgress = data.context.find(Selectors.uploadListItemProgress);

            if($uploadListItem.hasClass('active')===false){
                $uploadListItem.addClass('active');
                DomUtils.showElement($uploadListItemProgress);
            }
            
            if($uploadListItem.hasClass('failed')===true){
                $uploadListItem.removeClass('failed');
            }
            
            updateUploadProgressBar($uploadListItemProgress, progress);
        },

        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            updateGlobalUploadStatusText(filesUploading, progress);
            updateUploadProgressBar(Elements.totalProgress, progress);
        },

        done: function (e, data) {
            
            var jsonData = data.context.data('data') || {};
            if (jsonData.completed){
                jsonData.completed = '1';
            }
            if (jsonData.success){
                jsonData.success = '1';
            }
            
            var $action = data.context.find(Selectors.uploadListItemStatusAction);
            $action.empty();
            $action.append(StatusTemplates.success);

            var $uploadListItem = data.context.find(Selectors.uploadListItem);
            $uploadListItem.removeClass('active');
            
            DomUtils.hideElement(data.context.find(Selectors.uploadListItemProgress));

            updateUploadProgressData();
        },

        fail: function (e, data) {
            
            var file = data.files[0];
            
            var jsonData = data.context.data('data') || {};
            if (jsonData.completed){
                jsonData.completed = '1';
            }

            if (data.errorThrown !== "abort") {
                if (jsonData.failed){
                    jsonData.failed = '1';
                }
                if (_isSafari && ( file.type==="" || file.type===undefined ) ) {
                    showSafariErrorAlert();
                }
                //else{
                //    showError("Failed uploading \"" + file.name + "\"", data.textStatus, data.errorThrown);
                //}
            }
            else{
                if (jsonData.cancelled){
                    jsonData.cancelled = '1';
                }
            }
            
            var $action = data.context.find(Selectors.uploadListItemStatusAction);
            $action.empty();
            $action.append(StatusTemplates.fail);
            
            var $uploadListItem = data.context.find(Selectors.uploadListItem);
            $uploadListItem.removeClass('active');
            
            if($uploadListItem.hasClass('failed')===false){
                $uploadListItem.addClass('failed');
            }
            
            DomUtils.hideElement(data.context.find(Selectors.uploadListItemProgress));
            DomUtils.showElement(data.context.find(Selectors.uploadListItemRetry));
            DomUtils.hideElement(data.context.find(Selectors.uploadListItemSize));

            updateRetryAllButtonVisibility();
            updateUploadProgressData();
        }
    });

    Elements.uploadDialogOpener.click(function (event) {
        showUploadModal();
    });
    
    Elements.uploadResultDetailCtrl.click(function (event) {
        showUploadModal();
    });

    var updateRetryAllButtonVisibility = function () {
        var listContainsItemsToRetry = false;
        $('.file-upload-list__item-progress-wrapper').each(function() {
            var jsonData = $(this).data('data') || {};
            if ((jsonData.failed!==null && jsonData.failed==='1') || (jsonData.cancelled!==null && jsonData.cancelled==='1')){
                listContainsItemsToRetry = true;
                return false;
            } 
        });
        if(listContainsItemsToRetry===true){
            DomUtils.showElement(Elements.retryAllCtrl);
        }
        else{
            DomUtils.hideElement(Elements.retryAllCtrl);
        }
    };

    var showUploadModal = function () {
        Elements.uploadModal.modal("show");
        updateRetryAllButtonVisibility();
    };

    Elements.cancelAllUploadsCtrl.click(function (event) {
        $('.file-upload-list__item-progress-wrapper').each(function() {
            var jsonData = $(this).data('data') || {};
            if (jsonData.jqXHRequest){
               jsonData.jqXHRequest.abort();
            }            
        });
        reloadWithPath(_path);
        updateRetryAllButtonVisibility();
    });
    
    Elements.clearUploadsListCtrl.click(function (event) {
        var uploadingItemsCount = 0;
        $('.file-upload-list__item-progress-wrapper').each(function() {
            var jsonData = $(this).data('data') || {};
            if (jsonData.completed!==null && jsonData.completed==='1'){
                $(this).remove();
            } 
            else{
                uploadingItemsCount++;
            }
        });
        reloadWithPath(_path);
        updateRetryAllButtonVisibility();
        if(uploadingItemsCount===0){
            hideUploadPanel();
            hideUploadOperationResult();
            resetUploadProgressData();
        }
    });
    
    Elements.retryAllCtrl.click(function (event) {
        $('.file-upload-list__item-progress-wrapper').each(function() {
            var jsonData = $(this).data('data') || {};
            if ((jsonData.failed!==null && jsonData.failed==='1') || (jsonData.cancelled!==null && jsonData.cancelled==='1')){
                $(this).find(Selectors.uploadListItemRetry).click();
            } 
        });
        
        resetUploadProgressBar();
        updateUploadProgressData();
        updateRetryAllButtonVisibility();
        
        showUploadPanel();
        hideUploadOperationResult();
        
        updateGlobalUploadStatusText(filesUploading, 0);
        updateUploadProgressBar(Elements.totalProgress, 0);
    });
    
    Elements.uploadResultCloseCtrl.click(function (event) {
        hideUploadOperationResult();
        resetUploadProgressData();
    });    

    $document.bind('dragover', function (e) {
        var $target = $(e.target),
            $dropZones = $('.dropzone'),
            timeout = window.dropZoneTimeout;

        var $hoveredDropZone = $target.closest($dropZones);
        var $hoveredMetadata = $hoveredDropZone.data();
        var hoveredFilename = $hoveredMetadata.filename || null;
        _dropZonePath = $hoveredMetadata.path || null;
        
        if(isCurrentPathReadOnly() && _dropZonePath===null){
            return;
        }

        if (timeout) {
            clearTimeout(timeout);
        } else {
            $dropZones.addClass('in');
        }
       
        $dropZones.not($hoveredDropZone).removeClass('hover');
        $hoveredDropZone.addClass('hover');

        Elements.globalUploadHintFolder.text(
            hoveredFilename
                ? "'" + StringUtils.fitLenMiddle(hoveredFilename, 20) + "'"
                : "%current_str%"
        );
        DomUtils.showElement(Elements.globalUploadHint);
        setArchivePanelBottomPositionTop();
        setDeletePanelBottomPositionTop();

        window.dropZoneTimeout = setTimeout(function () {
            window.dropZoneTimeout = null;
            $dropZones.removeClass('in hover');
            DomUtils.hideElement(Elements.globalUploadHint);
            setArchivePanelBottomPositionDefault();
            setDeletePanelBottomPositionDefault();
            Elements.globalUploadHintFolder.text("");
        }, 100);
    });
}

