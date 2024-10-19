class st_mask {

    constructor(param) {

        let mask = [];
        let regexp = [];

        param.mask.match(/\{.*?\}|./g).forEach(match => {
            if (match.startsWith('{') && match.endsWith('}')) {
                regexp.push(match.slice(1, -1));
                mask.push(null);
            }
            else
                mask.push(match);
        });

        let apply_mask = function (input_array) {
            let counter = 0;
            return mask.map(mask_char => {
                return mask_char ?? input_array[counter++] ?? param.filler ?? '*';
            }).join('');
        }

        document.querySelectorAll(param.selector).forEach(input => {

            if (param.placeholder === true)
                input.value = apply_mask([]);

            if (param.onload === true)
                if (param.not_full) param.not_full(input);

            let input_array = [];

            input.addEventListener('input', event => {

                if (event.data === null)
                    input_array.pop();
                else
                    if ((input_array.length < regexp.length) &&
                        (new RegExp(regexp[input_array.length]).test(event.data)))
                            input_array.push(event.data);

                if (!input_array.length && !param.placeholder) 
                    input.value = '';
                else
                    input.value = apply_mask(input_array);

                if (input_array.length == regexp.length)
                    {if (param.full) param.full(input);}
                else
                    {if (param.not_full) param.not_full(input);}
            });
            input.addEventListener('blur', () => {
                if (input_array.length == regexp.length)
                    {if (param.full) param.full(input);}
                else
                    {if (param.not_full) param.not_full(input);}
            });
        });
    }
}