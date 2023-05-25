const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const purgecss = require('@fullhuman/postcss-purgecss');

const ENABLE_PURGECSS = process.env.NODE_ENV === 'production';

module.exports = () => {
	return {
		plugins: [
			tailwindcss('./tailwind.config.js'),
			ENABLE_PURGECSS && purgecss({
				content: [
					'./src/**/*.html',
					'./src/**/*.vue',
					'./src/**/*.css',
					'./src/*.html',
					'./src/*.css'
				],
				whitelist: [
					'mode-dark'
				],
				whitelistPatterns: [
					/^mceu/u
				],
				extractors: [
					{
						extractor: class TailwindExtractor {
							static extract(content) {
								const matches = content.match(/[A-z0-9-:\/]+/g) || [];

								// Hacky way to handle all the color props.
								const possibleColors = ['brand'];

								const classesFromColorVars = content.match(/--color-[a-z]*-\d{3}/g);
								if (classesFromColorVars) {
									classesFromColorVars.map((c) => {
										for (const color of possibleColors) {
											matches.push(c.replace('${color}', color));
										}
									});
								}

								const classesFromColorProps = content.match(/[a-z]*-\${color}-\d{3}/g);
								if (classesFromColorProps) {
									classesFromColorProps.map((c) => {
										for (const color of possibleColors) {
											matches.push(c.replace('${color}', color));
										}
									});
								}

								// vue-awesome
								matches.push('fa-icon');
								matches.push('fa-flip-horizontal', 'fa-flip-vertical', 'fa-spin', 'fa-inverse', 'fa-pulse');

								matches.push('text-white', 'text-black', 'bg-white', 'bg-black');
								return matches;
							}
						},
						extensions: ['vue']
					}
				]
			}),
			autoprefixer({
				add: true,
				grid: false
			})
		]
	};
};
