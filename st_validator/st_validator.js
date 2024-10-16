class st_validator {

    static #validate_for_attribute_or_regexp_or_property(input, attribute, regexp, property) {
        if (regexp) {
            let regexp_obj = new RegExp(regexp);

            if (!attribute && !property)
                return regexp_obj.test(input.value);

            if (attribute && property)
                return input.hasAttribute(attribute) && regexp_obj.test(input[property]);

            return (attribute ? regexp_obj.test(input.getAttribute(attribute)) : true) && (property ? regexp_obj.test(input[property]) : true);
        } else {
            return attribute ? input.hasAttribute(attribute) : true;
        }
    }

    constructor(param) {

        let all_inputs = document.querySelectorAll(param.selector);

        var validator_f = function (input) {
            if ((param.validator ? param.validator(input) : true) &&
                st_validator.#validate_for_attribute_or_regexp_or_property(input, param.attribute, param.regexp, param.property))
                
                param.on_valid(input)
            else
                param.on_invalid(input)
        };

        let validation_events = param.events ?? [
            'input',
            'blur'
        ];

        all_inputs.forEach(input => {
            if (param.onload === true) validator_f(input);

            validation_events.forEach(event => {
                input.addEventListener(event, function() {
                    validator_f(input)
                })
            });
        });
  
    }
}