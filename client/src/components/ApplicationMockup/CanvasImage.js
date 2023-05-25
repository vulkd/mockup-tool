// Aspect Ratio helper
const gcd = (a, b) => (b === 0) ? a : gcd(b, a % b);

class Point {
	constructor (x, y) {
		this.x = x;
		this.y = y;
	}

	length (point) {
		if (!point) point = new Point(0 ,0)
		const xs = (point.x - this.x);
		const ys = (point.y - this.y);
		return Math.sqrt((xs * xs) + (ys * ys));
	}
}

class TextureCoord {
	constructor (u, v) {
		this.u = u ? u : 0;
		this.v = v ? v : 0;
	}
}

class Triangle {
	constructor (p0, p1, p2, t0, t1, t2) {
		this.p0 = p0;
		this.p1 = p1;
		this.p2 = p2;
		this.t0 = t0;
		this.t1 = t1;
		this.t2 = t2;
	}

	// @see http://tulrich.com/geekstuff/canvas/jsgl.js
	draw (ctx, im, x0, y0, x1, y1, x2, y2, sx0, sy0, sx1, sy1, sx2, sy2) {
		ctx.save();

	  // Clip the output to the on-screen triangle boundaries.
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.clip();

		const denom =
			sx0 * (sy2 - sy1) - sx1 * sy2 +
			sx2 * sy1 + (sx1 - sx2) * sy0;

		if (denom == 0) {
			return;
		}

		const m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
		const m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
		const m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
		const m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
		const dx = (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
		const dy = (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;

		ctx.transform(m11, m12, m21, m22, dx, dy);
		ctx.drawImage(im, 0, 0);
		ctx.restore();
	}
}

class CanvasImage {
	constructor (canvas, im, mask) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.ctx.imageSmoothingQuality = 'high';
		// this.ctx = canvas.getContext('webgl', {
		// 	antialias: false,
		// 	depth: false
		// });
		this.im = im;

		this.triangles = [];
		this.dirtyTriangles = true;
		this.subdivisionLimit = 20;
	}

	clearCanvas () {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	render () {
		for (const tri of this.triangles) {
			tri.draw(this.ctx, this.im,
				tri.p0.x, tri.p0.y,
				tri.p1.x, tri.p1.y,
				tri.p2.x, tri.p2.y,
				tri.t0.u, tri.t0.v,
				tri.t1.u, tri.t1.v,
				tri.t2.u, tri.t2.v
			);
		}
	}

	calculateNumberOfSubdivisions (imW, imH) {
		const aspectRatio = gcd(imW, imH);
		const imHRatio = imH / aspectRatio;
		const imWRatio = imW / aspectRatio;
		return {
			vertical: imHRatio > this.subdivisionLimit ? imHRatio / this.subdivisionLimit : imHRatio,
			horizontal: imWRatio > this.subdivisionLimit ? imWRatio / this.subdivisionLimit : imWRatio
		}
	}

	calculateGeometry (mask) {
		this.triangles = [];

		const imW = this.im.naturalWidth;
		const imH = this.im.naturalHeight;

		const subdivisons = this.calculateNumberOfSubdivisions(imW, imH);
		// subdivisons.vertical /= 10
		// subdivisons.horizontal /= 10

		const p1 = new Point(mask.nw.x, mask.nw.y);
		const p2 = new Point(mask.ne.x, mask.ne.y);
		const p3 = new Point(mask.se.x, mask.se.y);
		const p4 = new Point(mask.sw.x, mask.sw.y);

		const dx1 = p4.x - p1.x;
		const dy1 = p4.y - p1.y;
		const dx2 = p3.x - p2.x;
		const dy2 = p3.y - p2.y;

		for (let verticalSubdivison = 0; verticalSubdivison < subdivisons.vertical; verticalSubdivison++) {
			const curRow = verticalSubdivison / subdivisons.vertical;
			const nextRow = (verticalSubdivison + 1) / subdivisons.vertical;

			const curRowX1 = p1.x + dx1 * curRow;
			const curRowY1 = p1.y + dy1 * curRow;

			const curRowX2 = p2.x + dx2 * curRow;
			const curRowY2 = p2.y + dy2 * curRow;

			const nextRowX1 = p1.x + dx1 * nextRow;
			const nextRowY1 = p1.y + dy1 * nextRow;

			const nextRowX2 = p2.x + dx2 * nextRow;
			const nextRowY2 = p2.y + dy2 * nextRow;

			for (let horizontalSubdivision = 0; horizontalSubdivision < subdivisons.horizontal; horizontalSubdivision++) {
				const curCol = horizontalSubdivision / subdivisons.horizontal;
				const nextCol = (horizontalSubdivision + 1) / subdivisons.horizontal;

				const dCurX = curRowX2 - curRowX1;
				const dCurY = curRowY2 - curRowY1;
				const dNextX = nextRowX2 - nextRowX1;
				const dNextY = nextRowY2 - nextRowY1;

				const p1x = curRowX1 + dCurX * curCol;
				const p1y = curRowY1 + dCurY * curCol;

				const p2x = curRowX1 + (curRowX2 - curRowX1) * nextCol;
				const p2y = curRowY1 + (curRowY2 - curRowY1) * nextCol;

				const p3x = nextRowX1 + dNextX * nextCol;
				const p3y = nextRowY1 + dNextY * nextCol;

				const p4x = nextRowX1 + dNextX * curCol;
				const p4y = nextRowY1 + dNextY * curCol;

				const u1 = curCol * imW;
				const u2 = nextCol * imW;
				const v1 = curRow * imH;
				const v2 = nextRow * imH;

				const triangle1 = new Triangle(
					new Point(p1x, p1y),
					new Point(p3x, p3y),
					new Point(p4x, p4y),
					new TextureCoord(u1, v1),
					new TextureCoord(u2, v2),
					new TextureCoord(u1, v2)
				);

				const triangle2 = new Triangle(
					new Point(p1x, p1y),
					new Point(p2x, p2y),
					new Point(p3x, p3y),
					new TextureCoord(u1, v1),
					new TextureCoord(u2, v1),
					new TextureCoord(u2, v2)
				);

				this.triangles.push(triangle1, triangle2);
			}
		}
	}

	draw (mask) {
		this.clearCanvas();

		if (this.dirtyTriangles) {
			this.dirtyTriangles = false;
			this.calculateGeometry(mask);
		}

		if (this.im) {
			this.render();
		}
	}
}

module.exports = {
	CanvasImage
};
