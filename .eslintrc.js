var OFF = 0,
    WARN = 1,
    ERROR = 2;

module.exports = exports = {
    plugins: ['requirejs'],
    rules: {
        // Possible Errors
        'for-direction': ERROR,
        'block-scoped-var': WARN,
        'no-empty': WARN,
        'no-extra-semi': WARN,
        'no-dupe-args': ERROR,

        // Best Practices
        'no-unreachable': WARN,
        'no-console': WARN,
        'no-alert': WARN,
        eqeqeq: ERROR,

        // Variables
        'no-unused-vars': [ERROR, {args: 'none'}],

        // Stylistic - everything here is a warning because of style.
        'array-bracket-spacing': [WARN, 'never'],
        'no-spaced-func': WARN,
        'no-trailing-spaces': WARN,
        'space-before-function-paren': [WARN, 'never'],

        // RequireJS
        'requirejs/one-dependency-per-line': ERROR
    },
    parserOptions: {
        ecmaVersion: 2017
    },
    env: {
        es6: true
    }
};
