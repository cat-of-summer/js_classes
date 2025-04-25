class st_validator {

	#validator = null;
    #targets = null;

    constructor(param) {

        this.#validator = function (input) {
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
                param.on_valid(input);
            else
                param.on_invalid(input);

            if (param.after_check) param.after_check(input);
        };

        this.#targets = document.querySelectorAll(param.selector);

        if (param.onload === true) this.apply;

        this.#targets.forEach(input => {
            (param.events ?? [
                'input',
                'blur'
            ]).forEach(event => {
                input.addEventListener(event, () => {
                    this.#validator(input)
                });
            });
        });
    }

	apply(selector = null) {
        (selector ? document.querySelectorAll(selector) : this.#targets)
            .forEach(this.#validator, this);
    }
}
