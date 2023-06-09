'use strict';
(function (factory, window) {
    /*globals define, module, require*/

    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);


    // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }

    // attach your plugin to the global 'L' variable
    if(typeof window !== 'undefined' && window.L){
        factory(window.L);
    }

}(function (L) {
    // 🍂miniclass CancelableEvent (Event objects)
    // 🍂method cancel()
    // Cancel any subsequent action.

    // 🍂miniclass VertexEvent (Event objects)
    // 🍂property vertex: VertexMarker
    // The vertex that fires the event.

    // 🍂miniclass ShapeEvent (Event objects)
    // 🍂property shape: Array
    // The shape (LatLngs array) subject of the action.

    // 🍂miniclass CancelableVertexEvent (Event objects)
    // 🍂inherits VertexEvent
    // 🍂inherits CancelableEvent

    // 🍂miniclass CancelableShapeEvent (Event objects)
    // 🍂inherits ShapeEvent
    // 🍂inherits CancelableEvent

    // 🍂miniclass LayerEvent (Event objects)
    // 🍂property layer: object
    // The Layer (Marker, Polyline…) subject of the action.

    // 🍂namespace Editable; 🍂class Editable; 🍂aka L.Editable
    // Main edition handler. By default, it is attached to the map
    // as `map.editTools` property.
    // Leaflet.Editable is made to be fully extendable. You have three ways to customize
    // the behaviour: using options, listening to events, or extending.
    L.Editable = L.Evented.extend({
        statics: {
            FORWARD: 1,
            BACKWARD: -1
        },

        options: {
            zIndex: 1000,
            // 🍂option polygonClass: class = L.Polygon
            polygonClass: L.Polygon,
            // 🍂option drawingCSSClass: string = 'leaflet-editable-drawing'
            // CSS class to be added to the map container while drawing.
            drawingCSSClass: 'leaflet-editable-drawing',

            // 🍂option drawingCursor: const = 'crosshair'
            // Cursor mode set to the map while drawing.
            drawingCursor: 'crosshair',

            // 🍂option editLayer: Layer = new L.LayerGroup()
            // Layer used to store edit tools (vertex, line guide…).
            editLayer: undefined,

            // 🍂option featuresLayer: Layer = new L.LayerGroup()
            // Default layer used to store drawn features (Marker, Polyline…).
            featuresLayer: undefined,

            // 🍂option polygonEditorClass: class = PolygonEditor
            // Class to be used as Polygon editor.
            polygonEditorClass: undefined,

            // 🍂option lineGuideOptions: hash = {}
            // Options to be passed to the line guides.
            lineGuideOptions: {}
        },

        initialize: function (map, options) {
            L.setOptions(this, options);
            this._lastZIndex = this.options.zIndex;
            this.map = map;
            this.editLayer = this.createEditLayer();
            this.featuresLayer = this.createFeaturesLayer();
            this.forwardLineGuide = this.createLineGuide();
            this.backwardLineGuide = this.createLineGuide();
        },

        fireAndForward: function (type, e) {
            e = e || {};
            e.editTools = this;
            this.fire(type, e);
            this.map.fire(type, e);
        },

        createLineGuide: function (options) {
            options = L.extend({dashArray: '5,10', weight: 1, interactive: false}, this.options.lineGuideOptions, options);
            return L.polyline([], options);
        },

        createVertexIcon: function (options) {
            return L.Browser.mobile && L.Browser.touch ? new L.Editable.TouchVertexIcon(options) : new L.Editable.VertexIcon(options);
        },

        createEditLayer: function () {
            return this.options.editLayer || new L.LayerGroup().addTo(this.map);
        },

        createFeaturesLayer: function () {
            return this.options.featuresLayer || new L.LayerGroup().addTo(this.map);
        },

        moveForwardLineGuide: function (latlng) {
            if (this.forwardLineGuide._latlngs.length) {
                this.forwardLineGuide._latlngs[1] = latlng;
                this.forwardLineGuide._bounds.extend(latlng);
                this.forwardLineGuide.redraw();
            }
        },

        moveBackwardLineGuide: function (latlng) {
            if (this.backwardLineGuide._latlngs.length) {
                this.backwardLineGuide._latlngs[1] = latlng;
                this.backwardLineGuide._bounds.extend(latlng);
                this.backwardLineGuide.redraw();
            }
        },

        anchorForwardLineGuide: function (latlng) {
            this.forwardLineGuide._latlngs[0] = latlng;
            this.forwardLineGuide._bounds.extend(latlng);
            this.forwardLineGuide.redraw();
        },

        anchorBackwardLineGuide: function (latlng) {
            this.backwardLineGuide._latlngs[0] = latlng;
            this.backwardLineGuide._bounds.extend(latlng);
            this.backwardLineGuide.redraw();
        },

        attachForwardLineGuide: function () {
            this.editLayer.addLayer(this.forwardLineGuide);
        },

        attachBackwardLineGuide: function () {
            this.editLayer.addLayer(this.backwardLineGuide);
        },

        detachForwardLineGuide: function () {
            this.forwardLineGuide.setLatLngs([]);
            this.editLayer.removeLayer(this.forwardLineGuide);
        },

        detachBackwardLineGuide: function () {
            this.backwardLineGuide.setLatLngs([]);
            this.editLayer.removeLayer(this.backwardLineGuide);
        },

        blockEvents: function () {
            // Hack: force map not to listen to other layers events while drawing.
            if (!this._oldTargets) {
                this._oldTargets = this.map._targets;
                this.map._targets = {};
            }
        },

        unblockEvents: function () {
            if (this._oldTargets) {
                // Reset, but keep targets created while drawing.
                this.map._targets = L.extend(this.map._targets, this._oldTargets);
                delete this._oldTargets;
            }
        },

        registerForDrawing: function (editor) {
            if (this._drawingEditor) this.unregisterForDrawing(this._drawingEditor);
            this.blockEvents();
            editor.reset();  // Make sure editor tools still receive events.
            this._drawingEditor = editor;
            this.map.on('mousemove touchmove', editor.onDrawingMouseMove, editor);
            this.map.on('mousedown', this.onMousedown, this);
            this.map.on('mouseup', this.onMouseup, this);
            L.DomUtil.addClass(this.map._container, this.options.drawingCSSClass);
            this.defaultMapCursor = this.map._container.style.cursor;
            this.map._container.style.cursor = this.options.drawingCursor;
        },

        unregisterForDrawing: function (editor) {
            this.unblockEvents();
            L.DomUtil.removeClass(this.map._container, this.options.drawingCSSClass);
            this.map._container.style.cursor = this.defaultMapCursor;
            editor = editor || this._drawingEditor;
            if (!editor) return;
            this.map.off('mousemove touchmove', editor.onDrawingMouseMove, editor);
            this.map.off('mousedown', this.onMousedown, this);
            this.map.off('mouseup', this.onMouseup, this);
            if (editor !== this._drawingEditor) return;
            delete this._drawingEditor;
            if (editor._drawing) editor.cancelDrawing();
        },

        onMousedown: function (e) {
            if (e.originalEvent.which != 1) return;
            this._mouseDown = e;
            this._drawingEditor.onDrawingMouseDown(e);
        },

        onMouseup: function (e) {
            if (this._mouseDown) {
                var editor = this._drawingEditor,
                mouseDown = this._mouseDown;
                this._mouseDown = null;
                editor.onDrawingMouseUp(e);
                if (this._drawingEditor !== editor) return;  // onDrawingMouseUp may call unregisterFromDrawing.
                var origin = L.point(mouseDown.originalEvent.clientX, mouseDown.originalEvent.clientY);
                var distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY).distanceTo(origin);
                if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) this._drawingEditor.onDrawingClick(e);
            }
        },

        // 🍂section Public methods
        // You will generally access them by the `map.editTools`
        // instance:
        //
        // `map.editTools.startPolyline();`

        // 🍂method drawing(): boolean
        // Return true if any drawing action is ongoing.
        drawing: function () {
            return this._drawingEditor && this._drawingEditor.drawing();
        },

        // 🍂method stopDrawing()
        // When you need to stop any ongoing drawing, without needing to know which editor is active.
        stopDrawing: function () {
            this.unregisterForDrawing();
        },

        // 🍂method commitDrawing()
        // When you need to commit any ongoing drawing, without needing to know which editor is active.
        commitDrawing: function (e) {
            if (!this._drawingEditor) return;
            this._drawingEditor.commitDrawing(e);
        },

        changeLineGuideStyle: function (options) {
            this.forwardLineGuide = this.createLineGuide(options);
            this.backwardLineGuide = this.createLineGuide(options);
        },

        connectCreatedToMap: function (layer) {
            return this.featuresLayer.addLayer(layer);
        },

        // 🍂method startPolygon(latlng: L.LatLng, options: hash): L.Polygon
        // Start drawing a Polygon. If `latlng` is given, a first point will be added. In any case, continuing on user click.
        // If `options` is given, it will be passed to the Polygon class constructor.
        startPolygon: function (latlng, options) {
            var polygon = this.createPolygon([], options);
            polygon.enableEdit(this.map).newShape(latlng);
            return polygon;
        },

        createLayer: function (klass, latlngs, options) {
            options = L.Util.extend({editOptions: {editTools: this}}, options);
            var layer = new klass(latlngs, options);
            console.log(layer)
            layer.setStyle({ className: `leaflet-editable-feature`, });

            // L.DomUtil.addClass(layer, 'leaflet-editable-feature');

            // 🍂namespace Editable
            // 🍂event editable:created: LayerEvent
            // Fired when a new feature (Marker, Polyline…) is created.
            this.fireAndForward('editable:created', {layer: layer});
            return layer;
        },

        createPolygon: function (latlngs, options) {
            return this.createLayer(options && options.polygonClass || this.options.polygonClass, latlngs, options);
        }
    });

