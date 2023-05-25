<template>
	<div class='relative bg-black h-full w-full'>


	<div
	v-for='(v, k) in handles'
	:key='k'
	:ref="`handle-${k}`"
	class='z-50 absolute top-0 left-0 w-3 h-3 cursor-grab'
	:style='`border: 3px solid ${handleColors[k]};transform: translate(-${handles[k].x / 2}px, -${handles[k].y / 2}px)`'
	@mousedown='onHandleMousedown($event, k)'
	@mousemove='onHandleMousemove'
	@mouseup='onHandleMouseup'
	></div>

	<canvas ref='elCanvasMask' v-show='shouldShowMask'  class='z-40 absolute w-full pointer-events-none'></canvas>
	<!-- <canvas ref='foreground' class='z-30 absolute w-full pointer-events-none'></canvas> -->
	<!-- <canvas ref='elCanvasBrandImage' @mousemove='onHandleMousemove' @click='onHandleMouseup' class='z-20 absolute w-full'></canvas> -->
	<canvas ref='elCanvasBrandImage' class='z-20 absolute w-full'></canvas>
	<canvas ref='elCanvasBaseImage' class='z-10 absolute w-full pointer-events-none'></canvas>
	<!-- <canvas ref='hidden' class='absolute' style='left: -99999999999px'></canvas> -->

	<img v-if='baseImage' ref='image' class='max-w-full max-h-full opacity-0 invisible object-contain' :src='baseImage.src'></img>
</div>
</template>

