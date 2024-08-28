import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';

export default [
	{
		files: ['**/*.js'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: {
				...globals.node,
			},
		},
		rules: {
			...pluginJs.configs.recommended.rules,
		},
	},
	{
		files: ['**/__tests__/**/*.js', '**/*.test.js'],
		plugins: {
			jest: pluginJest,
		},
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
		rules: {
			...pluginJest.configs.recommended.rules,
		},
	},
];
