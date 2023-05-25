const express = require('express');
const { JwtStrategyMiddleware } = require('../middleware/express-auth-jwt');

const controllerBaseImage = require('../controllers/applicationBaseImage');
const controllerBrandImage = require('../controllers/applicationBrandImage');
const controllerMockup = require('../controllers/applicationMockup');
const controllerApplication = require('../controllers/application');
const controllerRenderer = require('../controllers/applicationRenderer');

const config = require('config');
const uuidv4 = require('uuid/v4');
const multer = require('multer');
const path = require('path');

const router = express.Router();

router.use(JwtStrategyMiddleware);

// configure storage
// @todo size limits
const storageBase = multer.diskStorage({
	destination: (req, file, cb) => {
		const dirpath = path.join(config.UPLOAD_DIR, req.jwt.acc, 'asset-base', 'original');
		cb(null, dirpath);
	},
	filename: (req, file, cb) => {
		const fname = `${uuidv4()}`;
		cb(null, fname);
	}
});
const uploadBase = multer({
	storage: storageBase
	// limits: 1024
});

const storageBrand = multer.diskStorage({
	destination: (req, file, cb) => {
		const dirpath = path.join(config.UPLOAD_DIR, req.jwt.acc, 'asset-brand', 'original');
		cb(null, dirpath);
	},
	filename: (req, file, cb) => {
		const fname = `${uuidv4()}`;
		cb(null, fname);
	}
});
const uploadBrand = multer({
	storage: storageBrand
});

// router.use(bodyParser.json());
// router.use(bodyParser.urlencoded({ extended: false }));

router.get('/tags', controllerApplication.getTags);
router.post('/tag', controllerApplication.addTag);
router.delete('/tag/:id', controllerApplication.deleteTag);

router.post('/render/:id', controllerRenderer.render);

router.get('/asset/base/:id', controllerBaseImage.getBaseImages);
router.post('/asset/base', uploadBase.array('image'), controllerBaseImage.postBaseImage);
router.patch('/asset/base/:id', controllerBaseImage.patchBaseImage);
router.delete('/asset/base/:id', controllerBaseImage.deleteBaseImages);
router.delete('/asset/mask/:id', controllerBaseImage.deleteBaseImageMask);

router.get('/asset/brand/:id', controllerBrandImage.getBrandImages);
router.post('/asset/brand', uploadBrand.array('image'), controllerBrandImage.postBrandImage);
router.patch('/asset/brand/:id', controllerBrandImage.patchBrandImage);
router.delete('/asset/brand/:id', controllerBrandImage.deleteBrandImages);

router.get('/asset/mockup/:id', controllerMockup.getMockup);
router.post('/asset/mockup', controllerMockup.postMockup);
router.patch('/asset/mockup/:id', controllerMockup.patchMockup);
router.delete('/asset/mockup/:id', controllerMockup.deleteMockup);

module.exports = router;
