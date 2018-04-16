const Joi = require('joi');

const schema = Joi.object({
    name: Joi.string()
        .required()
        .trim(),
    imageURL: Joi.string()
        .required()
        .trim()
        .uri()
});

const options = {
    abortEarly: false,
};

module.exports = function validateProduct(product) {
    let validationResults = schema.validate(product, options);
    let errors = validationResults.error && validationResults.error.details;
    if (errors && errors.length) {
        const collapsedErrors = {};
        errors.forEach(err => {
            let jsonPointer = '/' + err.path.join('/');
            let existingErrorsForField = collapsedErrors[jsonPointer] || [];
            collapsedErrors[jsonPointer] = [...existingErrorsForField, err.message];
        });
        return collapsedErrors;
    }
};