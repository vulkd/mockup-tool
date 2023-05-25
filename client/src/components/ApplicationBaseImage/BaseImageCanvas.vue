<template>
	<div ref='workingArea' class='flex-1 relative w-full h-full bg-black select-none'>
		<ApplicationCanvasUi class="pointer-events-none">
			<div class='flex'>
				<div @click='onLeafletControlClickZoomIn'  class='canvas-ui--btn h-8 w-8 cursor-pointer bg-black hover:bg-gray-700 flex justify-center items-center rounded px-2 py-1'>
					<Icon name='plus'></Icon>
				</div>

				<div @click='onLeafletControlClickZoomOut'  class='canvas-ui--btn h-8 w-8 ml-4 cursor-pointer bg-black hover:bg-gray-700 flex justify-center items-center rounded px-2 py-1'>
					<Icon name='minus'></Icon>
				</div>
			</div>

			<div v-show='shouldShowDrawHelper' class='canvas-ui--btn mt-4 h-8 pointer-events-none hover:bg-gray-700 bg-black inline-flex justify-center items-center  rounded px-2 py-1'>
				Click to start drawing
			</div>
		</ApplicationCanvasUi>

		<div class='absolute top-0 left-0 h-full w-full'>
			<div ref='map' :id="uniqueMapId" class="relative top-0 left-0 h-full w-full"></div>
		</div>

		<img v-if='baseImage' ref='image' :src='baseImage.src' class='invisible opacity-0' style='left: -99999999999px;'></img>
	</div>
</template>

<script>
import ApplicationCanvasUi from '@/components/ApplicationCanvasUi';
import { MASK_COLORS } from '@/constants';

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import '@/lib/leafletEditable';
// import 'leaflet-path-drag';
// import { intersect } from '@turf/intersect';


const yx = L.latLng;
const xy = (x, y) => L.Util.isArray(x) ? yx(x[1], x[0]) : yx(y, x);

