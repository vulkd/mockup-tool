const express = require('express');
const { hiddenInputMiddleware } = require('../middleware/express-hidden-input-check');
const { LocalStrategyMiddleware } = require('../middleware/express-auth-local');
// const { rawBodyParserMiddleware } = require('../middleware/express-rawbody');
const { limiterGeneric } = require('../middleware/express-ratelimiterredis');

const controllerPublic = require('../controllers/public');

const router = express.Router();

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
	// Should catch reset routes until we build a more targeted limiter later on.
	router.use(limiterGeneric);
}

// Use after limiter
router.use(hiddenInputMiddleware);

router.get('/', controllerPublic.get);
router.get('/favicon.ico', controllerPublic.favicon);

router.get('/plans', controllerPublic.stripeGetAvailablePlans);

router.post('/join', controllerPublic.join);
router.post('/signin', LocalStrategyMiddleware, controllerPublic.signin);
router.post('/signout', controllerPublic.signout);
router.post('/reset', controllerPublic.requestPasswordReset);
router.post('/reset/:token', controllerPublic.passwordReset);
router.post('/refreshtoken', controllerPublic.refreshJwt);

router.post('/activate/:token', controllerPublic.activateAccount);

// router.post("/upload", limiterPublicUploads, rawBodyParserMiddleware, controllerPublic.upload);

router.get('/feedback', controllerPublic.feedback);
router.post('/contact', controllerPublic.contact);

module.exports = router;
