
//https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications


var _webSocket = null;
var _webSocketOpened = false;
var _webSocketConnectFailedAttemptsCount = 0;

function commandFromMessage(message) {
    var columnIndex = message.indexOf(":");
    if (columnIndex === -1) {
        return null;
    }
    return message.substring(0, columnIndex);
}

function dataFromMessage(message) {
    var columnIndex = message.indexOf(":");
    if (columnIndex === -1) {
        return null;
    }
    return message.substring(columnIndex + 1);
}

var jsonObjFromMessageData = function (data) {
    var obj = JSON.parse(data);
    return obj;
};

function processWebCommand(command, data) {
    if (command === "SERVER_DID_STOP") {
        var obj = jsonObjFromMessageData(data);
        var url = obj.url;
        _open_url_on_server_did_stop = url;
        openURLOnServerDidStop();
    }
    else if (command === "OPEN_URL") {
        var obj = jsonObjFromMessageData(data);
        var url = obj.url;
        window.location = url;
    }
    else if (command === "CONNECTION_REJECTED") {
        hidePinCodeModal();
        showNetworkDownModal();
        showConnectionClosed();
    }
    else if (command === "ARCHIVE_PROGRESS") {
        archiveOperationChangedProgress(data);
    }
    else if (command === "ARCHIVE_DONE") {
        archiveOperationCompleted(data, true);
    }
    else if (command === "ARCHIVE_START") {
        archiveOperationStarted(data);
    }
    else if (command === "ARCHIVE_ERROR") {
        archiveOperationCompleted(data, false);
    }
    else if (command === "DELETE_PROGRESS") {
        deleteOperationChangedProgress(data);
    }
    else if (command === "DELETE_DONE") {
        deleteOperationCompleted(data, true);
    }
    else if (command === "DELETE_START") {
        deleteOperationStarted(data);
    }
    else if (command === "DELETE_ERROR") {
        deleteOperationCompleted(data, false);
    }
    else if (command === "SERVER_DID_SUSPEND") {
        var obj = jsonObjFromMessageData(data);
        var timeout = obj.timeout;
        var url = obj.url;
        _open_url_on_server_did_stop = url;
        //        Do not show server suspended message
        //        showNetworkDownModalWithTimeout(timeout);
    }
    else if (command === "SERVER_WILL_TERMINATE") {
        var obj = jsonObjFromMessageData(data);
        var timeout = obj.timeout;
        showNotificationPanel();
        startNotificationTimer(timeout);
    }
    else if (command === "SERVER_DID_RESUME") {
        //        Hide server suspended message
        //        hideNetworkDownModal();
        hideNotificationPanel();
    }
    else if (command === "PING_CLIENT") {
        sendWebCommand("CLIENT_OK");
    }
    else if (command === "SERVER_OPEN_PATH") {
        var obj = jsonObjFromMessageData(data);
        var path = obj.path;
        if (path !== null) {
            reloadWithPath(path);
        }
    }
    else if (command === "FULL_CONTENT_LOAD_DONE") {
        var obj = jsonObjFromMessageData(data);
        var path = obj.options.path;
        if (path === _path) {
            _content_data = obj.content;
            _content_options = obj.options;
            pushMissedItemsToPhotoSwipeGalleryIfVisible();
        }
    }
    else if (command === "PREFETCHED_PHOTOS") {
        var obj = jsonObjFromMessageData(data);
        var photos = obj.content;
        prefetchedPhotosDidLoad(photos);
    }

}

function sendWebCommandAndData(command, data) {
    try {
        if (_webSocket !== null) {
            _webSocket.send("" + command + ":" + data + ":" + getSID());
            log.log("web socket send: " + "" + command + ":" + data);
        }
    }
    catch (error) {
        log.log("web socket send error: " + error);
    }
}

function sendWebCommand(command) {
    sendWebCommandAndData(command, null);
}

function updateWebSocketIfNull() {
    if (_webSocket === null) {
        _webSocketOpened = false;
        _webSocketConnectFailedAttemptsCount = 0;
        updateWebSocket();
    }
}

function updateWebSocket() {

    log.log("updateWebSocket");

    if (_webSocketOpened === true) {
        return;
    }

    try {
        if (_webSocket !== null) {
            _webSocket.close();
        }
    }
    catch (error) {
        log.log("web socket close error: " + error);
    }
    _webSocket = null;

    if ("WebSocket" in window) {
        log.log("WebSocket in window");
        $.ajax({
            cache: false,
            url: 'rdwifidrive/web_socket_url',
            type: 'GET',
            beforeSend: function (request) {
                request.setRequestHeader("Session-Id", getSID());
            },
            dataType: 'json'
        }).fail(function (jqXHR, textStatus, errorThrown) {
            log.log("failed to get web socket url");
        }).done(function (data, textStatus, jqXHR) {
            if (data.url !== null) {
                var socketURL = data.url;
                log.log("received socketURL: " + socketURL);
                _webSocket = new WebSocket(socketURL);
                _webSocket.onopen = function () {
                    log.log("websocket is open");
                    _webSocketOpened = true;
                    _webSocketConnectFailedAttemptsCount = 0;
                    setNeedsPhotoPrefetch(true);
                    prefetchPhotosIfNeeded();
                };
                _webSocket.onmessage = function (evt) {
                    var command = commandFromMessage(evt.data);
                    var data = dataFromMessage(evt.data);
                    //                   log.log("websocket received command: " + command + " data: " + data); 
                    log.log("websocket received command: " + command);
                    processWebCommand(command, data);
                };
                _webSocket.onclose = function () {
                    log.log("websocket is closed");
                    _webSocketOpened = false;
                    _webSocketConnectFailedAttemptsCount++;
                    if (_webSocketConnectFailedAttemptsCount < 5) {
                        setTimeout(() => {
                            updateWebSocket();
                        }, 1000);
                    }
                };
            }
        });
    }
    else {
        log.log("WebSocket not available");
    }

}
