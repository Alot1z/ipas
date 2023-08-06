

var _currentPopoverTarget = null;
var _shouldDeselectAllFilesOnPopoverDismiss = false; 

function setShouldDeselectAllFilesOnPopoverDismiss(){
      _shouldDeselectAllFilesOnPopoverDismiss = true; 
}

function clearShouldDeselectAllFilesOnPopoverDismiss(){
    _shouldDeselectAllFilesOnPopoverDismiss = false;
}

function hideAllPopovers(){
    
    //do not hide all popovers 
    //for visible elements for perfomance reasons
    //$("[data-toggle='popover']").popover('hide');
    
    //we need to store _last_paths_selected 
    //because of deselectAllFilesOnPopoverDismiss logic
    _last_paths_selected = StringUtils.cloneStringsArray(_paths_selected);
    
    //we need to store _optionsPopoverPath 
    //because action handlers are called after popover dismissed
    if(_optionsPopoverPath!==null &&  _optionsPopoverPath!==undefined){
        _last_optionsPopoverPath = _optionsPopoverPath.slice(0)
    }
    _optionsPopoverPath = null;
    hideCurrentPopover();
    if(_shouldDeselectAllFilesOnPopoverDismiss===true){
        _shouldDeselectAllFilesOnPopoverDismiss = false;
        deselectAllCells();
    }     
}

function hideCurrentPopover(){
    if(_currentPopoverTarget!==null){
        _currentPopoverTarget.popover('hide');
        _currentPopoverTarget = null;
    }
}

function isCurrentPopoverTargetActive(){
    if(_currentPopoverTarget!==null){
        return true;
    }
    return false;
}

function showTooltipPopoverForTarget(target){
    showPopoverForTarget(target);
}

function showDefaultPopoverForTarget(target){
    showPopoverForTarget(target);
}

function showPopoverForTarget(target){
    hideCurrentPopover();
    target.popover('show');
    _currentPopoverTarget = target;
}

function centerPopover(event) {
    //center popover
    var popup = $('.popover');
    popup.removeClass('top bottom left right').addClass("right");
    popup.each(function (i, e) {
        $(e).find(".arrow")[0].style.left = "-11px";
        e.style.left = event.pageX + "px";
        e.style.top = event.pageY + "px";
        e.style.transform = "translate(11px, -50%)";
    });
}    

function initPopovers() {
    //enable custom html in popovers                
    $("[data-toggle=popover]").popover({
           html: true, 
        content: function() {
            var id = $(this).attr('id')
            return $('#popover-' + id).html();
        }
    });
}

