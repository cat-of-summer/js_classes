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

class st_cookie {

    /*
    params = {
        path,
        expires,
        domain,
        secure,
        sameSite
    }
    */
    static set(name, value, params = {}) {
        params = {
            path: '/',
            expires: 3600,
    
            ...params,
        };
      
        let cookie_string = encodeURIComponent(name) + "=" + encodeURIComponent(value);
      
        if (typeof params.expires === "number") {
            let date = new Date();
            date.setTime(date.getTime() + params.expires * 1000);
            params.expires = date;
        }
    
        cookie_string += "; expires=" + params.expires.toUTCString();
        cookie_string += "; path=" + params.path;
        if (params.domain) cookie_string += "; domain=" + params.domain;
        if (params.secure) cookie_string += "; secure";
        if (params.sameSite) cookie_string += "; samesite=" + params.sameSite;
      
        document.cookie = cookie_string;
    }

    static get(name) {
        let cookies_array = document.cookie.split(';');

        for (let i = 0; i < cookies_array.length; i++) {
            let cookie = cookies_array[i].trim();

            if (cookie.startsWith(name + '='))
                return decodeURIComponent(cookie.substring(name.length + 1));
        }

        return null;
    }

    static delete(name, path = '/') {
        document.cookie = `${name}=; path=${path}; expires=${new Date(0).toUTCString()}`;
    }

    /*
    params = {
        .set() params{},
        interval
    }
    */
    static callback(cookie_name, callback_func, params = {}) {
        params = {
            interval: null,
            delay: 0,
    
            ...params,
        };

        let interval = setInterval(() => {
            if (!st_cookie.get(cookie_name)) {
                setTimeout(() => {
                    callback_func();
                }, params.delay * 1000);
                st_cookie.set(cookie_name, true, params);
            }
        }, params.interval * 1000, cookie_name, callback_func, params)

        if (!params.interval)
            setTimeout(clearInterval, 1, interval);
    }
}
