'use strict';

const validate = require("validate.js");

const constraints = {
    name: {
        presence: true,
        format: {
            pattern: /^(?!\s*$).+/,
            message: "can't be blank"
        }
    }
}

module.exports.validate = (product) => validate(product, constraints);