L.extend(L.Editable, {
    makeCancellable: function (e) {
        e.cancel = function () {
            e._cancelled = true;
        };
    }
});

    // 🍂namespace Map; 🍂class Map
    // Leaflet.Editable add options and events to the `L.Map` object.
    // See `Editable` events for the list of events fired on the Map.
    // 🍂example
    //
    // ```js
    // var map = L.map('map', {
    //  editable: true,
    //  editOptions: {
    //    …
    // }
    // });
    // ```
    // 🍂section Editable Map Options
L.Map.mergeOptions({
        // Class to be used as vertex, for path editing.
    editToolsClass: L.Editable,
        // Whether to create a L.Editable instance at map init.
    editable: false,
        // Options to pass to L.Editable when instantiating.
    editOptions: {}

});

L.Map.addInitHook(function () {
    this.whenReady(function () {
        if (this.options.editable) {
            this.editTools = new this.options.editToolsClass(this, this.options.editOptions);
        }
    });
});

L.Editable.VertexIcon = L.DivIcon.extend({
    options: {
        iconSize: new L.Point(8, 8)
    }
});

L.Editable.TouchVertexIcon = L.Editable.VertexIcon.extend({
    options: {
        iconSize: new L.Point(20, 20)
    }
});


    // 🍂namespace Editable; 🍂class VertexMarker; Handler for dragging path vertices.
