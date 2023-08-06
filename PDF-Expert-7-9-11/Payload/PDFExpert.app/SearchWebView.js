// We're using a global variable to store the number of occurrences
var RDSearchResultCount = 0;
var a = new Array();
var RDCurrentSearchPosition = -1;
var currentFoundItemColor = "#FF615D";
var foundItemColor = "yellow";

// helper function, recursively searches in elements and their child nodes
function RDHighlightAllOccurencesOfStringForElement(element,keyword) {
  if (element) {
    if (element.nodeType == 3) {        // Text node
    var localArray = new Array();
      while (true) {
        var value = element.nodeValue;  // Search for keyword in text node
        var idx = value.toLowerCase().indexOf(keyword);

        if (idx < 0) break;             // not found, abort

        var span = document.createElement("span");
        var text = document.createTextNode(value.substr(idx,keyword.length));
        span.appendChild(text);
        span.setAttribute("class","RDHighlight");
        span.style.backgroundColor=foundItemColor;
        span.style.color="black";
	localArray.push(span);
        text = document.createTextNode(value.substr(idx+keyword.length));
        element.deleteData(idx, value.length - idx);
        var next = element.nextSibling;
        element.parentNode.insertBefore(span, next);
        element.parentNode.insertBefore(text, next);
        element = text;
        RDSearchResultCount++;	// update the counter
      }
    localArray.reverse();
    a = a.concat(localArray);
    } else if (element.nodeType == 1) { // Element node
      if (element.style.display != "none" && element.nodeName.toLowerCase() != 'select' && element.nodeName.toLowerCase() != 'style' && element.nodeName.toLowerCase() != 'script') {
        for (var i=element.childNodes.length-1; i>=0; i--) {
          RDHighlightAllOccurencesOfStringForElement(element.childNodes[i],keyword);
        }
      }
    }
  }
}

function RDGetDocument() {
    var doc = document.getElementById('SheetFrame');
    
    if (doc) {
        var contentDoc = doc.contentDocument;
        if (contentDoc && 'document' in contentDoc) {
            var innerDoc = contentDoc.document;
            if (innerDoc) {
                doc = innerDoc;
            }
        }
    }
    else {
        doc = document;
    }

    return doc;
}

function RDCanPerformSearch() {
    return RDGetDocument().body != null;
}

// the main entry point to start the search
function RDHighlightAllOccurencesOfString(keyword) {
    RDRemoveAllHighlights();
    var doc = RDGetDocument();

    RDHighlightAllOccurencesOfStringForElement(doc.body, keyword.toLowerCase());
}

// helper function, recursively removes the highlights in elements and their childs
function RDRemoveAllHighlightsForElement(element) {
  if (element) {
    if (element.nodeType == 1) {
      if (element.getAttribute("class") == "RDHighlight") {
        var text = element.removeChild(element.firstChild);
        element.parentNode.insertBefore(text,element);
        element.parentNode.removeChild(element);
        return true;
      } else {
        var normalize = false;
        for (var i=element.childNodes.length-1; i>=0; i--) {
          if (RDRemoveAllHighlightsForElement(element.childNodes[i])) {
            normalize = true;
          }
        }
        if (normalize) {
          element.normalize();
        }
      }
    }
  }
  return false;
}

// the main entry point to remove the highlights
function RDRemoveAllHighlights() {
    RDSearchResultCount = 0;
    a = [ ];
    RDCurrentSearchPosition = -1;
    RDRemoveAllHighlightsForElement(RDGetDocument().body);
}

function RDGoToToken (tokenNumber)
{
    if (RDCurrentSearchPosition > -1) a[RDCurrentSearchPosition].style.backgroundColor=foundItemColor;
    RDCurrentSearchPosition = tokenNumber;
    a[RDCurrentSearchPosition].style.backgroundColor=currentFoundItemColor;
    a[RDCurrentSearchPosition].scrollIntoViewIfNeeded();
}

function RDGetRectOfToken (tokenNumber)
{
    var el = a[tokenNumber];
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;
    
    while(el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
    }
    return '{{'+left+','+top+'},{'+width+','+height+'}}';
}

function RDSetXLSTabsVisibility (isVisible)
{
var i = 0;
while (true)
{
var tab = document.getElementById('Tab'+i);
if (tab)
tab.style.visibility = isVisible?'visible':'hidden';
else
break;
i++;
}
}