export default {
	components: {
		ApplicationCanvasUi
	},
	props: {
		baseImage: Object
	},
	data() {
		return {
			isLoadingImage: true,
			imHeight: 0,
			imWidth: 0,
			imContainerHeight: 0,
			imContainerWidth: 0,
			isDrawing: false,
			// isPolygonDrawn: false,
			activeMaskIdx: 0,
			shouldShowDrawHelper: false
		}
	},
	watch: {
		isDrawing(value) {
			this.$emit('drawing', value)
		}
	},
	computed: {
		baseImageMasks: {
			get() {
				return this.baseImage.masks;
			},
			set(val) {
				if (!val) return;
				this.$store.dispatch("User/Application/ApplicationBaseImage/setMask", val);
			}
		},
		loading() {
			return this.$store.state.isLoading;
		}
	},
	created() {
		const hash = s => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
		this.uniqueMapId = `map-${hash(this.$vnode.tag + this._uid)}`;
	},
	mounted() {
		window.onkeydown = e => {
			if (this.isDrawing && e.keyCode == 27) this.clearMaskLayer();
		};

		this.$refs.workingArea.style.height = `calc(100vh - ${this.$refs.workingArea.offsetTop}px)`;
		this.initMap();

		if (this.baseImage && this.baseImage.src) {
			this.$nextTick(() => this.setImage());
		}
	},
	methods: {
		async setImage() {
			this.$refs.image.style.height = `calc(100vh - ${this.$refs.workingArea.offsetTop}px)`;
			this.activeMaskIdx = 0;
			this.map.editTools.changeLineGuideStyle({ color: MASK_COLORS[this.activeMaskIdx] });
			await this.loadImage();
			this.$nextTick(() => {
				this.setMapImageOverlay();
			})
		},
		loadImage() {
			return new Promise((resolve, reject) => {
				this.isLoadingImage = true;
				const im = new Image();
				im.src = this.baseImage.src;
				im.onerror = reject;
				im.onload = () => {
					this.imHeight = im.height;
					this.imWidth = im.width;
					this.imContainerHeight = this.$refs.image.offsetHeight;
					this.imContainerWidth = this.$refs.image.offsetWidth;
					this.isLoadingImage = false;
					resolve(im);
				}
			});
		},
		setMapImageOverlay() {
			if (this.mapImageOverlayLayer) this.map.removeLayer(this.mapImageOverlayLayer);

			this.map.options.minZoom = -Infinity;
			const bounds = [[0,0], [this.imHeight, this.imWidth ]];
			const boundsLatLng = L.latLngBounds(bounds[0], bounds[1]);
			const padding = [0, 0];
			this.map.setMaxBounds(boundsLatLng);
			this.map.fitBounds(boundsLatLng, { padding, animate: false });
			this.map.on('drag', () => this.map.panInsideBounds(bounds, { animate: false }));
			this.mapImageOverlayLayer = new L.imageOverlay(this.baseImage.src, bounds).addTo(this.map);
			this.map.options.minZoom = this.map.getZoom() - .5;
			this.map.setZoom(this.map.getZoom() - .1, { animate: false });

			const hasMask = this.baseImageMasks.length && Object.values(this.baseImageMasks[0].mask).map(({x, y}) => x + y).reduce((acc, cur) => acc + cur, 0);
			if (hasMask) {
				this.redrawMasks();
			} else {
				this.clearMaskLayer();
			}
		},
		initMap() {
			this.$refs.map.style.height = `calc(100vh - ${this.$refs.workingArea.offsetTop}px)`;
			this.map = L.map(this.uniqueMapId, {
				zoom: 0,
				zoomSnap: 0.001,
				zoomDelta: 0.001,
				trackResize: true,
				zoomControl: false,
				crs: L.CRS.Simple,
				attributionControl: false,
				center: [0,0],
				maxBoundsViscosity: 1.0,
				// preferCanvas: true,
				// renderer: L.canvas(),
				editable: true,
				editOptions: {
					lineGuideOptions: {
						color: MASK_COLORS[0],
						dashArray: '1, 6',
						weight: 3
					}
				}
			});


			this.tmpLayer = new L.featureGroup().addTo(this.map)

			this.map.on('click', e => {
				this.shouldShowDrawHelper = false;
			});
			this.map.doubleClickZoom.disable();
			// map.on('drag', () => {
			// 	map.panInsideBounds(bounds, { animate: false });
			// });


			// User starts to draw
			this.map.on('editable:enable', e => {
				this.$emit('maskClick', null);
				this.map.editTools.changeLineGuideStyle({ color: MASK_COLORS[this.activeMaskIdx] })
			});
			this.map.on('editable:drawing:start', e => {
				this.isDrawing = true;
			});

			// User is dragging vertex  (new or exisitng)
			this.map.on('editable:vertex:drag', e => {
				this.activeMaskIdx = this.baseImageMasks.findIndex(mask => mask.id === e.layer._MASK_ID);
				// this.checkForIntersections(e.latlng);
			});

			// User finishes new drawing
			this.map.on('editable:drawing:end', e => {
				this.isDrawing = false;
				const vertices = e.layer._latlngs[0];

				if (vertices.length === 4) {
					const maskId = this.baseImageMasks[this.activeMaskIdx] && this.baseImageMasks[this.activeMaskIdx].id
					? this.baseImageMasks[this.activeMaskIdx].id
					: `tmp-${e.layer._leaflet_id}`;

					e.layer._MASK_ID = maskId;
					this.updateCoords(vertices, maskId);
					this.activeMaskIdx++

					e.layer.on('click', (e) => {
						const maskId = e.target._MASK_ID;
						this.activeMaskIdx = this.baseImageMasks.findIndex(mask => mask.id === maskId);
						this.$emit('maskClick', maskId);
					});

				} else {
					this.clearMaskLayer();
				}
			});

			// User is editing existing
			this.map.on('editable:editing', e => {
				e.layer.setStyle({ color: MASK_COLORS[this.activeMaskIdx] });

				const vertices = e.layer._latlngs[0];
				if (vertices.length === 4) {
					this.map.editTools.commitDrawing(e);
					this.map.editTools.stopDrawing();
				}
			});
			this.map.on('editable:dragstart', e => {
				const vertices = e.layer._latlngs[0];
			});

			// User drags vertex marker on new or existing bbox
			this.map.on('editable:dragend', e => {
				const vertices = e.layer._latlngs[0];
				if (vertices.some(v => v.lat < 0 || v.lng < 0)) {

				} else if (vertices.length === 4) {
					// If dragging vertex of finished mask
					this.updateCoords(vertices, e.layer._MASK_ID);
				}
			});
			this.map.on('editable:vertex:dragend', e => {
				const vertices = e.layer._latlngs[0];
				if (vertices.length === 4) {
					this.updateCoords(vertices, e.layer._MASK_ID);
				} else {
					this.clearMaskLayer();
				}
			})

			// User deletes drawing
			this.map.on('editable:shape:deleted', e => {
				this.activeMaskIdx--;
				this.map.editTools.changeLineGuideStyle({ color: MASK_COLORS[this.activeMaskIdx] });
			});


			// this.map.on('editable:vertex:new', e => {
			// });
			// this.map.on('editable:vertex:rawclick', e => {
			// 	// this.activeMaskIdx =
			// });
			// this.map.on('editable:vertex:click', e => {
			// });
			// this.map.on('editable:vertex:clicked', e => {
			// });

		},
		onLeafletControlClickZoomIn() {
			this.map.setZoom(this.map.getZoom() + 1)
		},
		onLeafletControlClickZoomOut() {
			this.map.setZoom(this.map.getZoom() - 1)
		},
		onLeafletControlClickDrawPolygon() {
			this.shouldShowDrawHelper = true;
			this.activeMaskIdx = this.baseImageMasks.length;
			this.map.editTools.startPolygon(null, { draggable: true });
		},
		onLeafletControlClickDrawDelete(mask) {
			const ft = Object.values(this.map.editTools.featuresLayer._layers).find(ft => ft._MASK_ID === mask.id);
			ft.remove();
			this.$store.dispatch('User/Application/ApplicationBaseImage/destroyMask', mask)
		},
		checkForIntersections(point) {
			const { lat: y, lng: x } = point;

			// const allVertices = this.baseImage.masks.map(mask +> {
			// 	({ nw, ne, se, sw }) => {
			// 					return [
			// 						[ nw.x, nw.y ],
			// 						[ ne.x, ne.y ],
			// 						[ sw.x, sw.y ],
			// 						[ se.x, se.y ]
			// 					]
			// 				}
			// });

			for (const vertices of allVertices) {
				// let inside = false;
				// for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
				// 		const { lat: xi, lng: yi } = vertices[i];
				// 		const { lat: xj, lng: yj } = vertices[j];
				//     const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
				//     if (intersect) {
				//     	inside = !inside;
				//     }
				// }
			}

		},
		clearMaskLayer() {
			this.map.editTools.editLayer.clearLayers();
			this.map.editTools.featuresLayer.clearLayers();
			this.baseImageMask = {
				nw: { x: 0, y: 0 },
				ne: { x: 0, y: 0 },
				se: { x: 0, y: 0 },
				sw: { x: 0, y: 0 }
			};
		},
		setActiveMask(mask, maskIdx) {
			if (!maskIdx && maskIdx !== 0) {
				this.activeMaskIdx = this.baseImageMasks.length;
			} else {
				this.activeMaskIdx = maskIdx;
				const ft = Object.values(this.map.editTools.featuresLayer._layers).find(ft => ft._MASK_ID === mask.id);
				this.$emit('maskClick', mask.id);
			}
		},
		redrawMasks() {
			this.map.editTools.editLayer.clearLayers();
			this.map.editTools.featuresLayer.clearLayers();
			this.activeMaskIdx = 0;
			for (const mask of this.baseImageMasks) {
				this.redrawMask(mask, { shouldAddNewFt: true });
				this.activeMaskIdx++;
			}
			this.$emit('redrawMasks');
		},
		redrawMask(mask, opts={}) {
			let ft = Object.values(this.map.editTools.featuresLayer._layers).find(ft => ft._MASK_ID === mask.id);
			const coords = [
				xy(mask.mask.nw.x, mask.mask.nw.y),
				xy(mask.mask.ne.x, mask.mask.ne.y),
				xy(mask.mask.se.x, mask.mask.se.y),
				xy(mask.mask.sw.x, mask.mask.sw.y)
			];
			if (opts.shouldAddNewFt) {
				ft = L.polygon(coords, { color: MASK_COLORS[this.activeMaskIdx] });
				ft.setStyle({ className: 'leaflet-editable-feature' });
				ft._MASK_ID = mask.id;
				ft.addTo(this.map.editTools.featuresLayer);
				ft.enableEdit(this.map);
			} else {
				ft.setLatLngs(coords);
				// disable / enable edit to reset vertex markers
				ft.disableEdit(this.map);
				ft.enableEdit(this.map);

			}
		},
		updateCoords(vertices, maskId) {
			const maskCoords = {
				nw: { x: vertices[0].lng, y: vertices[0].lat },
				ne: { x: vertices[1].lng, y: vertices[1].lat },
				se: { x: vertices[2].lng, y: vertices[2].lat },
				sw: { x: vertices[3].lng, y: vertices[3].lat }
			}



	 		// @todo shift points so if 2 or more points reside on same axis fix it
	 		// @param vertices [{lat:float,lng:float}*4]
	 		// @returns [{lat:float,lng:float}*4]
			function dirFix (vertices) {
				const final = {
					nw: { x: null, y: null }, ne: { x: null, y: null },
					se: { x: null, y: null }, sw: { x: null, y: null }
				};

				const verticesSortByLat = vertices.slice().sort((a, b) => a.lat - b.lat);
				const verticesSortByLng = vertices.slice().sort((a, b) => a.lng - b.lng);

				const twoTop = verticesSortByLat.slice(2);
				const twoLeft = verticesSortByLng.slice(0, 2);
				const twoRight = verticesSortByLng.slice(2);
				const twoBottom = verticesSortByLat.slice(0, 2);

				// eg; nw will be in top left quadrant:
				final.nw = twoTop.find(v => twoLeft.map(i=>i.lat).includes(v.lat));
				final.ne = twoTop.find(v => twoRight.map(i=>i.lat).includes(v.lat));
				final.se = twoBottom.find(v => twoRight.map(i=>i.lat).includes(v.lat));
				final.sw = twoBottom.find(v => twoLeft.map(i=>i.lat).includes(v.lat));

				// convex poly is sum of all angles < 180d, O(n)
				// if convex polygon ( O(n) ) ? or return after first fix, as in a convex
				// poly of 4 sides there should only be two of the below errors (two errors per vertex)
				// fixing convex polygon errors:

				console.log(final)

				const latsN = verticesSortByLat.map(v => v.lat).slice(2);
				// if 2 y-east in north half, then north-east is south-west
				if (latsN.includes(final.se.lng) && latsN.includes(final.ne.lng)) console.log('hit');
				// if 2 y-west in north half, then north-west is south-east
				if (latsN.includes(final.sw.lng) && latsN.includes(final.nw.lng)) console.log('hit');

				const latsS = verticesSortByLat.map(v => v.lat).slice(0, 2);
				// if 2 y-east in south half, then south-east is north-west
				if (latsS.includes(final.se.lng) && latsS.includes(final.ne.lng)) console.log('hit');
				// if 2 y-west in south half, then south-west is north-east
				if (latsS.includes(final.sw.lng) && latsS.includes(final.nw.lng)) console.log('hit');

				const lngsE = verticesSortByLng.map(v => v.lng).slice(0, 2);
				// if 2 south-x in east half, then south-east is north-east
				if (lngsE.includes(final.se.lng) && lngsE.includes(final.sw.lng)) console.log('hit');
				// if 2 north-x in east half, then north-east is south-east
				if (lngsE.includes(final.ne.lng) && lngsE.includes(final.nw.lng)) console.log('hit');

				const lngsW = verticesSortByLng.map(v => v.lng).slice(2);
				// if 2 south-x in west half, then south-west is north-west
				if (lngsW.includes(final.se.lng) && lngsW.includes(final.sw.lng)) console.log('hit');
				// if 2 north-x in west half, then north-west is south-west
				if (lngsW.includes(final.ne.lng) && lngsW.includes(final.nw.lng)) console.log('hit');

				return final;
			}






			// // crop bbox to image
			for (const k of Object.keys(maskCoords)) {
				const i = maskCoords[k];
				if (i.x < 0) maskCoords[k].x = 0;
				if (i.y < 0) maskCoords[k].y = 0;
				if (i.x > this.imWidth) maskCoords[k].x = this.imWidth;
				if (i.y > this.imHeight) maskCoords[k].y = this.imHeight;
			}







			const mask = { id: maskId, mask: maskCoords, z: 0 };
			this.redrawMask(mask);

			// maskId.startsWith('tmp')

			const isNewFt = !this.baseImageMasks.find(existingMask => existingMask.id === mask.id);
			if (isNewFt) {
				this.$store.dispatch('User/Application/ApplicationBaseImage/addMask', mask);
			} else {
				this.$store.dispatch('User/Application/ApplicationBaseImage/setMask', mask, this.activeMaskIdx);
			}

			this.$emit('maskEdit', this.activeMaskIdx);
		}
	}
};
</script>