L.Editable.VertexMarker = L.Marker.extend({
    options: {
        draggable: true,
        className: 'leaflet-div-icon leaflet-vertex-icon'
    },

        // 🍂section Public methods
        // The marker used to handle path vertex. You will usually interact with a `VertexMarker`
        // instance when listening for events like `editable:vertex:ctrlclick`.

    initialize: function (latlng, latlngs, editor, options) {
            // We don't use this._latlng, because on drag Leaflet replace it while
            // we want to keep reference.
        this.latlng = latlng;
        this.latlngs = latlngs;


        let degreesToRotate = 0;
        for (const idx in this.latlngs) {
            const c = this.latlngs[idx];
            if (c.lat === this.latlng.lat && c.lng === this.latlng.lng) {
                degreesToRotate = 45 + (idx * 90)
                break;
            }
        }

        this.editor = editor;
        L.Marker.prototype.initialize.call(this, latlng, options);

        this.options.icon = this.editor.tools.createVertexIcon({
            className: this.options.className,
            iconSize: [10,10],
            iconAnchor: [5, 5],
            html: `
            <svg class='fill-current' transform='rotate(${degreesToRotate})' style='color: black;' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="8" height="8">
            <path class="heroicon-ui" d="M5.41 11H21a1 1 0 0 1 0 2H5.41l5.3 5.3a1 1 0 0 1-1.42 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.42 1.4L5.4 11z">
            </path>
            </svg>
            `
        });
        this.latlng.__vertex = this;
        this.editor.editLayer.addLayer(this);
        this.setZIndexOffset(editor.tools._lastZIndex + 1);
    },

    onAdd: function (map) {
        L.Marker.prototype.onAdd.call(this, map);
        this.on('drag', this.onDrag);
        this.on('dragstart', this.onDragStart);
        this.on('dragend', this.onDragEnd);
        this.on('mouseup', this.onMouseup);
        this.on('click', this.onClick);
        this.on('contextmenu', this.onContextMenu);
        this.on('mousedown touchstart', this.onMouseDown);
        this.on('mouseover', this.onMouseOver);
        this.on('mouseout', this.onMouseOut);
    },

    onRemove: function (map) {
        delete this.latlng.__vertex;
        this.off('drag', this.onDrag);
        this.off('dragstart', this.onDragStart);
        this.off('dragend', this.onDragEnd);
        this.off('mouseup', this.onMouseup);
        this.off('click', this.onClick);
        this.off('contextmenu', this.onContextMenu);
        this.off('mousedown touchstart', this.onMouseDown);
        this.off('mouseover', this.onMouseOver);
        this.off('mouseout', this.onMouseOut);
        L.Marker.prototype.onRemove.call(this, map);
    },

    onDrag: function (e) {
        e.vertex = this;
        this.editor.onVertexMarkerDrag(e);
        var iconPos = L.DomUtil.getPosition(this._icon),
        latlng = this._map.layerPointToLatLng(iconPos);
        this.latlng.update(latlng);
            this._latlng = this.latlng;  // Push back to Leaflet our reference.
            this.editor.refresh();
        },

        onDragStart: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerDragStart(e);
        },

        onDragEnd: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerDragEnd(e);
        },

        onClick: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerClick(e);
        },

        onMouseup: function (e) {
            L.DomEvent.stop(e);
            e.vertex = this;
            this.editor.map.fire('mouseup', e);
        },

        onContextMenu: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerContextMenu(e);
        },

        onMouseDown: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerMouseDown(e);
        },

        onMouseOver: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerMouseOver(e);
        },

        onMouseOut: function (e) {
            e.vertex = this;
            this.editor.onVertexMarkerMouseOut(e);
        },

        // 🍂method delete()
        // Delete a vertex and the related LatLng.
        delete: function () {
            var next = this.getNext();  // Compute before changing latlng
            this.latlngs.splice(this.getIndex(), 1);
            this.editor.editLayer.removeLayer(this);
            this.editor.onVertexDeleted({latlng: this.latlng, vertex: this});
            if (!this.latlngs.length) this.editor.deleteShape(this.latlngs);
            this.editor.refresh();
        },

        // 🍂method getIndex(): int
        // Get the index of the current vertex among others of the same LatLngs group.
        getIndex: function () {
            return this.latlngs.indexOf(this.latlng);
        },

        // 🍂method getLastIndex(): int
        // Get last vertex index of the LatLngs group of the current vertex.
        getLastIndex: function () {
            return this.latlngs.length - 1;
        },

        // 🍂method getPrevious(): VertexMarker
        // Get the previous VertexMarker in the same LatLngs group.
        getPrevious: function () {
            if (this.latlngs.length < 2) return;
            var index = this.getIndex(),
            previousIndex = index - 1;
            if (index === 0 && this.editor.CLOSED) previousIndex = this.getLastIndex();
            var previous = this.latlngs[previousIndex];
            if (previous) return previous.__vertex;
        },

        // 🍂method getNext(): VertexMarker
        // Get the next VertexMarker in the same LatLngs group.
        getNext: function () {
            if (this.latlngs.length < 2) return;
            var index = this.getIndex(),
            nextIndex = index + 1;
            if (index === this.getLastIndex() && this.editor.CLOSED) nextIndex = 0;
            var next = this.latlngs[nextIndex];
            if (next) return next.__vertex;
        },

        // 🍂method split()
        // Split the vertex LatLngs group at its index, if possible.
        split: function () {
            if (!this.editor.splitShape) return;  // Only for PolylineEditor
            this.editor.splitShape(this.latlngs, this.getIndex());
        },

        // 🍂method continue()
        // Continue the vertex LatLngs from this vertex. Only active for first and last vertices of a Polyline.
        continue: function () {
            if (!this.editor.continueBackward) return;  // Only for PolylineEditor
            var index = this.getIndex();
            if (index === 0) this.editor.continueBackward(this.latlngs);
            else if (index === this.getLastIndex()) this.editor.continueForward(this.latlngs);
        }
    });

