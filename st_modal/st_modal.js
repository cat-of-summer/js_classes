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