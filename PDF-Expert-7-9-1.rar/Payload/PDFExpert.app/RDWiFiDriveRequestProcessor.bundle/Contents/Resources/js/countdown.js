
var _network_down_modal_visible = false;
var _countDownTimer = null;

function updateCountDownTimerLabel(message) {
    document.getElementById("timer_label").innerHTML = message;
}

function stopCountDownTimer() {
    if(_countDownTimer!==null){
        clearInterval(_countDownTimer);
        _countDownTimer = null;
    }
}

function startCountDownTimer(timeout) {
    
    var timerMillisecondsOffset = timeout * 1000;
    var countDownDate = new Date().getTime()+timerMillisecondsOffset;
    
    stopCountDownTimer();
    
    _countDownTimer = setInterval(function() {

        var now = new Date().getTime();
        var distance = countDownDate - now;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Output the result in an element with id="demo"
        //document.getElementById("timer_label").innerHTML = days + "days " + hours + "hours "
        //+ minutes + "minutes " + seconds + "seconds ";
                                                           
        var minutesStr = ((minutes>=10)?"":"0") + minutes;
        var secondsStr = ((seconds>=10)?"":"0") + seconds;
                                  
        if(minutes>0 || seconds >=0 ){
            updateCountDownTimerLabel("" + minutesStr + ":" + secondsStr);
        }
        else{
            updateCountDownTimerLabel("%closing_str%");
        }

        // If the count down is over, write some text 
        if (distance < 0) {
            stopCountDownTimer();
            if(openURLOnServerDidStop()===false){
                showConnectionClosed();
            }
        }
        
    }, 500);
}

function showNetworkDownModalWithTimeout(timeout){
    showApplicationSuspended();
    showNetworkDownModal();
    startCountDownTimer(timeout);
}

function showNetworkDownModal(){
    hideAllModals();
    hideAllPopovers();
    _network_down_modal_visible = true;
    setTimeout(function () {
        if(_network_down_modal_visible){
            $("#network-down-modal").modal("show");
        }
    }, 1000);
}

function hideNetworkDownModal(){
    _network_down_modal_visible = false;
    $("#network-down-modal").modal("hide");
    stopCountDownTimer();
}

function showApplicationSuspended(){
    DomUtils.showElement($("#application-suspended-title-id"));
    DomUtils.showElement($("#connection-terminated-countdown-id"));
    DomUtils.showElement($("#application-suspended-close-button-id"));
    DomUtils.showElement($("#close-session"));
    DomUtils.hideElement($("#connection-closed-title-id"));
    DomUtils.hideElement($("#connection-closed-id"));
}

function showConnectionClosed(){
    DomUtils.hideElement($("#application-suspended-title-id"));
    DomUtils.hideElement($("#connection-terminated-countdown-id"));
    DomUtils.hideElement($("#application-suspended-close-button-id"));
    DomUtils.hideElement($("#close-session"));
    DomUtils.showElement($("#connection-closed-title-id"));
    DomUtils.showElement($("#connection-closed-id"));
}
