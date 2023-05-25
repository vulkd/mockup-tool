module.exports.moveSvgQuadrilateralPolyPathToTopLeft = (pathData, paddingTopLeft) => {
	const vertices = pathData.split(/(?=[A-Z])/).map(vertex => ({
		cmd: vertex[0],
		x: parseFloat(vertex.split(' ')[0].slice(1)),
		y: parseFloat(vertex.split(' ')[1].replace('z', ''))
	}));

	// assume nw->ne->sw->se
	const leftMostIdx = Math.min(vertices[0].x, vertices[3].x) === vertices[0].x ? 0 : 3;
	const topMostIdx = Math.min(vertices[0].y, vertices[1].y) === vertices[0].y ? 0 : 1;

	const leftDiff = vertices[leftMostIdx].x - paddingTopLeft;
	const topDiff = vertices[topMostIdx].y - paddingTopLeft;

	vertices[leftMostIdx].x = 0 + paddingTopLeft;
	vertices[topMostIdx].y = 0 + paddingTopLeft;

	if (leftMostIdx === 0) {
		vertices[3].x -= leftDiff;
	} else {
		vertices[0].x -= leftDiff;
	}

	if (topMostIdx === 0) {
		vertices[1].y -= topDiff;
	} else {
		vertices[0].y -= topDiff;
	}

	vertices[1].x -= leftDiff;
	vertices[2].x -= leftDiff;
	vertices[2].y -= topDiff;
	vertices[3].y -= topDiff;

	return vertices.map(({cmd, x, y}) => `${cmd}${x} ${y}`).join('') + 'z';
}

module.exports.fitPathToSvg = (el, svg) => {
	const { width: svgWidth, height: svgHeight } = svg.getBoundingClientRect();

	// set viewbox mins to 0
	const viewBox = svg.getAttribute('viewBox').split(' ')
	viewBox[0] = 0;
	viewBox[1] = 0;
	svg.setAttribute('viewBox', viewBox.join(' '));

	const paddingFactor = 4;
	const paddingTopLeft = Math.max(svgWidth / paddingFactor, svgHeight / paddingFactor);
	const paddingBottomRight = Math.max(svgWidth / paddingFactor, svgHeight / paddingFactor);

	const pathData = module.exports.moveSvgQuadrilateralPolyPathToTopLeft(el.getAttribute('d'), Math.max(svgWidth / 5, svgHeight / 5));
	el.setAttribute('d', pathData);

	// scale path
	const scaleFactor = Math.max(svgWidth / 500, svgHeight / 500);
	let scale = 1;
	let iterations = 0;
	while (1 < 2) {
	  el.setAttribute('transform', `scale(${scale})`)
	  scale += scaleFactor;
	  iterations++
	  const { width, height } = el.getBoundingClientRect();
	  if (width >= (svgWidth - paddingBottomRight) || height >= (svgHeight - paddingBottomRight)) {
	    // console.log(iterations)
	    return;
	  }
	}
}
