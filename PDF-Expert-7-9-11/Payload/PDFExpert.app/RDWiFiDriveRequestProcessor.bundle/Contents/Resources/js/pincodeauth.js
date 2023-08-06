


function clearPinCodeState(){
    DomUtils.hideElement($("#verification-code-incorrect__label"));
    DomUtils.hideElement($("#verification-code-correct__label"));
    var $pin_code_input_all = $('.pincode-input-text');
    $pin_code_input_all.each(function () {
        $(this).val("");
    }); 
    
    var $pin_code_input_first = $('.pincode-input-text.first');
    $pin_code_input_first.each(function () {
        $(this).focus();
    }); 
}

function hidePinCodeModal(){
    $("#verification-code-modal").modal("hide");
}

function showPinCodeModal(){
    $("#verification-code-modal").modal("show");
}

function startPinCodeAuth(){
    
    hideAllErrors();
    
    $.ajax({
                cache: false,
                 url: 'rdwifidrive/auth',
                 type: 'GET',
                 data: {step: "INIT"},
                 dataType: 'json'
            }).fail(function (jqXHR, textStatus, errorThrown) {
                
            }).done(function (data, textStatus, jqXHR) {

                var pin_length = 4;
                if(jqXHR.responseJSON.code_length>0){
                    pin_length = jqXHR.responseJSON.code_length;
                }
                
                $('#verification-code-input').pincodeInput(
                    {
                        inputs:pin_length,
                        hidedigits:false,
                        change: 
                                function(input,value,inputnumber){
                                    DomUtils.hideElement($("#verification-code-incorrect__label"));
                                    DomUtils.hideElement($("#verification-code-correct__label"));
                                    log.log("onchange from input number "+inputnumber+", current value: " + value, input);
                                },
                        complete:
                                function(value, e, errorElement){
                                    log.log("code entered: " + value);
                                    $.ajax({
                                        cache: false,
                                         url: 'rdwifidrive/auth',
                                         type: 'GET',
                                         data: {step: "CODE",code: value},
                                         dataType: 'json'
                                    }).fail(function (jqXHR, textStatus, errorThrown) {
                                        log.log("error sending code");
                                        hidePinCodeModal();
                                        reloadWithPath(_path);    
                                    }).done(function (data, textStatus, jqXHR) {
                                        var response_status = jqXHR.responseJSON.status;
                                        if(response_status==="OK"){
                                            setSID(""+value);
                                            DomUtils.showElement($("#verification-code-correct__label"));
                                            setTimeout(function () {
                                                hidePinCodeModal();
                                                window.location.hash = "#" + encodeURIComponent("/");
                                                reloadWithPath("/");
                                            }, 2000);                                            
                                        }
                                        else if(response_status==="FAILED_ATTEMPTS_LIMIT_REACHED"){
                                            hidePinCodeModal();
                                            showConnectionClosed();
                                            showNetworkDownModal();
                                        }
                                        else if(response_status==="INCORRECT_CODE"){
                                            DomUtils.showElement($("#verification-code-incorrect__label"));
                                            setTimeout(function () {
                                                clearPinCodeState();
                                            }, 2000);
                                        }
                                    });
                                }
                    }
                );
        
                $("#verification-code-modal").on("shown.bs.modal", function (event) {
                    clearPinCodeState();
                });
                
                showPinCodeModal();

            });
}

