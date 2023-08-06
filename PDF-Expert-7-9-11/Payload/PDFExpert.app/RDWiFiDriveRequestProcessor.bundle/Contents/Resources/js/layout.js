
function isGridLayout() {
    return getLayout()==='grid' || isPhotoLibraryAllAlbumsContent();
}

function isPhotoGalleryLayout() {
    return (_content_options!==null && _content_options.layout==='photo');
}

function getLayout() {
    var localStorage = window.localStorage;
    var data = localStorage.getItem('layout');
    if(data===null){
        data='grid';
        localStorage.setItem('layout', data);
    }
    return data;
}

function setLayout(layout) {
    var localStorage = window.localStorage;
    if(layout!==null && layout.length>0){
        localStorage.setItem('layout', layout);
    }
    else{
        localStorage.removeItem('layout');
    }
}

