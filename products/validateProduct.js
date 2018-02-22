const validate = require("validate.js");

const constraints = {
    name: {
        presence: true,
        format: {
            pattern: /^(?!\s*$).+/,
            message: "can't be blank"
        }
    },
    imageURL: {
        presence: true,
        url: {}
    }
}

module.exports = (product) => validate(product, constraints);