<script>
export default {
	props: {
		baseImage: Object,
		brandImage: Object
	},
	data() {
		return {
			shouldShowMask: true,
			handles: {
				nw: { x: 0, y: 0 },
				ne: { x: 0, y: 0 },
				se: { x: 0, y: 0 },
				sw: { x: 0, y: 0 }
			},
		}
	},
	watch: {
		brandImage(value) {
			this.loadBrandImage();
		},
	},
	created() {
		this.handleColors = {ne:' magenta',nw: 'lime',se: 'cyan',sw: 'orange'};
	},
	mounted() {
		this.loadBaseImage();
		if (this.brandImage) this.loadBrandImage();
	},
	methods: {
		loadBaseImage() {
			const im = new Image();
			im.src = this.baseImage.src;
			im.onload = () => {
				const vH = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);

				this.imHeight = im.height;
				this.imWidth = im.width;
				this.imContainerHeight = this.$refs.image.offsetHeight;
				this.imContainerWidth = this.$refs.image.offsetWidth;

				const canvas = this.$refs.elCanvasBaseImage;
				const ctx = canvas.getContext('2d');

				canvas.height = String(this.imHeight);
				canvas.width = String(this.imWidth);

				ctx.drawImage(im, 0, 0, this.imWidth, this.imHeight, 0, 0, canvas.width, canvas.height);

				this.loadMask();
				if (this.brandImage) {
					this.loadBrandImage();
				}
			}
		},
		loadMask() {
			const canvas = this.$refs.elCanvasMask;
			const ctx = canvas.getContext('2d');
			canvas.height = String(this.imHeight);
			canvas.width = String(this.imWidth);

			const mask = this.baseImage.mask;

			ctx.beginPath();
			ctx.moveTo(mask.nw.x, this.imHeight - mask.nw.y);
			ctx.lineTo(mask.ne.x, this.imHeight - mask.ne.y);
			ctx.lineTo(mask.se.x, this.imHeight - mask.se.y);
			ctx.lineTo(mask.sw.x, this.imHeight - mask.sw.y);
			ctx.lineTo(mask.nw.x, this.imHeight - mask.nw.y);
			// ctx.strokeStyle = 'rgba(51, 136, 255, 1)';
			// ctx.fillStyle = 'rgba(51, 136, 255, 0.4)';
			ctx.strokeStyle = 'rgba(0, 255, 0, 1)';
			ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
			ctx.lineWidth = 6;
			ctx.stroke();
			ctx.fill();
		},
		loadBrandImage() {
			const canvas = this.$refs.elCanvasBrandImage;
			const ctx = canvas.getContext('2d');
			canvas.height = String(this.imHeight);
			canvas.width = String(this.imWidth);

			this.handleBeingDragged = null

			if (this.baseImage) {
				const mask = this.baseImage.mask;

			// swap ne/nw, se/sw for horizontal flip
				this.handles = {
					nw: { x: mask.nw.x, y: this.imHeight - mask.nw.y },
					ne: { x: mask.ne.x, y: this.imHeight - mask.ne.y },
					se: { x: mask.se.x, y: this.imHeight - mask.se.y },
					sw: { x: mask.sw.x, y: this.imHeight - mask.sw.y }
				};

			// 8 8 		64+8 0or-8
			// 8 32+8	64+8 16+8
			// for (const vertex of ['ne', 'nw', 'se', 'sw']) {
			// 	this.$refs[`handle-${vertex}`][0].style.left = this.handles[vertex].x + 'px';
			// 	this.$refs[`handle-${vertex}`][0].style.top = this.handles[vertex].y + 'px';
			// }
				const im = new Image();
				im.src = this.brandImage.src;
				im.onload = () => {
			// setInterval(draw, 1000 / 60);
			// draw();
					this.brandImage
					this.drawBrandImage(canvas, ctx, im);
				}
				this.im = im;
			}
		},
		drawBrandImage(canvas, ctx, im) {
			this.dirtyTriangles = true
			let triangles = [];

			const gcd = (a,b) => (b === 0) ? a : gcd(b, a % b);

			const calculateGeometry = () => {
				// clear triangles out
				triangles = [];

				const imgW = im.naturalWidth;
				const imgH = im.naturalHeight;

				const r = gcd(imgW, imgH);

					// generate subdivision
					let subs = imgH / r; // vertical subdivisions
					let divs = imgW / r; // horizontal subdivisions

					if (subs > 20 || divs > 20) {
						subs /= 10;
						divs /= 10;
					}

					// for (const vertex of ['ne', 'nw', 'se', 'sw']) {
					// 	this.handles[vertex].x = this.$refs[`handle-${vertex}`][0].style.left;
					// 	this.handles[vertex].y = this.$refs[`handle-${vertex}`][0].style.top;
					// };

					const p1 = new Point(this.handles.nw.x, this.handles.nw.y);
					const p2 = new Point(this.handles.ne.x, this.handles.ne.y);
					const p3 = new Point(this.handles.se.x, this.handles.se.y);
					const p4 = new Point(this.handles.sw.x, this.handles.sw.y);

					const dx1 = p4.x - p1.x;
					const dy1 = p4.y - p1.y;
					const dx2 = p3.x - p2.x;
					const dy2 = p3.y - p2.y;

					for (let sub = 0; sub < subs; sub++) {
						const curRow = sub / subs;
						const nextRow = (sub + 1) / subs;

						const curRowX1 = p1.x + dx1 * curRow;
						const curRowY1 = p1.y + dy1 * curRow;

						const curRowX2 = p2.x + dx2 * curRow;
						const curRowY2 = p2.y + dy2 * curRow;

						const nextRowX1 = p1.x + dx1 * nextRow;
						const nextRowY1 = p1.y + dy1 * nextRow;

						const nextRowX2 = p2.x + dx2 * nextRow;
						const nextRowY2 = p2.y + dy2 * nextRow;

						for (let div = 0; div < divs; div++) {
							const curCol = div / divs;
							const nextCol = (div + 1) / divs;

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

							const u1 = curCol * imgW;
							const u2 = nextCol * imgW;
							const v1 = curRow * imgH;
							const v2 = nextRow * imgH;

							const triangle1 = new Triangle(
								new Point(p1x, p1y),
								new Point(p3x, p3y),
								new Point(p4x, p4y),
								new TextCoord(u1, v1),
								new TextCoord(u2, v2),
								new TextCoord(u1, v2)
							);

							const triangle2 = new Triangle(
								new Point(p1x, p1y),
								new Point(p2x, p2y),
								new Point(p3x, p3y),
								new TextCoord(u1, v1),
								new TextCoord(u2, v1),
								new TextCoord(u2, v2)
							);

							triangles.push(triangle1, triangle2);
						}
					}
				}

				// from http://tulrich.com/geekstuff/canvas/jsgl.js
				const drawTriangle = (ctx, im, x0, y0, x1, y1, x2, y2, sx0, sy0, sx1, sy1, sx2, sy2) => {
					ctx.save();

			    // Clip the output to the on-screen triangle boundaries.
					ctx.beginPath();
					ctx.moveTo(x0, y0);
					ctx.lineTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.closePath();
					ctx.clip();

					const denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
					if (denom == 0) return;
					const m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
					const m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
					const m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
					const m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
					const dx = (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
					const dy = (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;
					ctx.transform(m11, m12, m21, m22, dx, dy);
					ctx.drawImage(im, 0, 0);
					ctx.restore();
				};

				const Point = function(x, y) {
					this.x = x ? x : 0;
					this.y = y ? y : 0;
				}
				Point.prototype.length = function(point) {
					point = point ? point : new Point();
					let xs =0, ys =0;
					xs = point.x - this.x;
					xs = xs * xs;

					ys = point.y - this.y;
					ys = ys * ys;
					return Math.sqrt( xs + ys );
				}
				const TextCoord = function(u,v) {
					this.u = u ? u : 0;
					this.v = v ? v : 0;
				}
				const Triangle = function(p0, p1, p2, t0, t1, t2) {
					this.p0 = p0;
					this.p1 = p1;
					this.p2 = p2;
					this.t0 = t0;
					this.t1 = t1;
					this.t2 = t2;
				}

				const draw = () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					const render = (im, tri) => {
						if (im) {
							drawTriangle(ctx, im,
								tri.p0.x, tri.p0.y,
								tri.p1.x, tri.p1.y,
								tri.p2.x, tri.p2.y,
								tri.t0.u, tri.t0.v,
								tri.t1.u, tri.t1.v,
								tri.t2.u, tri.t2.v);
						}
					}
					if (this.dirtyTriangles) {
						this.dirtyTriangles = false;
						calculateGeometry();
					}
					for (let triangle of triangles) {
						render(im, triangle);
					}
				}

				draw()
			},
			onHandleMousedown(e, k) {
				const node = e.target;
				this.handleBeingDragged = k;
				// this.pos1 = e.clientX;
				// this.pos2 = e.clientY;
				this.viewport = { bottom: 0, left: 0, right: 0, top: 0 };
				const PADDING = 0;
				this.rect = e.target.getBoundingClientRect();
				this.viewport.bottom = window.innerHeight - PADDING;
				this.viewport.left = PADDING;
				this.viewport.right = window.innerWidth - PADDING;
				this.viewport.top = PADDING;
			},
			onHandleMousemove(e) {
				if (this.handleBeingDragged) {
					this.pos1 = this.pos3 - e.clientX;
					this.pos2 = this.pos4 - e.clientY;
					this.pos3 = e.clientX;
					this.pos4 = e.clientY;
					const el = this.$refs[`handle-${this.handleBeingDragged}`][0];

					console.log(this.handleBeingDragged)

				  // check to make sure the element will be within our viewport boundary
					const newLeft = el.offsetLeft - this.pos1;
					const newTop = el.offsetTop - this.pos2;
					if (newLeft < this.viewport.left
						|| newTop < this.viewport.top
						|| newLeft + this.rect.width > this.viewport.right
						|| newTop + this.rect.height > this.viewport.bottom
						) {
						// pass
					} else {
						el.style.top = (el.offsetTop - this.pos2) + "px";
						el.style.left = (el.offsetLeft - this.pos1) + "px";
					}
					this.dirtyTriangles = true
				}
			},
			onHandleMouseup(e) {
				this.handleBeingDragged = null
			},

		}
	};
	</script>
