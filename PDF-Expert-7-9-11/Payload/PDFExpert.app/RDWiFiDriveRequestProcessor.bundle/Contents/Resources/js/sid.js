

function getSID() {
    var localStorage = window.localStorage;
    var data = localStorage.getItem('sid');
    if(data===null){
        data='';
    }
    return data;
}

function setSID(sid) {
    var localStorage = window.localStorage;
    if(sid!==null && sid.length>0){
        localStorage.setItem('sid', sid);
    }
    else{
        localStorage.removeItem('sid');
    }
}

function updateSID(){
    log.log("updateSID"); 
    var query = window.location.search.substring(1);
    log.log("updateSID query: " +  query); 
    if(query !== undefined && query!==null && query.length>0){
        var sid = (StringUtils.parseQuery(query)).sid;
        if(sid !== undefined && sid!==null && sid.length>0){
            sid = sid.replace("/", "");
            log.log("sid: " + sid);
            setSID(sid);
            return true;
        }
        else{
            var pin = (StringUtils.parseQuery(query)).pin;
            if(pin !== undefined && pin!==null && pin.length>0){
                pin = pin.replace("/", "");
                log.log("pin: " + pin);
                setSID(pin);
                return true;
            }
        }
    }
    return false;
}
