//@include "array.jsx"

/*
Inspired by:
* https://gist.github.com/larrybotha/5baf6a9aea8da574cbbe
* http://www.ericson.net/content/2011/06/export-illustrator-layers-andor-artboards-as-pngs-and-pdfs/

* ExtendScript-Documentation: https://ai-scripting.docsforadobe.dev/objectmodel/objectModel.html
*/

var prefix = '@'
var artboard_labels = ['mw', 'cw', 'fw']
var scaling = 300
var docRef = app.activeDocument;
var allLayers = toArray(docRef.layers) // Mach aus dem komischen Iterable einen Array
var names = []
var map = {}
var artboards = []


// Welche Namen gibt es?
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

// Index eines Artboards finden – um es dann zu aktivieren
getArtboardIndex = function(artboard) {
    var _idx = null
    for(var i=0;i<docRef.artboards.length;i++) {
        if(artboard == docRef.artboards[i]) {
            _idx = i
        }
    }
    return _idx
}

// main loop
names.forEach(function(name) {
    hideAllLayers()

    map[name].forEach(function(lay) {
        lay.visible = true
    })

    artboards.forEach(function(ab) {
        var idx = getArtboardIndex(ab)
        docRef.artboards.setActiveArtboardIndex(idx)
        exportFileToPNG8(getFolder()+'/png/' +name+'-'+ab.name+'.png')
    })
})


// Ordner des aktiven Dokuments
function getFolder() {
    return docRef.path.toString()
}

// Alle Top-Layer ausblenden
function hideAllLayers() {
    toArray(docRef.layers).forEach(function(lay) {
        lay.visible = false
    })
}

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

// Prüft ob ein Element in einem Array vorkommt
function inArray(arr, el) {
    for(var i=0;i<arr.length; i++) {
        if(arr[i] == el) {return true}
    }
    return false
}

// Wandelt seltsame, iterierbare Objekte in ein Array um
function toArr(iteratable) {
    var _arr = []
    for(var i=0; i<iteratable.length; i++) {
        _arr.push(iteratable[0])
    }
    return _arr
}


// Export-Funktion
function exportFileToPNG8(dest) {
    if (app.documents.length > 0) {
      var exportOptions = new ExportOptionsPNG24();
      exportOptions.transparency = false;
      exportOptions.artBoardClipping = true
      exportOptions.verticalScale = scaling
      exportOptions.horizontalScale = scaling

      var type = ExportType.PNG24;
      var fileSpec = new File(dest);
  
      app.activeDocument.exportFile(fileSpec, type, exportOptions);
    }
  }

 