L.Editable.mergeOptions({
        // 🍂namespace Editable
        // 🍂option vertexMarkerClass: class = VertexMarker
        // Class to be used as vertex, for path editing.
    vertexMarkerClass: L.Editable.VertexMarker
});

    // 🍂namespace Editable; 🍂class BaseEditor; 🍂aka L.Editable.BaseEditor
    // When editing a feature (Marker, Polyline…), an editor is attached to it. This
    // editor basically knows how to handle the edition.
L.Editable.BaseEditor = L.Handler.extend({
    initialize: function (map, feature, options) {
        L.setOptions(this, options);
        this.map = map;
        this.feature = feature;
        this.feature.editor = this;
        this.editLayer = new L.LayerGroup();
        this.tools = this.options.editTools || map.editTools;
    },

        // 🍂method enable(): this
        // Set up the drawing tools for the feature to be editable.
    addHooks: function () {
        if (this.isConnected()) this.onFeatureAdd();
        else this.feature.once('add', this.onFeatureAdd, this);
        this.onEnable();
        this.feature.on(this._getEvents(), this);
    },

        // 🍂method disable(): this
        // Remove the drawing tools for the feature.
    removeHooks: function () {
        this.feature.off(this._getEvents(), this);
        if (this.feature.dragging) this.feature.dragging.disable();
        this.editLayer.clearLayers();
        this.tools.editLayer.removeLayer(this.editLayer);
        this.onDisable();
        if (this._drawing) this.cancelDrawing();
    },

        // 🍂method drawing(): boolean
        // Return true if any drawing action is ongoing with this editor.
    drawing: function () {
        return !!this._drawing;
    },

    reset: function () {},

    onFeatureAdd: function () {
        this.tools.editLayer.addLayer(this.editLayer);
        if (this.feature.dragging) this.feature.dragging.enable();
    },

    fireAndForward: function (type, e) {
        e = e || {};
        e.layer = this.feature;
        this.feature.fire(type, e);
        this.tools.fireAndForward(type, e);
    },

    onEnable: function () {
            // 🍂namespace Editable
            // 🍂event editable:enable: Event
            // Fired when an existing feature is ready to be edited.
        this.fireAndForward('editable:enable');
    },

    onDisable: function () {
            // 🍂namespace Editable
            // 🍂event editable:disable: Event
            // Fired when an existing feature is not ready anymore to be edited.
        this.fireAndForward('editable:disable');
    },

    onEditing: function () {
            // 🍂namespace Editable
            // 🍂event editable:editing: Event
            // Fired as soon as any change is made to the feature geometry.
        this.fireAndForward('editable:editing');
    },

    onStartDrawing: function () {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:start: Event
            // Fired when a feature is to be drawn.
        this.fireAndForward('editable:drawing:start');
    },

    onEndDrawing: function () {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:end: Event
            // Fired when a feature is not drawn anymore.
        this.fireAndForward('editable:drawing:end');
    },

    onCancelDrawing: function () {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:cancel: Event
            // Fired when user cancel drawing while a feature is being drawn.
        this.fireAndForward('editable:drawing:cancel');
    },

    onCommitDrawing: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:commit: Event
            // Fired when user finish drawing a feature.
        this.fireAndForward('editable:drawing:commit', e);
    },

    onDrawingMouseDown: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:mousedown: Event
            // Fired when user `mousedown` while drawing.
        this.fireAndForward('editable:drawing:mousedown', e);
    },

    onDrawingMouseUp: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:mouseup: Event
            // Fired when user `mouseup` while drawing.
        this.fireAndForward('editable:drawing:mouseup', e);
    },

    startDrawing: function () {
        if (!this._drawing) this._drawing = L.Editable.FORWARD;
        this.tools.registerForDrawing(this);
        this.onStartDrawing();
    },

    commitDrawing: function (e) {
        this.onCommitDrawing(e);
        this.endDrawing();
    },

    cancelDrawing: function () {
            // If called during a vertex drag, the vertex will be removed before
            // the mouseup fires on it. This is a workaround. Maybe better fix is
            // To have L.Draggable reset it's status on disable (Leaflet side).
        L.Draggable._dragging = false;
        this.onCancelDrawing();
        this.endDrawing();
    },

    endDrawing: function () {
        this._drawing = false;
        this.tools.unregisterForDrawing(this);
        this.onEndDrawing();
    },

    onDrawingClick: function (e) {
        if (!this.drawing()) return;
        L.Editable.makeCancellable(e);
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:click: CancelableEvent
            // Fired when user `click` while drawing, before any internal action is being processed.
        this.fireAndForward('editable:drawing:click', e);
        if (e._cancelled) return;
        if (!this.isConnected()) this.connect(e);
        this.processDrawingClick(e);
    },

    isConnected: function () {
        return this.map.hasLayer(this.feature);
    },

    connect: function () {
        this.tools.connectCreatedToMap(this.feature);
        this.tools.editLayer.addLayer(this.editLayer);
    },

    onMove: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:move: Event
            // Fired when `move` mouse while drawing, while dragging a marker, and while dragging a vertex.
        this.fireAndForward('editable:drawing:move', e);
    },

    onDrawingMouseMove: function (e) {
        this.onMove(e);
    },

    _getEvents: function () {
        return {
            dragstart: this.onDragStart,
            drag: this.onDrag,
            dragend: this.onDragEnd,
            remove: this.disable
        };
    },

    onDragStart: function (e) {
        this.onEditing();
            // 🍂namespace Editable
            // 🍂event editable:dragstart: Event
            // Fired before a path feature is dragged.
        this.fireAndForward('editable:dragstart', e);
    },

    onDrag: function (e) {
        this.onMove(e);
            // 🍂namespace Editable
            // 🍂event editable:drag: Event
            // Fired when a path feature is being dragged.
        this.fireAndForward('editable:drag', e);
    },

    onDragEnd: function (e) {
            // 🍂namespace Editable
            // 🍂event editable:dragend: Event
            // Fired after a path feature has been dragged.
        this.fireAndForward('editable:dragend', e);
    }

});

    // 🍂namespace Editable; 🍂class MarkerEditor; 🍂aka L.Editable.MarkerEditor
    // 🍂inherits BaseEditor
    // Editor for Marker.
