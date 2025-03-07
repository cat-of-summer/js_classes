class st_mask {
    
    #default_filler = '_';
    #placeholder = true;
    #mask_array = [];
    #inputs = [];

    #apply_mask(mask, input_string) {
        let result = "";
        let static_mask_index = 0;
        let dynamic_mask_index = 0;
    
        for (let char of input_string)
            while (dynamic_mask_index + static_mask_index < mask.length)
                if (!mask[dynamic_mask_index + static_mask_index][1])
                    result += mask[dynamic_mask_index + static_mask_index++][0];
                else {
                    if (new RegExp(`^${mask[dynamic_mask_index + static_mask_index][0]}$`).test(char)) {
                        result += char;
                        dynamic_mask_index++;
                    }
                    break;
                }
        
        if (this.#default_filler && this.#placeholder)
            while (dynamic_mask_index + static_mask_index < mask.length) {
                let [ value, is_regexp, default_filler] = mask[dynamic_mask_index + static_mask_index++];
                result += is_regexp ? default_filler : value;
            }
            
        return [result, dynamic_mask_index, mask.filter(mask_char => mask_char[1]).length == dynamic_mask_index];
    }

    #return_best_mask(raw_value) {
        let best_mask = null;

        this.#mask_array.map((mask) => this.#apply_mask(mask, raw_value)).forEach((value, index) => {
            if (!best_mask || value[1] > best_mask[0][1]) best_mask = [value, index];
        });

        return best_mask;
    }

    #prepare_mask(mask) {
        return mask.replace(/{(\d+)\*{([^}]*?)}(.*?)}/g, (_, g1, g2, g3) => (`{{${g2}}${g3}}`).repeat(g1))
            .split(/({{.*?}.*?})/)
            .filter(Boolean)
            .map(value => {
                let inner_value = value.match(/^{{(.*?)}.*?}$/);
                let filler = value.match(/^{{.*?}=(.*?)}$/);
                return [
                    inner_value
                        ? inner_value[1] 
                        : value,
                    !!inner_value,
                    filler
                        ? filler[1]
                        : this.#default_filler
                ];
            })
    }

    #refresh_masks() {
        this.#inputs.forEach(input_object => {
            input_object.best_mask = this.#return_best_mask(input_object.value);
            input_object.input.value = input_object.best_mask[0][0];
        });
    }

    add_mask(mask) {
        this.#mask_array.push(this.#prepare_mask(mask));

        this.#refresh_masks();

        return this.#mask_array.length - 1;
    }

    remove_mask(index) {
        delete this.#mask_array[index];

        this.#refresh_masks();
    }

    set_masks(masks) {
        this.#mask_array = masks.map((mask) => {
            return this.#prepare_mask(mask);
        });

        this.#refresh_masks();
    }

    constructor(param) {
        let $this = this;
        
        $this.#default_filler ??= param.default_filler;
        $this.#placeholder ??= param.placeholder;

        if (param.masks) {
            $this.set_masks(param.masks);
            $this.#refresh_masks();
        }

        document.querySelectorAll(param.selector).forEach(input => {

            let input_object = {
                input: input,
                value: input.value.split().filter(Boolean)
            };
                        
            input.addEventListener("input", (event) => {
                event.preventDefault();
                
                if ($this.#mask_array.length) {
                    if (event.data === null) {
                        let new_raw_value = [];

                        for (let char of input_object.value) {
                            new_raw_value.push(char);
                        
                            if (this.#apply_mask(this.#mask_array[input_object.best_mask[1]], new_raw_value)[1] == input_object.best_mask[0][1]) {
                                new_raw_value.pop();
                                break;
                            }
                        }
                        
                        input_object.value = new_raw_value;
                    } else 
                        input_object.value.push(...event.data);      

                    input_object.best_mask = $this.#return_best_mask(input_object.value);
                    input.value = input_object.best_mask[0][0];
                    
                    if (typeof param.callback === 'function')
                        param.callback(input, {
                            mask_id: input_object.best_mask[1], 
                            progress: input_object.best_mask[0][1], 
                            is_full: input_object.best_mask[0][2]
                        });
                } else
                    console.error('Нет масок для этого input-поля.');
            });

            $this.#inputs.push(input_object);
        });
    }

}