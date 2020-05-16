module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "plugins": [],
    "rules": {
        "quotes": ["warn", "single"],
        "keyword-spacing": "warn",
        "space-before-blocks": "warn",
        "comma-dangle": "warn",
        "no-multi-spaces": "warn",
        "comma-spacing": ["warn", { "before": false, "after": true }]
    },
    "settings": {},
    "ignorePatterns": ["node_modules"]
};