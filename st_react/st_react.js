class st_modal {

    static instance = Symbol();

    overlay;
    container;
    target;

    #state;
    
    static #find_element(param) {
        if (param instanceof Element) return param;
        
        try {
            return document.querySelector(param) || (() => {throw new Error();})()
        } catch {
            return document.body.appendChild((new DOMParser()).parseFromString(param, 'text/html').body.firstElementChild);
        }
    }

    static find(tag) {
        return tag[st_modal.instance];
    }

    /*
    params = {
        container,
        target,
        overlay,
        overlay_shading,
        overlay_blur,
        overlay_scroll_lock,
        zIndex,
        duration,
        location,
        position,
        overflow,
        close_by_out,
        close_by_esc,
        auto_close,
        close_button_attribute,
        state_attrubite,
        allow_interrupt,
        showing_state,
        shown_state,
        hiding_state,
        hidden_state,
        before_open,
        on_open,
        before_close,
        on_close
    }
    */
    constructor(params) {
        params = {
            zIndex: 1000,
            duration: 0.3,

            container: 'body',

            overlay: true,
            overlay_shading: 0.5,
            overlay_blur: '5px',
            overlay_scroll_lock: true,

            // target: `<div>123</div>`,
            location: 'center center',
            position: 'fixed',
            overflow: 'auto',

            close_by_out: true,
            close_by_esc: true,
            auto_close: -1,
            close_button_attribute: 'action="close"',
            
            state_attrubite: 'state',
            allow_interrupt: false,
            showing_state: 'showing',
            shown_state: 'shown',
            hiding_state: 'hiding',
            hidden_state: 'hidden',

            before_open: () => {},
            on_open: () => {},
            before_close: () => {},
            on_close: () => {},

            ...params
        };
        
        let modal_components_timer = [];
        let modal_components = [];
        let body_style;

        if (params.overlay) {
            params.zIndex++;

            this.overlay = document.createElement('overlay');
            this.overlay[st_modal.instance] = this;

            Object.assign(this.overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: `rgba(0, 0, 0, ${params.overlay_shading})`,
                backdropFilter: `blur(${params.overlay_blur})`,
                zIndex: params.zIndex,
                transition: `all ${params.duration}s`,
                display: 'none'
            });
            
            this.overlay.setAttribute(params.state_attrubite, params.hidden_state);

            if (params.close_by_out)
                this.overlay.addEventListener('click', () => this.hide());

            modal_components.push(this.overlay);
        }

        this.container = document.createElement('container');
        this.container[st_modal.instance] = this;

        Object.assign(this.container.style, {
            position: params.position,
            overflow: params.overflow,
            width: 'max-content',
            maxWidth: '100%',
            height: 'max-content',
            zIndex: params.zIndex + 1,
            transition: `all ${params.duration}s`,
            display: 'none',

            ...(() => {
                return {
                    'top left': { top: 0, left: 0 },
                    'top center': { top: 0, left: '50%', transform: 'translateX(-50%)' },
                    'top right': { top: 0, right: 0 },
                    'center left': { top: '50%', left: 0, transform: 'translateY(-50%)' },
                    'center center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
                    'center right': { top: '50%', right: 0, transform: 'translateY(-50%)' },
                    'bottom left': { bottom: 0, left: 0 },
                    'bottom center': { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
                    'bottom right': { bottom: 0, right: 0 }
                }[params.location];
            })()
        });

        this.container.setAttribute(params.state_attrubite, params.hidden_state);

        modal_components.push(this.container);
        
        this.target = st_modal.#find_element(params.target);
        this.target[st_modal.instance] = this;
        this.target.style.transition =  `all ${params.duration}s`;

        this.container.append(this.target);

        this.target.querySelectorAll(`[${params.close_button_attribute}]`).forEach(close_button => {
            close_button.addEventListener('click', () => this.hide());
        });
        
        if (params.close_by_out)
            document.addEventListener('click', (event) => {
                if (!this.container.contains(event.target)) this.hide();
            });

        if (params.close_by_esc)
            document.addEventListener('keydown', e => {
                if ((e.code === 'Escape' || e.keyCode === 27)) this.hide();
            });

        let toggle = (before_func, after_func, process, final, hide) => {
            before_func();
            modal_components.forEach((tag, index) => {
                clearTimeout(modal_components_timer[index]);
    
                tag.style.display = 'block';
    
                modal_components_timer[index] = setTimeout(() => {
                    this.#state = final;
                    tag.setAttribute(params.state_attrubite, this.state);
                    if (hide) tag.style.display = 'none';
                    after_func();
                }, params.duration * 1000);

                requestAnimationFrame(() => {
                    this.#state = process;
                    tag.setAttribute(params.state_attrubite, this.state);
                });
            });
        }

        this.show = (forced = false) => {
            if (
                this.#state == params.hidden_state ||
                (params.allow_interrupt && this.#state == params.hiding_state)
                || forced
            ) {
                toggle(params.before_open, params.on_open, params.showing_state, params.shown_state, false);

                if (params.overlay_scroll_lock && this.overlay) {
                    body_style = document.body.style;
                    body_style = {
                        position: body_style.position,
                        top: body_style.top,
                        left: body_style.left,
                        scroll_Y: window.scrollY || document.documentElement.scrollTop,
                        scroll_X: window.scrollX || document.documentElement.scrollLeft
                    };

                    Object.assign(document.body.style, {
                        position: 'fixed',
                        top: `-${body_style.scroll_Y}px`,
                        left:`-${body_style.scroll_X}px`,
                    });
                }

                if (params.auto_close > 0) {
                    clearTimeout(modal_components_timer[2]);

                    modal_components_timer[2] = setTimeout(() => {
                        this.hide(true);
                    }, params.auto_close * 1000);
                }
            }
        };

        this.hide = (forced = false) => {
            if (
                this.#state == params.shown_state ||
                (params.allow_interrupt && this.#state == params.showing_state)
                || forced
            ) {
                toggle(params.before_close, params.on_close, params.hiding_state, params.hidden_state, true)

                if (body_style) {
                    Object.assign(document.body.style, body_style);
                    window.scrollTo(body_style.scroll_X, body_style.scroll_Y);
                }
            }
        };

        this.#state = params.hidden_state;
                
        st_modal.#find_element(params.container).append(...modal_components);
    }
 
    get state() {return this.#state;}
}

class st_react extends HTMLElement {

    static #tag = 'st-react';
    static #prototype = {
        url: undefined,
        method: 'POST',

        before_attach: () => {},
        on_attach: () => {},
        on_detach: () => {},

        before_state_add: () => {},
        before_state_set: () => {},
        on_state_add: () => {},
        on_state_set: () => {},

        before_send: () => {},
        on_send: () => {},
        on_send_success: () => {},
        on_send_failed: () => {},
    };
  
    static {customElements.define(st_react.#tag, this)}

    static new() {
        return document.createElement(st_react.#tag);
    }

    static spoof(target) {
        let object = document.createElement(st_react.#tag);

        Array.from(target.attributes).forEach(attribute => object.setAttribute(attribute.name, attribute.value));

        object.replaceChildren(...target.childNodes);

        object.className = target.className;
        object.style.cssText = target.style.cssText;

        object.className = target.className;
        object.style.cssText = target.style.cssText;
        Object.assign(object.dataset, target.dataset);

        ['value','checked','selected'].forEach(p => p in target && (obj[p] = target[p]));
        
        target.replaceWith(object);

        return object;
    }

    #statements = {};
    #current_statement = null;
    #observers = {};

    constructor() {
        super();

        this.dispatchEvent(new CustomEvent('before_attach', {
            bubbles: false,
            cancelable: true
        }));
        this.state.before_attach();
    }

    get state() {
        return this.#current_statement !== null
            ? this.#statements[this.#current_statement]
            : st_react.#prototype;
    }

    set_observer(params) {
        params = {
            childList: true,
            attributes: true,
            subtree: true,

            observe_list: null,
            observe_mutation: null,

            ...params
        };

        if (typeof params.observe_list !== 'function' && typeof params.observe_mutation !== 'function') return;

        let result_observer = new MutationObserver((mutationsList, observer) => {
            if (params.observe_list)
                params.observe_list(mutationsList, observer);
            if (params.observe_mutation)
                mutationsList.forEach(mutation => observe_mutation(mutation, observer));
        });

        result_observer.observe(this, {
            childList: params.childList,
            attributes: params.attributes,
            subtree: params.subtree
        });

        return result_observer;
    }

    set_state(param1, param2 = null) {
        let old_state = this.#current_statement;
        let old_state_param = this.#statements[old_state];
    
        let setState = (key, data) => {
            this.dispatchEvent(new CustomEvent('before_state_add', {
                detail: {
                    key: key,
                    data: data
                },
                bubbles: false,
                cancelable: true
            }));
            this.state.before_state_add(key, data);
            this.#statements[key] = {...st_react.#prototype, ...data};
            this.dispatchEvent(new CustomEvent('on_state_add', {
                detail: {
                    key: old_state,
                    data: old_state_param
                },
                bubbles: false,
                cancelable: true
            }));
            this.state.on_state_add(old_state, old_state_param);
        };
    
        let setCurrentState = (key) => {
            this.dispatchEvent(new CustomEvent('before_state_set', {
                detail: {
                    key: key,
                    data: this.#statements[key]
                },
                bubbles: false,
                cancelable: true
            }));
            this.state.before_state_set(key, this.#statements[key]);
            this.#current_statement = key;
            this.dispatchEvent(new CustomEvent('on_state_set', {
                detail: {
                    key: old_state,
                    data: old_state_param
                },
                bubbles: false,
                cancelable: true
            }));
            this.state.on_state_set(old_state, old_state_param);
        };
    
        if (typeof param1 === 'string') {
            if (param2)
                setState(param1, param2);
            else if (param1 in this.#statements)
                setCurrentState(param1);
        } else if (typeof param1 === 'object') {
            setState(0, param1);
            setCurrentState(0);
        }
    }

    send(params = {}) {
        try {
            params = {
                url: this.state.url,
                method: this.state.method,
                data: this.dataset,

                before_send: this.state.before_send,
                on_send: this.state.on_send,
                on_send_success: this.state.on_send_success,
                on_send_failed: this.state.on_send_failed,

                ...params
            };

            let has_error = false;
            let handle_error = (error) => {
                if (!has_error) {
                    let error_data = {
                        status: request.status || undefined,
                        statusText: request.statusText || '',
                        response: error instanceof ProgressEvent ? request.responseText : error
                    };
                    this.dispatchEvent(new CustomEvent('on_send_failed', {
                        detail: error_data,
                        bubbles: false,
                        cancelable: true
                    }));
                    params.on_send_failed(error_data);
                    has_error = true;
                }
            };

            let request = new XMLHttpRequest();
    
            request.onreadystatechange = () => {
                if (request.readyState !== 4) return;
                if (request.status < 200 || request.status >= 300) return handle_error();

                let success_data = {
                    data: request.responseText,
                    request: request
                };

                this.dispatchEvent(new CustomEvent('on_send_success', {
                    detail: success_data,
                    bubbles: false,
                    cancelable: true
                }));
                params.on_send_success(...success_data);
            };
            
            request.onerror = handle_error;
    
            request.open(params.method, params.url, true);
    
            this.dispatchEvent(new CustomEvent('before_send', {
                bubbles: false,
                cancelable: true
            }));
            params.before_send();
            if (typeof params.data === 'object' && !(params.data instanceof FormData)) {
                request.setRequestHeader('Content-Type', 'application/json');
                request.send(JSON.stringify(params.data));
            } else
                request.send(params.data);

            this.dispatchEvent(new CustomEvent('on_send', {
                bubbles: false,
                cancelable: true
            }));
            params.on_send();
            
        } catch (error) {
            handle_error(error);
        }
    }

    connectedCallback() {
        this.dispatchEvent(new CustomEvent('on_attach', {
            bubbles: false,
            cancelable: true
        }));
        this.state.on_attach();
    }
  
    disconnectedCallback() {
        this.dispatchEvent(new CustomEvent('on_detach', {
            bubbles: false,
            cancelable: true
        }));
        this.state.on_detach();
    }
    
}
  
    
  