L.Editable.MarkerEditor = L.Editable.BaseEditor.extend({

    onDrawingMouseMove: function (e) {
        L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
        if (this._drawing) this.feature.setLatLng(e.latlng);
    },

    processDrawingClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Drawing events
            // 🍂event editable:drawing:clicked: Event
            // Fired when user `click` while drawing, after all internal actions.
        this.fireAndForward('editable:drawing:clicked', e);
        this.commitDrawing(e);
    },

    connect: function (e) {
            // On touch, the latlng has not been updated because there is
            // no mousemove.
        if (e) this.feature._latlng = e.latlng;
        L.Editable.BaseEditor.prototype.connect.call(this, e);
    }

});

    // 🍂namespace Editable; 🍂class PathEditor; 🍂aka L.Editable.PathEditor
    // 🍂inherits BaseEditor
    // Base class for all path editors.
L.Editable.PathEditor = L.Editable.BaseEditor.extend({
    CLOSED: false,
    MIN_VERTEX: 2,

    addHooks: function () {
        L.Editable.BaseEditor.prototype.addHooks.call(this);
        if (this.feature) this.initVertexMarkers();
        return this;
    },

    initVertexMarkers: function (latlngs) {
        if (!this.enabled()) return;
        latlngs = latlngs || this.getLatLngs();
        if (isFlat(latlngs)) this.addVertexMarkers(latlngs);
        else for (var i = 0; i < latlngs.length; i++) this.initVertexMarkers(latlngs[i]);
    },

    getLatLngs: function () {
        return this.feature.getLatLngs();
    },

        // 🍂method reset()
        // Rebuild edit elements (Vertex, etc.).
    reset: function () {
        this.editLayer.clearLayers();
        this.initVertexMarkers();
    },

    addVertexMarker: function (latlng, latlngs) {
        return new this.tools.options.vertexMarkerClass(latlng, latlngs, this);
    },

    onNewVertex: function (vertex) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:new: VertexEvent
            // Fired when a new vertex is created.
        this.fireAndForward('editable:vertex:new', {latlng: vertex.latlng, vertex: vertex});
    },

    addVertexMarkers: function (latlngs) {
        for (var i = 0; i < latlngs.length; i++) {
            this.addVertexMarker(latlngs[i], latlngs);
        }
    },

    refreshVertexMarkers: function (latlngs) {
        latlngs = latlngs || this.getDefaultLatLngs();
        for (var i = 0; i < latlngs.length; i++) {
            latlngs[i].__vertex.update();
        }
    },

    onVertexMarkerClick: function (e) {
        L.Editable.makeCancellable(e);
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:click: CancelableVertexEvent
            // Fired when a `click` is issued on a vertex, before any internal action is being processed.
        this.fireAndForward('editable:vertex:click', e);
        if (e._cancelled) return;
        if (this.tools.drawing() && this.tools._drawingEditor !== this) return;
        var index = e.vertex.getIndex(), commit;
        if (e.originalEvent.ctrlKey) {
            this.onVertexMarkerCtrlClick(e);
        } else if (e.originalEvent.altKey) {
            this.onVertexMarkerAltClick(e);
        } else if (e.originalEvent.shiftKey) {
            this.onVertexMarkerShiftClick(e);
        } else if (e.originalEvent.metaKey) {
            this.onVertexMarkerMetaKeyClick(e);
        } else if (index === e.vertex.getLastIndex() && this._drawing === L.Editable.FORWARD) {
            if (index >= this.MIN_VERTEX - 1) commit = true;
        } else if (index === 0 && this._drawing === L.Editable.BACKWARD && this._drawnLatLngs.length >= this.MIN_VERTEX) {
            commit = true;
        } else if (index === 0 && this._drawing === L.Editable.FORWARD && this._drawnLatLngs.length >= this.MIN_VERTEX && this.CLOSED) {
                commit = true;  // Allow to close on first point also for polygons
            } else {
                this.onVertexRawMarkerClick(e);
            }
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:clicked: VertexEvent
            // Fired when a `click` is issued on a vertex, after all internal actions.
            this.fireAndForward('editable:vertex:clicked', e);
            if (commit) this.commitDrawing(e);
        },

        onVertexRawMarkerClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:rawclick: CancelableVertexEvent
            // Fired when a `click` is issued on a vertex without any special key and without being in drawing mode.
            this.fireAndForward('editable:vertex:rawclick', e);
            if (e._cancelled) return;

            return;
            // if (!this.vertexCanBeDeleted(e.vertex)) return;
            // e.vertex.delete();
        },

        vertexCanBeDeleted: function (vertex) {
            return vertex.latlngs.length > this.MIN_VERTEX;
        },

        onVertexDeleted: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:deleted: VertexEvent
            // Fired after a vertex has been deleted by user.
            this.fireAndForward('editable:vertex:deleted', e);
        },

        onVertexMarkerCtrlClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:ctrlclick: VertexEvent
            // Fired when a `click` with `ctrlKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:ctrlclick', e);
        },

        onVertexMarkerShiftClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:shiftclick: VertexEvent
            // Fired when a `click` with `shiftKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:shiftclick', e);
        },

        onVertexMarkerMetaKeyClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:metakeyclick: VertexEvent
            // Fired when a `click` with `metaKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:metakeyclick', e);
        },

        onVertexMarkerAltClick: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:altclick: VertexEvent
            // Fired when a `click` with `altKey` is issued on a vertex.
            this.fireAndForward('editable:vertex:altclick', e);
        },

        onVertexMarkerContextMenu: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:contextmenu: VertexEvent
            // Fired when a `contextmenu` is issued on a vertex.
            this.fireAndForward('editable:vertex:contextmenu', e);
        },

        onVertexMarkerMouseDown: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:mousedown: VertexEvent
            // Fired when user `mousedown` a vertex.
            this.fireAndForward('editable:vertex:mousedown', e);
        },

        onVertexMarkerMouseOver: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:mouseover: VertexEvent
            // Fired when a user's mouse enters the vertex
            this.fireAndForward('editable:vertex:mouseover', e);
        },

        onVertexMarkerMouseOut: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:mouseout: VertexEvent
            // Fired when a user's mouse leaves the vertex
            this.fireAndForward('editable:vertex:mouseout', e);
        },

        onVertexMarkerDrag: function (e) {
            this.onMove(e);
            if (this.feature._bounds) this.extendBounds(e);
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:drag: VertexEvent
            // Fired when a vertex is dragged by user.
            this.fireAndForward('editable:vertex:drag', e);
        },

        onVertexMarkerDragStart: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:dragstart: VertexEvent
            // Fired before a vertex is dragged by user.
            this.fireAndForward('editable:vertex:dragstart', e);
        },

        onVertexMarkerDragEnd: function (e) {
            // 🍂namespace Editable
            // 🍂section Vertex events
            // 🍂event editable:vertex:dragend: VertexEvent
            // Fired after a vertex is dragged by user.
            this.fireAndForward('editable:vertex:dragend', e);
        },

        setDrawnLatLngs: function (latlngs) {
            this._drawnLatLngs = latlngs || this.getDefaultLatLngs();
        },

        startDrawing: function () {
            if (!this._drawnLatLngs) this.setDrawnLatLngs();
            L.Editable.BaseEditor.prototype.startDrawing.call(this);
        },

        startDrawingForward: function () {
            this.startDrawing();
        },

        endDrawing: function () {
            this.tools.detachForwardLineGuide();
            this.tools.detachBackwardLineGuide();
            if (this._drawnLatLngs && this._drawnLatLngs.length < this.MIN_VERTEX) this.deleteShape(this._drawnLatLngs);
            L.Editable.BaseEditor.prototype.endDrawing.call(this);
            delete this._drawnLatLngs;
        },

        addLatLng: function (latlng) {
            if (this._drawing === L.Editable.FORWARD) this._drawnLatLngs.push(latlng);
            else this._drawnLatLngs.unshift(latlng);
            this.feature._bounds.extend(latlng);
            var vertex = this.addVertexMarker(latlng, this._drawnLatLngs);
            this.onNewVertex(vertex);
            this.refresh();
        },

        newPointForward: function (latlng) {
            this.addLatLng(latlng);
            this.tools.attachForwardLineGuide();
            this.tools.anchorForwardLineGuide(latlng);
        },

        newPointBackward: function (latlng) {
            this.addLatLng(latlng);
            this.tools.anchorBackwardLineGuide(latlng);
        },

        // 🍂namespace PathEditor
        // 🍂method push()
        // Programmatically add a point while drawing.
        push: function (latlng) {
            if (!latlng) return console.error('L.Editable.PathEditor.push expect a valid latlng as parameter');
            if (this._drawing === L.Editable.FORWARD) this.newPointForward(latlng);
            else this.newPointBackward(latlng);
        },

        removeLatLng: function (latlng) {
            latlng.__vertex.delete();
            this.refresh();
        },

        // 🍂method pop(): L.LatLng or null
        // Programmatically remove last point (if any) while drawing.
        pop: function () {
            if (this._drawnLatLngs.length <= 1) return;
            var latlng;
            if (this._drawing === L.Editable.FORWARD) latlng = this._drawnLatLngs[this._drawnLatLngs.length - 1];
            else latlng = this._drawnLatLngs[0];
            this.removeLatLng(latlng);
            if (this._drawing === L.Editable.FORWARD) this.tools.anchorForwardLineGuide(this._drawnLatLngs[this._drawnLatLngs.length - 1]);
            else this.tools.anchorForwardLineGuide(this._drawnLatLngs[0]);
            return latlng;
        },

        processDrawingClick: function (e) {
            if (e.vertex && e.vertex.editor === this) return;
            if (this._drawing === L.Editable.FORWARD) this.newPointForward(e.latlng);
            else this.newPointBackward(e.latlng);
            this.fireAndForward('editable:drawing:clicked', e);
        },

        onDrawingMouseMove: function (e) {
            L.Editable.BaseEditor.prototype.onDrawingMouseMove.call(this, e);
            if (this._drawing) {
                this.tools.moveForwardLineGuide(e.latlng);
                this.tools.moveBackwardLineGuide(e.latlng);
            }
        },

        refresh: function () {
            this.feature.redraw();
            this.onEditing();
        },

        // 🍂namespace PathEditor
        // 🍂method newShape(latlng?: L.LatLng)
        // Add a new shape (Polyline, Polygon) in a multi, and setup up drawing tools to draw it;
        // if optional `latlng` is given, start a path at this point.
        newShape: function (latlng) {
            var shape = this.addNewEmptyShape();
            if (!shape) return;
            this.setDrawnLatLngs(shape[0] || shape);  // Polygon or polyline
            this.startDrawingForward();
            // 🍂namespace Editable
            // 🍂section Shape events
            // 🍂event editable:shape:new: ShapeEvent
            // Fired when a new shape is created in a multi (Polygon or Polyline).
            this.fireAndForward('editable:shape:new', {shape: shape});
            if (latlng) this.newPointForward(latlng);
        },

        deleteShape: function (shape, latlngs) {
            var e = {shape: shape};
            L.Editable.makeCancellable(e);
            // 🍂namespace Editable
            // 🍂section Shape events
            // 🍂event editable:shape:delete: CancelableShapeEvent
            // Fired before a new shape is deleted in a multi (Polygon or Polyline).
            this.fireAndForward('editable:shape:delete', e);
            if (e._cancelled) return;
            shape = this._deleteShape(shape, latlngs);
            if (this.ensureNotFlat) this.ensureNotFlat();  // Polygon.
            this.feature.setLatLngs(this.getLatLngs());  // Force bounds reset.
            this.refresh();
            this.reset();
            // 🍂namespace Editable
            // 🍂section Shape events
            // 🍂event editable:shape:deleted: ShapeEvent
            // Fired after a new shape is deleted in a multi (Polygon or Polyline).
            this.fireAndForward('editable:shape:deleted', {shape: shape});
            return shape;
        },

        _deleteShape: function (shape, latlngs) {
            latlngs = latlngs || this.getLatLngs();
            if (!latlngs.length) return;
            var self = this,
            inplaceDelete = function (latlngs, shape) {
                    // Called when deleting a flat latlngs
                shape = latlngs.splice(0, Number.MAX_VALUE);
                return shape;
            },
            spliceDelete = function (latlngs, shape) {
                    // Called when removing a latlngs inside an array
                latlngs.splice(latlngs.indexOf(shape), 1);
                if (!latlngs.length) self._deleteShape(latlngs);
                return shape;
            };
            if (latlngs === shape) return inplaceDelete(latlngs, shape);
            for (var i = 0; i < latlngs.length; i++) {
                if (latlngs[i] === shape) return spliceDelete(latlngs, shape);
                else if (latlngs[i].indexOf(shape) !== -1) return spliceDelete(latlngs[i], shape);
            }
        },

        // 🍂namespace PathEditor
        // 🍂method deleteShapeAt(latlng: L.LatLng): Array
        // Remove a path shape at the given `latlng`.
        deleteShapeAt: function (latlng) {
            var shape = this.feature.shapeAt(latlng);
            if (shape) return this.deleteShape(shape);
        },

        // 🍂method appendShape(shape: Array)
        // Append a new shape to the Polygon or Polyline.
        appendShape: function (shape) {
            this.insertShape(shape);
        },

        // 🍂method prependShape(shape: Array)
        // Prepend a new shape to the Polygon or Polyline.
        prependShape: function (shape) {
            this.insertShape(shape, 0);
        },

        // 🍂method insertShape(shape: Array, index: int)
        // Insert a new shape to the Polygon or Polyline at given index (default is to append).
        insertShape: function (shape, index) {
            this.ensureMulti();
            shape = this.formatShape(shape);
            if (typeof index === 'undefined') index = this.feature._latlngs.length;
            this.feature._latlngs.splice(index, 0, shape);
            this.feature.redraw();
            if (this._enabled) this.reset();
        },

        extendBounds: function (e) {
            this.feature._bounds.extend(e.vertex.latlng);
        },

        onDragStart: function (e) {
            this.editLayer.clearLayers();
            L.Editable.BaseEditor.prototype.onDragStart.call(this, e);
        },

        onDragEnd: function (e) {
            this.initVertexMarkers();
            L.Editable.BaseEditor.prototype.onDragEnd.call(this, e);
        }

    });

    // 🍂namespace Editable; 🍂class PolygonEditor; 🍂aka L.Editable.PolygonEditor
    // 🍂inherits PathEditor
