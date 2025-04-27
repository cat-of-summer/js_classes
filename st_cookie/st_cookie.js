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
        interval,
        delay
    }
    */
    static callback(cookie_name, callback_func, params = {}) {
        params = {
            interval: 0,
            delay: 0,
    
            ...params,
        };

        let interval = setInterval(() => {
            if (!st_cookie.get(cookie_name)) {
                setTimeout(() => {
                    callback_func(cookie_name);
                }, params.delay * 1000);
                st_cookie.set(cookie_name, true, params);
            }
            if (!params.interval) clearInterval(interval);
        }, params.interval * 1000)
    }
}