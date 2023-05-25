const express = require('express');
const { JwtStrategyMiddleware } = require('../middleware/express-auth-jwt');
const controllerAccount = require('../controllers/account');
const controllerAccountAdmin = require('../controllers/accountAdmin');
const { resolveError, getResponseForHttpStatusCode } = require('../util/expressHelpers');

const config = require('config');
const uuidv4 = require('uuid/v4');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

router.use(JwtStrategyMiddleware);

// configure storage
// @todo size limits
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const dirpath = path.join(config.UPLOAD_DIR, req.user.account_id, 'profile');
		try {
			fs.mkdir(dirpath, () => {});
		} catch (err) {
			// eslint-disable-line no-empty
		}
		cb(null, dirpath);
	},
	filename: (req, file, cb) => {
		const fname = `${uuidv4()}-${uuidv4()}`;
		cb(null, fname);
	}
});
const upload = multer({
	storage
	// limits: 1024
});

router.get('/', controllerAccount.get);
router.patch('/', controllerAccount.patch);
router.post('/avatar', upload.single('image'), controllerAccount.postAvatar);
router.delete('/', controllerAccount.delete);
router.get('/:id', controllerAccount.getUsers);

// Admin
const adminMiddleware = (req, res, next) => {
	if (req.user && req.user.role === 'admin') {
		next();
	} else {
		resolveError(res, getResponseForHttpStatusCode(401, 'Administrator rights required'));
	}
};

router.post('/', adminMiddleware, controllerAccountAdmin.createUser);

module.exports = router;
