class st_validator {

    constructor(param) {

        let validator_f = function (input) {
            if ((param.validator ? param.validator(input) : true) &&
                ((() => {
                if (param.regexp) {
                    let regexp_obj = new RegExp(param.regexp);
        
                    if (!param.attribute && !param.property)
                        return regexp_obj.test(input.value);
        
                    if (param.attribute && param.property)
                        return input.hasAttribute(param.attribute) && regexp_obj.test(input[param.property]);
        
                    return (param.attribute ? regexp_obj.test(input.getAttribute(param.attribute)) : true) && (param.property ? regexp_obj.test(input[param.property]) : true);
                } else {
                    return param.attribute ? input.hasAttribute(param.attribute) : true;
                }
            })()))
                param.on_valid(input)
            else
                param.on_invalid(input)
        };

        document.querySelectorAll(param.selector).forEach(input => {
            if (param.onload === true) validator_f(input);

            (param.events ?? [
                'input',
                'blur'
            ]).forEach(event => {
                input.addEventListener(event, () => {
                    validator_f(input)
                });
            });
        });
  
    }
}