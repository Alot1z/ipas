var DomUtils = {
    hideElement: function ($elem) {
        $elem.addClass("hidden");
    },
    showElement: function ($elem) {
        $elem.removeClass("hidden");
    },
    getClosestRow: function ($elem) {
        return $elem.closest(".row-file");
    },
    getClosestThumbnail: function ($elem) {
        return $elem.closest(".thumbnail");
    },
    getClosestPhotoCell: function ($elem) {
        return $elem.closest(".photo-cell");
    },
    getClosestFadeImage: function ($elem) {
        return $elem.closest(".fade-image");
    }
};

var StringUtils = {
    
    fitLenMiddle: function (str, max) {
        if (typeof str !== "string") {
            return null;
        }

        if (str.length > max) {
            var left = str.substring(0, Math.round(max / 2));
            var right = str.substring(str.length - Math.round(max / 2));
            return left + " ... " + right;
        }
        return str;
    },
    
    trimFinalSlash: function (path) {
        if (!path) {
            return "";
        }

        var lastCharPosition = path.length - 1;
        return path.charAt(lastCharPosition) === "/"
            ? path.substr(0, lastCharPosition)
            : path;
    },
    
    appendFinalSlash: function (path) {
        if (!path) {
            return "";
        }
        var lastCharPosition = path.length - 1;
        return path.charAt(lastCharPosition) === "/"
            ? path
            : path + "/";
    },
    
    lastPathComponenet: function (path) {
        if (!path) {
            return "";
        }
        var trimmedString = StringUtils.trimFinalSlash(path);
        var separatorIndex = trimmedString.lastIndexOf("/");
        if (separatorIndex !==-1 ) {
            return trimmedString.substr(separatorIndex+1);
        }
        return trimmedString;
    },
    
    cloneStringsArray : function (origArray) {
        var resultArray = origArray;
        if(origArray!==null && origArray.length>0){
            resultArray = JSON.parse(JSON.stringify(origArray));
        }
        return resultArray;
    },
    
    checkIfFileNameSupported: function (str) {
        if (typeof str !== "string") {
            return false;
        }
        if (str.length === 0 || str.toLowerCase()==='thumbs.db' || str.indexOf(".") === 0 ) {
            return false;
        }
        return true;
    }, 
    
    pathExtension: function (str) {
        if (typeof str !== "string") {
            return "";
        }
        var dotIndex = str.lastIndexOf(".");
        if (dotIndex !==-1 ) {
            return str.substr(dotIndex+1);
        }
        return "";
    },
    
    humanFileSize: function (size) {
        var i = (size === 0) ? 0 : Math.floor( Math.log(size) / Math.log(1024) ); 
        return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    },
    
    parseQuery: function (queryString) {
        var query = {};
        var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
        }
        return query;
    }
    
};