L.Editable.PolygonEditor = L.Editable.PathEditor.extend({
    CLOSED: true,
    MIN_VERTEX: 3,

    newPointForward: function (latlng) {
        L.Editable.PathEditor.prototype.newPointForward.call(this, latlng);
        if (!this.tools.backwardLineGuide._latlngs.length) this.tools.anchorBackwardLineGuide(latlng);
        if (!this._drawnLatLngs) {
                // If drawing is ended early;
            this.tools.detachBackwardLineGuide();
        } else if (this._drawnLatLngs.length === 2) {
            this.tools.attachBackwardLineGuide();
        }
    },

    addNewEmptyShape: function () {
        if (this.feature._latlngs.length && this.feature._latlngs[0].length) {
            const shape = [];
            this.appendShape(shape);
            return shape;
        } else {
            return this.feature._latlngs;
        }
    },

    ensureMulti: function () {
        if (this.feature._latlngs.length && isFlat(this.feature._latlngs[0])) {
            this.feature._latlngs = [this.feature._latlngs];
        }
    },

    ensureNotFlat: function () {
        if (!this.feature._latlngs.length || isFlat(this.feature._latlngs)) this.feature._latlngs = [this.feature._latlngs];
    },

    vertexCanBeDeleted: function (vertex) {
        var parent = this.feature.parentShape(vertex.latlngs),
        idx = L.Util.indexOf(parent, vertex.latlngs);
            if (idx > 0) return true;  // Holes can be totally deleted without removing the layer itself.
            return L.Editable.PathEditor.prototype.vertexCanBeDeleted.call(this, vertex);
        },

        getDefaultLatLngs: function () {
            if (!this.feature._latlngs.length) this.feature._latlngs.push([]);
            return this.feature._latlngs[0];
        },

        formatShape: function (shape) {
            // [[1, 2], [3, 4]] => must be nested
            // [] => must be nested
            // [[]] => is already nested
            if (isFlat(shape) && (!shape[0] || shape[0].length !== 0)) return [shape];
            else return shape;
        }
    });

    // 🍂namespace Editable; 🍂class EditableMixin
    // `EditableMixin` is included to `L.Polygon`. It adds some methods to it.
    // *When editing is enabled, the editor is accessible on the instance with the
    // `editor` property.*
