
var _lastErrorMessage = null;

function showError(message, textStatus, errorThrown) {
    if(message!==_lastErrorMessage){
        _lastErrorMessage = message;
        if(showErrorOnPhotoSwipeGallery(message, textStatus, errorThrown)===false){
            
            $("#alerts").prepend(tmpl("template-alert", {
                    level: "danger",
                    title: (errorThrown != "" ? errorThrown : textStatus) + ": ",
                    description: message
            }));

            //alert callbacks
            $('#error-alert').on('closed.bs.alert', function () {
                alertDismissed();
            });
            
            $("#btn-close-alert").click(function (event) {
                alertDismissed();
            }); 
            
        }
    }
}

function hideAllErrors() {
    $("#btn-close-alert").click(); 
}

function hideAllErrorsAfterTimeout(timeout) {
    setTimeout(function () {hideAllErrors();}, timeout);   
}

function alertDismissed() {
    _lastErrorMessage = null;
}

function showSafariErrorAlert() {
    $("#alerts").prepend(tmpl("template-safari-error-alert", {}));
}
