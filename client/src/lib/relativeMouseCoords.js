module.exports.relMouseCoords = (event, parent) => {
	let totalOffsetX = 0;
	let totalOffsetY = 0;
	let canvasX = 0;
	let canvasY = 0;
	let currentElement = parent;

	do{
		totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
		totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
	}
	while(currentElement = currentElement.offsetParent)

	canvasX = event.pageX - totalOffsetX;
	canvasY = event.pageY - totalOffsetY;

	return {
		x: canvasX,
		y: canvasY
	}
}
