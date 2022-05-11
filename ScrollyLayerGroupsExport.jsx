/*
Inspired by:
* https://gist.github.com/larrybotha/5baf6a9aea8da574cbbe
* http://www.ericson.net/content/2011/06/export-illustrator-layers-andor-artboards-as-pngs-and-pdfs/

* ExtendScript-Documentation: https://ai-scripting.docsforadobe.dev/objectmodel/objectModel.html

* How to install: https://stackoverflow.com/questions/27013800/where-to-put-the-script-to-appear-under-scripts-menu-in-illustrator-cs5-1
*/


/*
======================= Array functions =======================
*/

// Creates arrays from iterable, non-array objects
toArray = function(iteratable) {
    var _arr = []
    for(var i=0; i<iteratable.length; i++) {
        _arr.push(iteratable[i])
    }
    return _arr
}

// Array -> Array
Array.prototype.map = function (callback) {
    var that = Object(this)
    var _arr = []
    for(var i=0; i<that.length;i++) {
        _arr.push(callback(this[i]))
    }
    return _arr
}

// Array -> Array
Array.prototype.filter = function (callback) {
    var _arr = []
    for(var i=0; i<this.length;i++) {
        if(callback(this[i])) {
            _arr.push(this[i])
        }
    }
    return _arr 
}


// Array -> None
 Array.prototype.forEach = function forEach (callback, thisArg) {
    'use strict';
    var T, k;
  
    if (this == null) {
        throw new TypeError("this is null or not defined");
    }
  
    var kValue,
    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        O = Object(this),
  
    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
        len = O.length >>> 0; // Hack to convert O.length to a UInt32
  
    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if ({}.toString.call(callback) !== "[object Function]") {
        throw new TypeError(callback + " is not a function");
    }
  
    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (arguments.length >= 2) {
        T = thisArg;
    }
  
    // 6. Let k be 0
    k = 0;
  
    // 7. Repeat, while k < len
    while (k < len) {
  
        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        if (k in O) {
  
            // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
            kValue = O[k];
  
            // ii. Call the Call internal method of callback with T as the this value and
            // argument list containing kValue, k, and O.
            callback.call(T, kValue, k, O);
        }
        // d. Increase k by 1.
        k++;
    }
    // 8. return undefined
  };


// Prüft ob ein Element in einem Array vorkommt
// Array -> Any -> Bool
Array.prototype.inArray = function(el) {
    for(var i=0; i<this.length; i++) {
        if(this[i] == el) {return true}
    }
    return false
}


/*
==================== Main config ================
*/

/*
Possible options-dialog:
- Prefix
*/

var prefix = '@'
var artboard_labels = ['mw', 'cw', 'fw'] // Only export artboards that contain one of these strings
var docRef = app.activeDocument;
var allLayers = getAllLayers(docRef) // Only touch (show and hide) layers that contain the prefix
var names = [] // A list 'states' of the scrollytelling. Eg. @1 @2 @3 -> ['1', '2', '3']
var map = {} // Find all layers for a given state. E. g. { '1': [bg @1 @2, @1], '2': [bg @1 @2, @2] }
var artboards = [] // Artboards containing the artboard_labels

function getAllLayers(docRef) {
    layers = []
    toArray(docRef.layers).forEach(function(l1) {
        if(l1.layers.length > 0) {
            toArray(l1.layers).forEach(function(l2) {
                if(inLayerName(prefix, l2)) {layers.push(l2)}
            })
        }
        if(inLayerName(prefix, l1)) {layers.push(l1)}
    })
    return layers
}


function inLayerName(string, layer) {
    return layer.name.indexOf(string) !== -1
}

// Welche Namen gibt es?
allLayers.forEach(function(layer) {
    var _names = getNames(getParts(layer)) // Split bei den Leerstellen und gib mir alles mit dem richtigen Präfix
    _names.forEach(function(n) {
        n = removeAt(n) // Entfernt das Präfix

        if(!names.inArray(n)) {
            names.push(n)
        }
    })
})

// Welcher Layer enthält welchen Namen
names.forEach(function(n) {
    map[n] = allLayers.filter(function(l) {
        return inLayerName(prefix+n, l); 
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

/*
================ Main loop ===================
*/

function main(config) {

    names.forEach(function(name) {
        hideAllLayers()
    
        map[name].forEach(function(lay) {
            lay.visible = true
        })
    
        artboards.forEach(function(ab) {
            var idx = getArtboardIndex(ab)
            docRef.artboards.setActiveArtboardIndex(idx)
            exportFileToPNG8(
                buildPath(config.outputDir, name, ab.name), // Construct the path of the output dir
                config.scaling // Read the user selected scaling factor in percent
            )
        })
    })
    this.dlg.close();
}



function buildPath(folder, name, artboard) {
    return folder+"/"+name+'-'+artboard+'.png'
}

// Ordner des aktiven Dokuments
function getFolder() {
    return docRef.path.toString() + '/png'
}

// Alle Top-Layer ausblenden
function hideAllLayers() {
    allLayers.forEach(function(lay) {
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


// Export-Funktion
function exportFileToPNG8(dest, scaling) {
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

function scaling(scaleString) {
    if(scaleString == '1x') {return 100}
    else if(scaleString == '2x') {return 200}
    else if(scaleString == '3x') {return 300}
    else {return 300}
}



function showDialog () {

    this.dlg = new Window('dialog', 'Export Artboards'); 
    var msgPnl = this.dlg.add('panel', undefined, 'Auflösung'); 

    // Auflösung
    var typeGrp = msgPnl.add('group', undefined, '')
    typeGrp.oreintation = 'row';
    typeGrp.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]

    var exportTypeList = typeGrp.add('dropdownlist', undefined, [ '1x', '2x', '3x' ]);
    exportTypeList.selection = exportTypeList.items[2]



    // DIR GROUP
    var dirGrp = msgPnl.add( 'group', undefined, '') 
    dirGrp.orientation = 'row'
    dirGrp.alignment = [ScriptUI.Alignment.LEFT, ScriptUI.Alignment.TOP]
    
    var dirSt = dirGrp.add('statictext', undefined, 'Zielordner:'); 
    dirSt.size = [ 100,20 ];

    var dirEt = dirGrp.add('edittext', undefined, getFolder()); 
    dirEt.size = [ 300,20 ];

    var chooseBtn = dirGrp.add('button', undefined, 'Auswählen ...' );
    chooseBtn.onClick = function() { dirEt.text = Folder.selectDialog(); }


    var btnPnl = this.dlg.add('group', undefined, ''); 
    btnPnl.orientation = 'row'

    btnPnl.cancelBtn = btnPnl.add('button', undefined, 'Cancel', {name:'cancel'});
    btnPnl.cancelBtn.onClick = function() { this.dlg.close() };

    // OK button
    btnPnl.okBtn = btnPnl.add('button', undefined, 'Export', {name:'ok'});
    btnPnl.okBtn.onClick = function() {
        alert(dirEt.text)
        main({
            scaling: scaling(exportTypeList.selection.text),
            outputDir: dirEt.text
        });
    };

    this.dlg.show();
}



showDialog()