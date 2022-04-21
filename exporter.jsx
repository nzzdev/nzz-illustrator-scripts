//@include "array.jsx"

var prefix = '@'
var artboard_labels = ['mw', 'cw', 'fw']
var docRef = app.activeDocument;
var allLayers = toArray(docRef.layers) // Mach aus dem komischen Iterable einen Array
var names = []
var map = {}
var artboards = []


// Welche namen gibt es?
allLayers.forEach(function(layer) {
    var _names = getNames(getParts(layer)) // Split bei den Leerstellen und gib mir alles mit dem richtigen Präfix
    _names.forEach(function(n) {
        n = removeAt(n) // Entfernt das Präfix

        if(!inArray(names, n)) {
            names.push(n)
        }
    })
})

// Welcher Layer enthält welchen Namen
names.forEach(function(n) {
    map[n] = allLayers.filter(function(l) {
        return l.name.indexOf(prefix+n) !== -1
    })
})

// Artboards die wir exportieren wollen
artboards = toArray(docRef.artboards).filter(function(a) {
    var _state = false
    artboard_labels.forEach(function(al) {
        if(a.name.indexOf(al) !== -1) {_state = true}
    })
    return _state
})

getArtboardIndex = function(artboard) {
    var _idx = null
    for(var i=0;i<docRef.artboards.length;i++) {
        if(artboard == docRef.artboards[i]) {
            _idx = i
        }
    }
    return _idx
}

artboards.forEach(function(ab) {
    var idx = getArtboardIndex(ab)
    docRef.artboards.setActiveArtboardIndex(idx)
    exportFileToPNG8('~/Desktop/'+ab.name+'.png')
})


// Get the parts of a layer name
function getParts(layer) {
    return layer.name.split(' ')
}

// Only return parts that contain an '@' (or another prefix)
function getNames(parts) {
    return parts.filter(function(p) {return p.indexOf(prefix) !== -1})
}

// Remove the @
function removeAt(part) {
    return part.replace(prefix, '')
}

function inArray(arr, el) {
    for(var i=0;i<arr.length; i++) {
        if(arr[i] == el) {return true}
    }
    return false
}

function toArr(iteratable) {
    var _arr = []
    for(var i=0; i<iteratable.length; i++) {
        _arr.push(iteratable[0])
    }
    return _arr
}


getPng8Options = function ( transparency, scaling ) {
	var options = new ExportOptionsPNG8();
	options.antiAliasing = true;
	options.transparency = transparency; 
	options.artBoardClipping = true;
	options.horizontalScale = scaling;
	options.verticalScale = scaling;
	return options;
}

// Format specific save functions
savePng8 = function ( doc, filePath, options ) {
	var destFile = new File( filePath + '.png' );
	doc.exportFile(destFile, ExportType.PNG8 , options);
}

indexOf = function ( array, element ) {
    for(var i=0; i<array.length; i++){
        if(array[i]==element)return i;
    }
    return -1;
}

hide_all_layers = function() {
    var n = docRef.layers.length;
    
    for(var i=0; i<n; ++i) {
        
        layer = docRef.layers[i];
        layer.visible = false
    }
}

//hide_all_layers()


run_export = function() {
    this.failed_artboards = [];
    this.failed_layers = [];
    var formatInfo = {
        name:"PNG 8", 
        copyBehaviour:false, 
        pixelDocSize:true, 
        getOptions:getPng8Options, 
        saveFile:savePng8,
        activeControls:["scalingInput","transCheckBox","trimEdgesCheckBox","innerPaddingCheckBox"]
    }

    var options = formatInfo.getOptions(
        true, //transparency 
        '300%' //scaling 
        );
        
        formatInfo.saveFile(docRef, "~/Desktop/test", options, 1, 'mw');
        
}


function exportFileToPNG8(dest) {
    if (app.documents.length > 0) {
      var exportOptions = new ExportOptionsPNG8();
      exportOptions.colorCount = 8;
      exportOptions.transparency = false;
      exportOptions.artBoardClipping = true
  
      var type = ExportType.PNG8;
      var fileSpec = new File(dest);
  
      app.activeDocument.exportFile(fileSpec, type, exportOptions);
    }
  }

 