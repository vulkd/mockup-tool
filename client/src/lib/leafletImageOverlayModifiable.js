 const yx = L.latLng;
 const xy = (x, y) => L.Util.isArray(x) ? yx(x[1], x[0]) : yx(y, x);

// https://github.com/IvanSanchez/Leaflet.ImageOverlay.Rotated
 L.ImageOverlay.Rotated = L.ImageOverlay.extend({
 	initialize(image, nw, ne, sw, se, options) {
 		if (typeof(image) === 'string') this._url = image;
 		else this._rawImage = image; // Assume that the first parameter is an instance of HTMLImage or HTMLCanvas
 		this._topLeft    = xy(...nw);
 		this._topRight   = xy(...ne);
 		this._bottomLeft = xy(...sw);
 		this._bottomRight = xy(...se);
 		L.setOptions(this, options);
 	},

 	initMoveMarker(markers, map, icon) {
		// move icon will be always located at the middle between marker 2 et marker 3
 		const markerPos = this.middlePoint(this._topLeft.lng, this._topLeft.lat, this._bottomLeft.lng, this._bottomLeft.lat);
 		// const imgEl = this._image.querySelector('.leaflet-image-layer');
 		// const bboxImgWrapper = this._image.getBoundingClientRect();
 		// const bboxImg = imgEl.getBoundingClientRect();
 		// console.log(this._image)
 		// console.log(bboxImg, bboxImgWrapper)
 		// const markerPosX = bboxImg.width / 2;
 		// const markerPosY = bboxImg.height / 2;
 		// const markerPos = Object.values(this._map.layerPointToLatLng([markerPosX, markerPosY]))

 		this._moveMarker = L.marker(markerPos, { draggable: true, icon }).addTo(map);

 		var initialMarkerDiff1X, initialMarkerDiff1Y, initialMarkerDiff2X, initialMarkerDiff2Y, initialMarkerDiff3X, initialMarkerDiff3Y;
 		this._moveMarker.on('dragstart', function(ev){

			// When drag starts, try to determine the initial (X, Y) coordinates of each marker from the moveMarker.
 			var moveMarkerX = this._map.latLngToLayerPoint(ev.target.getLatLng()).x;
 			var moveMarkerY = this._map.latLngToLayerPoint(ev.target.getLatLng()).y;

 			// nw
 			var initialMarker1X = this._map.latLngToLayerPoint(markers[0].getLatLng()).x;
 			var initialMarker1Y = this._map.latLngToLayerPoint(markers[0].getLatLng()).y;
 			initialMarkerDiff1X = initialMarker1X - moveMarkerX;
 			initialMarkerDiff1Y = initialMarker1Y - moveMarkerY;

 			// ne
 			var initialMarker2X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
 			var initialMarker2Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
 			initialMarkerDiff2X = initialMarker2X - moveMarkerX;
 			initialMarkerDiff2Y = initialMarker2Y - moveMarkerY;

 			// sw
 			var initialMarker3X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
 			var initialMarker3Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
 			initialMarkerDiff3X = initialMarker3X - moveMarkerX;
 			initialMarkerDiff3Y = initialMarker3Y - moveMarkerY;

 			// se
 			var initialMarker4X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
 			var initialMarker4Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
 			initialMarkerDiff4X = initialMarker4X - moveMarkerX;
 			initialMarkerDiff4Y = initialMarker4Y - moveMarkerY;

 		});
 		this._moveMarker.on('drag', (ev) => {

			// During the grad, always adujet the position of the 3 markers to keep the initial offset.
 			var targetLatLng = ev.target.getLatLng();
 			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
 			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

 			var newMarker1X = targetLatLngPx + initialMarkerDiff1X;
 			var newMarker1Y = targetLatLngPy + initialMarkerDiff1Y;
 			var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

 			var newMarker2X = targetLatLngPx + initialMarkerDiff2X;
 			var newMarker2Y = targetLatLngPy + initialMarkerDiff2Y;
 			var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

 			var newMarker3X = targetLatLngPx + initialMarkerDiff3X;
 			var newMarker3Y = targetLatLngPy + initialMarkerDiff3Y;
 			var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

 			var newMarker4X = targetLatLngPx + initialMarkerDiff4X;
 			var newMarker4Y = targetLatLngPy + initialMarkerDiff4Y;
 			var newMarker4LatLng = this._map.layerPointToLatLng(L.point(newMarker4X, newMarker4Y));

			// Update marker corners location
 			markers[0].setLatLng(newMarker1LatLng);
 			markers[1].setLatLng(newMarker2LatLng);
 			markers[2].setLatLng(newMarker3LatLng);
 			markers[3].setLatLng(newMarker4LatLng);

 			this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng, newMarker4LatLng);
 		});

 	},

 	initRotateMarker(markers, map, icon) {
 		var middleM1M3 = this.middlePoint(markers[1].getLatLng().lat, markers[1].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);
 		var rotateIconCoordinates = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, middleM1M3[0], middleM1M3[1])
 		this._rotateMarker = L.marker(rotateIconCoordinates, {draggable: true, icon }).addTo(map);


 		var initialMarkerDiff1X, initialMarkerDiff1Y, initialMarkerDiff2X, initialMarkerDiff2Y, initialMarkerDiff3X, initialMarkerDiff3Y;
 		var center, centerX, centerY, radWithInitialAngle;

 		this._rotateMarker.on('dragstart', (ev) => {

 			center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

 			var targetLatLng = ev.target.getLatLng();
 			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
 			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

			// get initial marker's distance from image's center
 			centerX = this._map.latLngToLayerPoint(center).x;
 			centerY = this._map.latLngToLayerPoint(center).y;

 			var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
 			var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
 			initialMarkerDiff1X = initialMarker1X - centerX;
 			initialMarkerDiff1Y = initialMarker1Y - centerY;

 			var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
 			var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
 			initialMarkerDiff2X = initialMarker2X - centerX;
 			initialMarkerDiff2Y = initialMarker2Y - centerY;

 			var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
 			var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
 			initialMarkerDiff3X = initialMarker3X - centerX;
 			initialMarkerDiff3Y = initialMarker3Y - centerY;

			// Get initial angle in the plane between the positive x-axis and ray from (0,0) to mouse's position (at first click), in radians
			// https://fr.wikipedia.org/wiki/Atan2
 			radWithInitialAngle = Math.atan2(targetLatLngPx - centerX, targetLatLngPy - centerY);

 		});

 		this._rotateMarker.on('drag', (ev) => {

 			var targetLatLng = ev.target.getLatLng();
 			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
 			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

			// Get the angle in the plane between the positive x-axis and ray from 0,0 (top-left corner of the page) to mouse's position (during drag), in radians
 			var rad = Math.atan2(targetLatLngPx - centerX, targetLatLngPy - centerY);

			// Angle value to rotate image
 			var rotateAngle = radWithInitialAngle - rad;

			// Set new marker's position, using the moveMarker's coordinates at image's center
 			var newMarker1X = centerX + (initialMarkerDiff1X*Math.cos(rotateAngle) - initialMarkerDiff1Y*Math.sin(rotateAngle));
 			var newMarker1Y = centerY + (initialMarkerDiff1Y*Math.cos(rotateAngle) + initialMarkerDiff1X*Math.sin(rotateAngle));
 			var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

 			var newMarker2X = centerX + (initialMarkerDiff2X*Math.cos(rotateAngle) - initialMarkerDiff2Y*Math.sin(rotateAngle));
 			var newMarker2Y = centerY + (initialMarkerDiff2Y*Math.cos(rotateAngle) + initialMarkerDiff2X*Math.sin(rotateAngle));
 			var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

 			var newMarker3X = centerX + (initialMarkerDiff3X*Math.cos(rotateAngle) - initialMarkerDiff3Y*Math.sin(rotateAngle));
 			var newMarker3Y = centerY + (initialMarkerDiff3Y*Math.cos(rotateAngle) + initialMarkerDiff3X*Math.sin(rotateAngle));
 			var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

			// Update marker corners location
 			markers[1].setLatLng(newMarker1LatLng);
 			markers[2].setLatLng(newMarker2LatLng);
 			markers[3].setLatLng(newMarker3LatLng);

 			this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)

 		});

 	},

 	initResizeMarker(markers, map, icon) {
 		var resizeIconCoordinates = this.middlePoint(markers[0].getLatLng().lat, markers[0].getLatLng().lng, markers[2].getLatLng().lat, markers[2].getLatLng().lng);
 		this._resizeMarker = L.marker(resizeIconCoordinates, {draggable: true, icon }).addTo(map);

 		var initialMarkerDiff1X, initialMarkerDiff1Y, initialMarkerDiff2X, initialMarkerDiff2Y, initialMarkerDiff3X, initialMarkerDiff3Y;
 		var centerX, centerY, initialDistToCenter;

 		this._resizeMarker.on('dragstart', (ev) => {

 			var targetLatLng = ev.target.getLatLng();
 			var initialDragX = this._map.latLngToLayerPoint(targetLatLng).x;
 			var initialDragY = this._map.latLngToLayerPoint(targetLatLng).y;

 			var center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

			// get initial marker's distance from image's center
 			centerX = this._map.latLngToLayerPoint(center).x;
 			centerY = this._map.latLngToLayerPoint(center).y;

 			var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
 			var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
 			initialMarkerDiff1X = initialMarker1X - centerX;
 			initialMarkerDiff1Y = initialMarker1Y - centerY;

 			var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
 			var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
 			initialMarkerDiff2X = initialMarker2X - centerX;
 			initialMarkerDiff2Y = initialMarker2Y - centerY;

 			var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
 			var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
 			initialMarkerDiff3X = initialMarker3X - centerX;
 			initialMarkerDiff3Y = initialMarker3Y - centerY;

 			initialDistToCenter = Math.sqrt((initialDragX-centerX)**2 + (initialDragY-centerY)**2)

 		});

 		this._resizeMarker.on('drag', (ev) => {

 			var targetLatLng = ev.target.getLatLng();
 			var targetLatLngPx = this._map.latLngToLayerPoint(targetLatLng).x;
 			var targetLatLngPy = this._map.latLngToLayerPoint(targetLatLng).y;

 			var distToCenter = Math.sqrt((targetLatLngPx-centerX)**2 + (targetLatLngPy-centerY)**2);
 			var ratio = distToCenter/initialDistToCenter;

			// Set new marker's position, using the moveMarker's coordinates at image's center
 			var newMarker1X = centerX + initialMarkerDiff1X * ratio;
 			var newMarker1Y = centerY + initialMarkerDiff1Y * ratio;
 			var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

 			var newMarker2X = centerX + initialMarkerDiff2X * ratio;
 			var newMarker2Y = centerY + initialMarkerDiff2Y * ratio;
 			var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

 			var newMarker3X = centerX + initialMarkerDiff3X * ratio;
 			var newMarker3Y = centerY + initialMarkerDiff3Y * ratio;
 			var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

			// Update marker corners location
 			markers[1].setLatLng(newMarker1LatLng);
 			markers[2].setLatLng(newMarker2LatLng);
 			markers[3].setLatLng(newMarker3LatLng);

 			this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
 		});
 	},

 	setRotate(value) {
 		var center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

		// get initial marker's distance from image's center
 		var centerX = this._map.latLngToLayerPoint(center).x;
 		var centerY = this._map.latLngToLayerPoint(center).y;

 		var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
 		var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
 		var initialMarkerDiff1X = initialMarker1X - centerX;
 		var initialMarkerDiff1Y = initialMarker1Y - centerY;

 		var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
 		var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
 		var initialMarkerDiff2X = initialMarker2X - centerX;
 		var initialMarkerDiff2Y = initialMarker2Y - centerY;

 		var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
 		var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
 		var initialMarkerDiff3X = initialMarker3X - centerX;
 		var initialMarkerDiff3Y = initialMarker3Y - centerY;

		// Angle value to rotate image
 		var rotateAngle = value * Math.PI / 180;

		// Set new marker's position, using the moveMarker's coordinates at image's center
 		var newMarker1X = centerX + (initialMarkerDiff1X*Math.cos(rotateAngle) - initialMarkerDiff1Y*Math.sin(rotateAngle));
 		var newMarker1Y = centerY + (initialMarkerDiff1Y*Math.cos(rotateAngle) + initialMarkerDiff1X*Math.sin(rotateAngle));
 		var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

 		var newMarker2X = centerX + (initialMarkerDiff2X*Math.cos(rotateAngle) - initialMarkerDiff2Y*Math.sin(rotateAngle));
 		var newMarker2Y = centerY + (initialMarkerDiff2Y*Math.cos(rotateAngle) + initialMarkerDiff2X*Math.sin(rotateAngle));
 		var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

 		var newMarker3X = centerX + (initialMarkerDiff3X*Math.cos(rotateAngle) - initialMarkerDiff3Y*Math.sin(rotateAngle));
 		var newMarker3Y = centerY + (initialMarkerDiff3Y*Math.cos(rotateAngle) + initialMarkerDiff3X*Math.sin(rotateAngle));
 		var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

		// Update marker corners location
 		markers[1].setLatLng(newMarker1LatLng);
 		markers[2].setLatLng(newMarker2LatLng);
 		markers[3].setLatLng(newMarker3LatLng);

 		this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
 	},

 	setResize(value){

 		var ratio = value/100;

 		var center = this.middlePoint(markers[2].getLatLng().lat, markers[2].getLatLng().lng, markers[3].getLatLng().lat, markers[3].getLatLng().lng);

		// get initial marker's distance from image's center
 		var centerX = this._map.latLngToLayerPoint(center).x;
 		var centerY = this._map.latLngToLayerPoint(center).y;

 		var initialMarker1X = this._map.latLngToLayerPoint(markers[1].getLatLng()).x;
 		var initialMarker1Y = this._map.latLngToLayerPoint(markers[1].getLatLng()).y;
 		var initialMarkerDiff1X = initialMarker1X - centerX;
 		var initialMarkerDiff1Y = initialMarker1Y - centerY;

 		var initialMarker2X = this._map.latLngToLayerPoint(markers[2].getLatLng()).x;
 		var initialMarker2Y = this._map.latLngToLayerPoint(markers[2].getLatLng()).y;
 		var initialMarkerDiff2X = initialMarker2X - centerX;
 		var initialMarkerDiff2Y = initialMarker2Y - centerY;

 		var initialMarker3X = this._map.latLngToLayerPoint(markers[3].getLatLng()).x;
 		var initialMarker3Y = this._map.latLngToLayerPoint(markers[3].getLatLng()).y;
 		var initialMarkerDiff3X = initialMarker3X - centerX;
 		var initialMarkerDiff3Y = initialMarker3Y - centerY;

		// Set new marker's position, using the moveMarker's coordinates at image's center
 		var newMarker1X = centerX + initialMarkerDiff1X * ratio;
 		var newMarker1Y = centerY + initialMarkerDiff1Y * ratio;
 		var newMarker1LatLng = this._map.layerPointToLatLng(L.point(newMarker1X, newMarker1Y));

 		var newMarker2X = centerX + initialMarkerDiff2X * ratio;
 		var newMarker2Y = centerY + initialMarkerDiff2Y * ratio;
 		var newMarker2LatLng = this._map.layerPointToLatLng(L.point(newMarker2X, newMarker2Y));

 		var newMarker3X = centerX + initialMarkerDiff3X * ratio;
 		var newMarker3Y = centerY + initialMarkerDiff3Y * ratio;
 		var newMarker3LatLng = this._map.layerPointToLatLng(L.point(newMarker3X, newMarker3Y));

		// Update marker corners location
 		markers[1].setLatLng(newMarker1LatLng);
 		markers[2].setLatLng(newMarker2LatLng);
 		markers[3].setLatLng(newMarker3LatLng);

 		this.reposition(newMarker1LatLng, newMarker2LatLng, newMarker3LatLng)
 	},

 	onAdd(map) {
 		if (!this._image) {
 			this._initImage();
 			if (this.options.opacity < 1) this._updateOpacity();
 		}
 		if (this.options.interactive) {
 			L.DomUtil.addClass(this._rawImage, 'leaflet-interactive');
 			this.addInteractiveTarget(this._rawImage);
 		}
 		map.on('zoomend resetview', this._reset, this);
 		this.getPane().appendChild(this._image);
 		this._reset();
 	},

 	onRemove(map) {
 		map.off('zoomend resetview', this._reset, this);
 		L.ImageOverlay.prototype.onRemove.call(this, map);
 	},

 	_initImage () {
 		let img = this._rawImage;
 		if (this._url) {
 			img = L.DomUtil.create('img');
			img.style.display = 'none';	// Hide while the first transform (zero or one frames) is being done
			if (this.options.crossOrigin) img.crossOrigin = '';
			img.src = this._url;
			this._rawImage = img;
		}
		L.DomUtil.addClass(img, 'leaflet-image-layer');

		// this._image is reused by some of the methods of the parent class and
		// must keep the name, even if it is counter-intuitive.
		const div = this._image = L.DomUtil.create('div', 'leaflet-image-layer ' + (this._zoomAnimated ? 'leaflet-zoom-animated' : ''));
		this._updateZIndex(); // apply z-index style setting to the div (if defined)
		div.appendChild(img);
		div.onselectstart = L.Util.falseFn;
		div.onmousemove = L.Util.falseFn;

		img.onload = function(){
			this._reset();
			img.style.display = 'block';
			this.fire('load');
		}.bind(this);

		img.alt = this.options.alt;
	},


	_reset () {
		const div = this._image;
		if (!this._map) return;

		this._map.doubleClickZoom.disable();

		// Project control points to container-pixel coordinates
		const pxTopLeft    = this._map.latLngToLayerPoint(this._topLeft);
		const pxTopRight   = this._map.latLngToLayerPoint(this._topRight);
		const pxBottomLeft = this._map.latLngToLayerPoint(this._bottomLeft);
		const pxBottomRight = this._map.latLngToLayerPoint(this._bottomRight);

		// // Infer coordinate of bottom right
		// const pxBottomRight = pxTopRight.subtract(pxTopLeft).add(pxBottomLeft);
		// this._bottomRight = this._map.layerPointToLatLng(L.point(pxBottomRight));

		// pxBounds is mostly for positioning the <div> container
		const pxBounds = L.bounds([pxTopLeft, pxTopRight, pxBottomLeft, pxBottomRight]);
		const size = pxBounds.getSize();
		const pxTopLeftInDiv = pxTopLeft.subtract(pxBounds.min);

		// Calculate the skew angles, both in X and Y
		const vectorX = pxTopRight.subtract(pxTopLeft);
		const vectorY = pxBottomLeft.subtract(pxTopLeft);
		const skewX = Math.atan2( vectorX.y, vectorX.x );
		const skewY = Math.atan2( vectorY.x, vectorY.y );

		// LatLngBounds used for animations
		this._bounds = L.latLngBounds(this._map.layerPointToLatLng(pxBounds.min), this._map.layerPointToLatLng(pxBounds.max));

		L.DomUtil.setPosition(div, pxBounds.min);

		div.style.width  = size.x + 'px';
		div.style.height = size.y + 'px';
		div.style.outline = '5px solid red'

		const imgW = this._rawImage.width;
		const imgH = this._rawImage.height;
		if (!imgW || !imgH) return;	// Probably because the image hasn't loaded yet.

		const scaleX = pxTopLeft.distanceTo(pxTopRight) / imgW * Math.cos(skewX);
		const scaleY = pxTopLeft.distanceTo(pxBottomLeft) / imgH * Math.cos(skewY);

		this._rawImage.style.transformOrigin = '0 0';

		this._rawImage.style.transform =
		'translate(' + pxTopLeftInDiv.x + 'px, ' + pxTopLeftInDiv.y + 'px)' +
		'skew(' + skewY + 'rad, ' + skewX + 'rad) ' +
		'scale(' + scaleX + ', ' + scaleY + ') ';
	},

	reposition(topleft, topright, bottomleft, bottomright) {
		this._topLeft = topleft;
		this._topRight = topright;
		this._bottomLeft = bottomleft;
		this._bottomRight = bottomright;
		this._reset();

		// Reposition move marker centered between marker 2 et 3
		if (this._moveMarker) {
			let moveIconCoordinates = this.middlePoint(this._topRight.lat, this._topRight.lng, this._bottomLeft.lat, this._bottomLeft.lng);
			this._moveMarker.setLatLng(moveIconCoordinates);
		}
		if (this._rotateMarker) {
			let middleTop = this.middlePoint(this._topLeft.lat, this._topLeft.lng, this._bottomLeft.lat, this._bottomLeft.lng)
			let rotateIconCoordinates = this.middlePoint(middleTop[0], middleTop[1], this._topRight.lat, this._topRight.lng)
			this._rotateMarker.setLatLng(rotateIconCoordinates);
		}
		if (this._resizeMarker) {
			let resizeIconCoordinates = this.middlePoint(this._topLeft.lat, this._topLeft.lng, this._topRight.lat, this._topRight.lng)
			this._resizeMarker.setLatLng(resizeIconCoordinates);
		}
	},

	setUrl (url) {
		this._url = url;
		if (this._rawImage) this._rawImage.src = url;
		return this;
	},

	middlePoint(lat1, lng1, lat2, lng2) {
		if (typeof (Number.prototype.toRad) === "undefined") {
			Number.prototype.toRad = function () {
				return this * Math.PI / 180;
			}
		}
		if (typeof (Number.prototype.toDeg) === "undefined") {
			Number.prototype.toDeg = function () {
				return this * (180 / Math.PI);
			}
		}
		var dLng = (lng2 - lng1).toRad();
		lat1 = lat1.toRad();
		lat2 = lat2.toRad();
		lng1 = lng1.toRad();
		var bX = Math.cos(lat2) * Math.cos(dLng);
		var bY = Math.cos(lat2) * Math.sin(dLng);
		var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bX) * (Math.cos(lat1) + bX) + bY * bY));
		var lng3 = lng1 + Math.atan2(bY, Math.cos(lat1) + bX);
		return [lat3.toDeg(), lng3.toDeg()];
	}

});

/* 🍂factory imageOverlay.rotated(imageUrl: String|HTMLImageElement|HTMLCanvasElement, topleft: LatLng, topright: LatLng, bottomleft: LatLng, options?: ImageOverlay options)
 * Instantiates a rotated/skewed image overlay, given the image URL and
 * the `LatLng`s of three of its corners.
 *
 * Alternatively to specifying the URL of the image, an existing instance of `HTMLImageElement`
 * or `HTMLCanvasElement` can be used.
 */
 L.imageOverlay.rotated = function(imgSrc, ne, nw, se, sw, options) {
 	return new L.ImageOverlay.Rotated(imgSrc, ne, nw, se, sw, options);
 };
