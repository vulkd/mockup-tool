const httpStatusCodes = require("./util/httpStatusCodes.json");

const magicNumbersToIgnore = [
	...new Set(
		// [0, 1, -1, 10, 100, 1000, 7, 24, 30, 31, 60, 365, 86400]
		[0, 1, -1, 10, 100]
			.concat(Object.keys(httpStatusCodes).map((k) => parseInt(k)))
	)
];

module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"plugins": [
		"node",
		"security",
		"jsdoc",
		"promise",
		"no-secrets"
	],
	"extends": [
		"eslint:recommended",
		"plugin:node/recommended",
		"plugin:security/recommended"
	],
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly",
		// Tests:
		"describe": "readonly",
		"it": "readonly",
		"should": "readonly",
		"before": "readonly",
		"beforeEach": "readonly",
		"after": "readonly",
		"afterEach": "readonly"
	},
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module"
	},
	"rules": {
		"indent": [2, "tab", {
			"flatTernaryExpressions": true,
			"SwitchCase": 1
		}],
		"no-mixed-spaces-and-tabs": [2],
		"semi": [2, "always"],
		"semi-spacing": [2, {"before":false,"after":true}],
		"semi-style": [2, "last"],
		"space-before-blocks": [2, "always"],
		"no-trailing-spaces": [2, {
			"ignoreComments": true
		}],
		"comma-dangle": [2, "never"],
		"no-unused-vars": [2],
		"no-var": [2],
		"no-multi-str": [2],
		"no-buffer-constructor": [2],
		"require-unicode-regexp": [2],
		"radix": [2, "always"],
		"no-eq-null": [2],
		"eqeqeq": [2],
		"no-else-return": [2],
		"no-unused-expressions": [2],
		"no-empty-function": [2],
		"no-label-var": [2],
		"no-new-require": [2],
		"no-process-exit": [2],
		"require-await": [2],
		"default-case": [2],
		"default-param-last": [2],
		"dot-notation": [2],
		"no-eval": [2],
		"no-implied-eval": [2],
		"no-extend-native": [2],
		"no-div-regex": [2],
		"no-duplicate-imports": [2],
		"no-useless-constructor": [2],
		"no-useless-rename": [2],
		"object-shorthand": [2],
		"prefer-const": [2],
		"prefer-rest-params": [2],
		"prefer-spread": [2],
		"prefer-template": [2],
		"template-curly-spacing": [2, "never"],
		"prefer-arrow-callback": [2],
		"max-statements-per-line": [2, { "max": 1 }],
		"new-parens": [2, "always"],
		"no-continue": [2],
		"no-bitwise": [2], // The use of bitwise operators in JavaScript is very rare and often & or | is simply a mistyped && or ||, which will lead to unexpected behavior.
		"no-lonely-if": [2],
		"no-mixed-operators": [2], // This rule may conflict with no-extra-parens rule. If you use both this and no-extra-parens rule together, you need to use the nestedBinaryExpressions option of no-extra-parens rule.
		"no-multi-assign": [2],
		"no-new-object": [2],
		"no-multiple-empty-lines": [2, {"max": 1}],
		"no-negated-condition": 2,
		"no-trailing-spaces": [2],
		"no-unneeded-ternary": [2],
		"no-whitespace-before-property": 2,
		"nonblock-statement-body-position": 2,
		"operator-assignment": [2, "always"],
		"one-var": [2,"never"],
		"lines-between-class-members": [2, "always"],
		"eol-last": [2, "always"], // nix
		"linebreak-style": [2, "unix"], // nix
		"operator-linebreak": [2, "before"],
		"implicit-arrow-linebreak": [2, "beside"],
		"keyword-spacing": [2, {"before":true,"after":true}],
		"key-spacing": [2, {"beforeColon": false,"afterColon":true}],
		"function-paren-newline": [2,"never"],
		"func-name-matching": [2, "always"],
		"func-style": [2, "declaration", { "allowArrowFunctions": true }],
		"func-call-spacing": [2, "never"],
		"consistent-this": [2, "that"],
		"computed-property-spacing": [2, "never"],
		"comma-style": [2, "last"],
		"comma-spacing": [2, {"before":false,"after":true}],
		"brace-style": [2, "1tbs"],
		"block-spacing": [2, "always"],
		"array-element-newline": [2, "consistent"],
		"array-bracket-newline": [2, "consistent"],
		"array-bracket-spacing": [2, "never", {"singleValue": false, "objectsInArrays": false, "arraysInArrays": false}],
		"padded-blocks": [1, "never"],
		"prefer-object-spread": 2,
		"quote-props": [2, "as-needed"],
		"space-before-function-paren": [1, {"named":"never","anonymous":"always","asyncArrow": "always"}],
		"space-in-parens": [1, "never"],
		"space-unary-ops": [1, {"words": true, "nonwords": false}],
		"spaced-comment": [1, "always"],
		"template-tag-spacing": [1, "always"],
		"wrap-regex": [2],
		"max-params": [1, {"max": 6}],
		"max-depth": [1, {"max": 4}],
		"max-nested-callbacks": [1, {"max": 10}],
		"complexity": [1, {"max": 20}],
		"max-lines-per-function": [1, {"max": 50, "skipBlankLines": true, "skipComments": true}],
		"arrow-parens": [2, "always"],
		"curly": [1, "all"],
		"quotes": [2, "single", {"allowTemplateLiterals": true, "avoidEscape": true}],
		"id-length": [2, {"min": 3, "properties": "never", "exceptions": ["_","e","c","cb","el","i","x","y","k","v","ip","f","fn","fs","to","dv"]}],
		"no-underscore-dangle": [2, {"allow":["_id"]}],
		"no-magic-numbers": [2, {
			"ignore": magicNumbersToIgnore,
			"ignoreArrayIndexes": true,
			"enforceConst": false,
			"detectObjects": false
		}],
		"func-names": [1, "as-needed"],
		"no-inline-comments": [1], // inline comments are for eslint only
		"id-blacklist": [2, "map"], // "e", "data", "err", "cb", "callback"
		"yoda": [2, "never"],
		"no-restricted-syntax": [2,
			"MemberExpression[object.name='fs'][property.name=/.*Sync/]", // no fs.*Sync methods, they block the event loop.
			// @todo "CallExpression[expression.name='logbot'][arguments.Literal.value=/[0123]/]", // Ensure logbot is called with a lvl (integer)
			// @todo Ensure resolveError only called with 4** and 5**
		],
		// "lines-around-comment": [1, "before"],
		// "no-invalid-this": [2],
		// "max-statements": [2, {"max": 30}],
		// "camelcase": [2, {"properties": "always"}],
		// "max-len": [2, {"code": 120, "comments":120}],
		// "space-infix-ops": [2],
		// "function-call-argument-newline": [2, "never"],
		// "space-in-brackets": [2, "never", {
		//   "singleValue": true,
		//   "objectsInArrays": true,
		//   "arraysInArrays": true,
		//   "arraysInObjects": false,
		//   "objectsInObjects": true,
		//   "propertyName": true
		// }],
		// capitalized-comments
		// "line-comment-position": [2, {"position": "beside"}],
		// "object-curly-spacing": [1, "never", {
		// 	"arraysInObjects": true,
		// 	"objectsInObjects": true
		// }],
		// "object-property-newline"
		// no-plusplus
		// multiline-ternary
		// "vars-on-top": [2],

		"promise/no-return-wrap": 2,
		"promise/param-names": 2,
		"promise/no-native": 0,
		"promise/no-promise-in-callback": 1,
		"promise/no-callback-in-promise": 1,
		"promise/no-return-in-finally": 2,
		"promise/prefer-await-to-then": 1,
		// "promise/valid-params": 1,
		// "promise/prefer-await-to-callbacks": 1,
		// "promise/avoid-new": 1,
		// "promise/no-new-statics": 2,
		// "promise/always-return": 2,
		// "promise/catch-or-return": 2,
		// "promise/no-nesting": 1,

		"no-secrets/no-secrets": 2,

		"node/exports-style": [2, "module.exports"],
		"node/file-extension-in-import": [2, "always"],
		"node/prefer-global/buffer": [2, "always"],
		"node/prefer-global/console": [2, "always"],
		"node/prefer-global/process": [2, "always"],
		"node/prefer-global/url-search-params": [2, "always"],
		"node/prefer-global/url": [2, "always"],
		"node/prefer-promises/dns": 2,
		"node/prefer-promises/fs": 2,
		"node/no-unpublished-require": 0,
		"node/no-extraneous-require": 0,
		// "node/no-extraneous-require": [2, {
		// 	"allowModules": ["body-parser", "request", "lodash", "tmp"]
		// }]
	}
};
