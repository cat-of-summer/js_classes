class st_cookie_consent {

    #cookie_name = 'cookie_consent';
    #expiration = 60 * 60 * 24 * 365;
    #check_interval = 5000;
    
    #container_styles = {
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '0px',
        zIndex: 1000
    };

    #popup_id = null;
    #html = null;

    constructor(param) {

        this.#cookie_name ??= param.cookie_name;
        this.#expiration ??= +param.expiration;
        this.#check_interval ??= +param.check_interval;

        this.#popup_id = this.constructor.name+'_'+this.#generate_unique_prefix();

        this.#container_styles = {...this.#container_styles, ...param.styles};

        let selected_element = param.selector ? document.querySelector(param.selector) : null;
        if (selected_element) {
            this.#html = selected_element.outerHTML;
            selected_element.remove();
        } else if (param.html) {
            this.#html = param.html;
        } else
            throw new Error("Не передан ни селектор элемента, ни HTML");
        
        if (!this.#is_сonsent_given())
            this.#show_popup();
        
        this.#start_watching();
    }

    #is_сonsent_given() {
        return document.cookie.split('; ').some(cookie => cookie.startsWith(`${this.#cookie_name}=`));
    }

    #generate_unique_prefix() {
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        let result = '';
        for (let i = 0; i < 16; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    #show_popup() {
        if (document.getElementById(this.#popup_id)) return;

        let popup = document.createElement('div');
        popup.id = this.#popup_id;
        popup.innerHTML = this.#html;
        Object.assign(popup.style, this.#container_styles);

        document.body.appendChild(popup);

        popup.querySelectorAll('[action=accept_consent]').forEach((button) => {
            button.addEventListener('click', () => {
                this.#set_consent(true);
                popup.remove();
            });
        });

        popup.querySelectorAll('[action=reject_consent]').forEach((button) => {
            button.addEventListener('click', () => {
                this.#set_consent(false);
                popup.remove();
            });
        });

        popup.querySelectorAll('[action=necessary_consent]').forEach((button) => {
            button.addEventListener('click', () => {
                this.#set_consent('only_necessary');
                popup.remove();
            });
        });

    }

    #set_consent(value) {
        document.cookie = `${this.#cookie_name}=${value}; path=/; max-age=${this.#expiration}`;
    }

    #start_watching() {
        setInterval(() => {
            if (!this.#is_сonsent_given()) {
                this.#show_popup();
            }
        }, this.#check_interval);
    }
}