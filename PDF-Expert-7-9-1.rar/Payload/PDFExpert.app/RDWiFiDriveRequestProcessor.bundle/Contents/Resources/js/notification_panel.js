
var NotificationPanelElements = null;
var NotificationTimer = null;


var initNotificationPanel = function () {
    
    NotificationPanelElements = {
        notificationPanel: $("#global-notification-panel"),
        notificationStatus: $("#global-notification-status"),
        notificationCancelCtrl: $("#global-notification-action-cancel"),
        notificationProgress: $("#global-notification-progress")
    };
    
    setNotificationPanelBottomPositionDefault();
    
    NotificationPanelElements.notificationCancelCtrl.click(function (event) {
        sendWebCommand("STOP_SERVER");
        hideNotificationPanel();
        if(_open_url_on_server_did_stop!==null){
           window.location = _open_url_on_server_did_stop;
        }
    });

};

var updateGlobalNotificationPanelStatusText = function (statusText) {
    NotificationPanelElements.notificationStatus.text(statusText);
};

var hideNotificationPanel = function () {
    DomUtils.hideElement(NotificationPanelElements.notificationPanel);
    stopNotificationTimer();
};

var showNotificationPanel = function () {
    resetNotificationProgressBar();
    DomUtils.showElement(NotificationPanelElements.notificationPanel);
};

var setNotificationPanelBottomPositionDefault = function () {
    NotificationPanelElements.notificationPanel.removeClass("global-notification-panel-bottom-position-top");
    NotificationPanelElements.notificationPanel.addClass("global-notification-panel-bottom-position-default");
};

var resetNotificationProgressBar = function () {
    updateNotificationProgressBar(NotificationPanelElements.notificationProgress, 0);
};

var updateNotificationProgressBar = function (element, progress) {
    var profressLeft = 100 - progress;
    element.css("left", progress + "%");
    element.css("width", profressLeft + "%");
};

var updateNotificationProgress = function (progress) {
    updateNotificationProgressBar(NotificationPanelElements.notificationProgress, progress);
};

var stopNotificationTimer = function () {
    if(NotificationTimer!==null){
        clearInterval(NotificationTimer);
        NotificationTimer = null;
    }
};

var startNotificationTimer = function (timeout) {
    
    var timerMillisecondsOffset = timeout * 1000;
    var countDownDate = new Date().getTime()+timerMillisecondsOffset;
    var nowDate = new Date().getTime();
    var futureDistance = countDownDate - nowDate;
    
    stopNotificationTimer();
    
    NotificationTimer = setInterval(function() {
        var now = new Date().getTime();
        var distance = countDownDate - now;
        var progress = 1.0-distance/futureDistance;
        updateNotificationProgress(progress*100);
        if (distance < 0) {
            stopNotificationTimer();
        }
    }, 500);
    
};