var EditableMixin = {
    createEditor: function (map) {
        map = map || this._map;
        var tools = (this.options.editOptions || {}).editTools || map.editTools;
        if (!tools) throw Error('Unable to detect Editable instance.');
        var Klass = this.options.editorClass || this.getEditorClass(tools);
        return new Klass(map, this, this.options.editOptions);
    },

        // 🍂method enableEdit(map?: L.Map): this.editor
        // Enable editing, by creating an editor if not existing, and then calling `enable` on it.
    enableEdit: function (map) {
        if (!this.editor) this.createEditor(map);
        this.editor.enable();
        return this.editor;
    },

        // 🍂method editEnabled(): boolean
        // Return true if current instance has an editor attached, and this editor is enabled.
    editEnabled: function () {
        return this.editor && this.editor.enabled();
    },

        // 🍂method disableEdit()
        // Disable editing, also remove the editor property reference.
    disableEdit: function () {
        if (this.editor) {
            this.editor.disable();
            delete this.editor;
        }
    },

        // 🍂method toggleEdit()
        // Enable or disable editing, according to current status.
    toggleEdit: function () {
        if (this.editEnabled()) this.disableEdit();
        else this.enableEdit();
    },

    _onEditableAdd: function () {
        if (this.editor) this.enableEdit();
    }
};

var PolygonMixin = {
    getEditorClass: function (tools) {
        return (tools && tools.options.polygonEditorClass) ? tools.options.polygonEditorClass : L.Editable.PolygonEditor;
    },

    shapeAt: function (latlng, latlngs) {
            // We can have those cases:
            // - latlngs are just a flat array of latlngs, use this
            // - latlngs is an array of arrays of latlngs, this is a simple polygon (maybe with holes), use the first
            // - latlngs is an array of arrays of arrays, this is a multi, loop over
        var shape = null;
        latlngs = latlngs || this._latlngs;
        if (!latlngs.length) return shape;
        else if (isFlat(latlngs) && this.isInLatLngs(latlng, latlngs)) shape = latlngs;
        else if (isFlat(latlngs[0]) && this.isInLatLngs(latlng, latlngs[0])) shape = latlngs;
        else for (var i = 0; i < latlngs.length; i++) if (this.isInLatLngs(latlng, latlngs[i][0])) return latlngs[i];
        return shape;
    },

    isInLatLngs: function (l, latlngs) {
        var inside = false, l1, l2, j, k, len2;
        for (j = 0, len2 = latlngs.length, k = len2 - 1; j < len2; k = j++) {
            l1 = latlngs[j];
            l2 = latlngs[k];
            if (((l1.lat > l.lat) !== (l2.lat > l.lat)) &&
                (l.lng < (l2.lng - l1.lng) * (l.lat - l1.lat) / (l2.lat - l1.lat) + l1.lng)) {
                inside = !inside;
        }
    }
    return inside;
},

parentShape: function (shape, latlngs) {
    latlngs = latlngs || this._latlngs;
    if (!latlngs) return;
    var idx = L.Util.indexOf(latlngs, shape);
    if (idx !== -1) return latlngs;
    for (var i = 0; i < latlngs.length; i++) {
        idx = L.Util.indexOf(latlngs[i], shape);
        if (idx !== -1) return latlngs[i];
    }
}
};

var keepEditable = function () {
        // Make sure you can remove/readd an editable layer.
    this.on('add', this._onEditableAdd);
};

    var isFlat = L.LineUtil.isFlat || L.LineUtil._flat || L.Polyline._flat;  // <=> 1.1 compat.

    if (L.Polygon) {
        L.Polygon.include(EditableMixin);
        L.Polygon.include(PolygonMixin);
    }

    L.LatLng.prototype.update = function (latlng) {
        latlng = L.latLng(latlng);
        this.lat = latlng.lat;
        this.lng = latlng.lng;
    }
}, window));
