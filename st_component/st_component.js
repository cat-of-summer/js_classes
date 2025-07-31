class st_component extends HTMLElement {
    static {customElements.define('st-component', this)}

    static #intersection_events = [
        'visible',
        'on_visible',
        'on_visible_full',
        'on_hide_full'
    ];
    static #mutation_events = [
        'mutation_list',
        'mutation',
    ];
    static #custom_events = {
        scroll: (tag, handler) => {
            return (event) => {
                event.detail = tag.scrollHeight > tag.clientHeight
                    ? (tag.scrollTop / (tag.scrollHeight - tag.clientHeight)) * 100
                    : 100;
                handler.call(tag, event);
            }
        }
    };

    static #static_statements = {
        0: {
            url: undefined,
            method: 'POST',
            events: {
                on_send_failed: [(event) => console.error(event.detail)],
            }
        }
    };

    static #states_composition(...states) {
        return states.reduce((acc, state) => {
            return {
                ...acc,
                ...state,
                events: {
                ...(acc.events || {}),
                ...(state.events || {})
                }
            };
          }, {});
    }
 
    static add_state(state_name, state) {
        if (state.events)
            Object.keys(state.events).forEach(e => state.events[e] = [].concat(state.events[e]));

        st_component.#static_statements[state_name] = st_component.#states_composition(st_component.#static_statements[0], state);
    }

    static add_state_map(statements) {
        Object.entries(statements).forEach(([state_name, state]) => {
            st_component.add_state(state_name, state);
        });
    }

    static delete_state(state_name) {
        delete st_component.#static_statements[state_name];
    }

    #events = {};
    #statements = {};
    #current_state = 0;

    #intersection_observer = null;
    #mutation_observer = null;

    #throw_event(event_name, detail = undefined) {
        this.dispatchEvent(new CustomEvent(event_name, {
            detail: detail,
        }));
    }
    
    constructor() {super()}

    connectedCallback() {
        let state_name = this.getAttribute('state') ?? 0;
        let data = {
            ...st_component.#static_statements[state_name],
            ...Object.fromEntries(
                Array.from(this.attributes)
                    .filter(a => a.name.startsWith('state-'))
                    .map(a => [ a.name.slice(6), a.value ])
            )
        };

        (new MutationObserver((records, obs) => {
            if (this.childNodes.length) {
                this.set_state(state_name, data);
                this.#current_state = state_name;

                this.#throw_event('on_attach');

                obs.disconnect();
            }
          })).observe(this, { childList: true });
    }

    disconnectedCallback() {
        this.#throw_event('on_detach');

        if (this.#intersection_observer) {
            this.#intersection_observer.disconnect();
            this.#intersection_observer = null;
        }

        if (this.#mutation_observer) {
            this.#mutation_observer.disconnect();
            this.#mutation_observer = null;
        }
    }

    addEventListener(event, handler, options) {
        if (st_component.#intersection_events.includes(event) && !this.#intersection_observer) {
            this.#intersection_observer = new IntersectionObserver(([entry], observer) => {
                let ratio = entry.intersectionRatio;
        
                let event_params = {
                    ratio: ratio,
                    observer: observer
                }; 
                
                this.#throw_event('visible', event_params);

                if (ratio === 0)
                    this.#throw_event('on_hide_full', event_params);
                else if (ratio === 1)
                    this.#throw_event('on_visible_full', event_params);
                else
                    this.#throw_event('on_visible', event_params);
            
            }, {
                root: null,
                threshold: [0, 1]
            });
        
            this.#intersection_observer.observe(this);
        }

        if (st_component.#mutation_events.includes(event) && !this.#mutation_observer) {
            this.#mutation_observer = new MutationObserver((mutations_list, observer) => {

                this.#throw_event('mutation_list', {
                    observer: observer,
                    mutations_list: mutations_list
                });

                mutations_list.forEach(mutation => this.#throw_event('mutation', {
                    observer: observer,
                    mutations: mutation
                }));

            });
        
            this.#mutation_observer.observe(this, {
                childList: true,
                attributes: true,
                subtree: true
            });
        }

        if (st_component.#custom_events[event]) {
            handler = st_component.#custom_events[event](this, handler);
        }
        
        let bound = handler.name
            ? handler
            : handler.bind(this);
        
        if (!this.#events[event]) this.#events[event] = [];
            this.#events[event].push(bound);

        super.addEventListener.call(this, event, bound, options);
    }

    removeEventListener(event, handler, options) {
        this.#events[event] = this.#events[event].filter(bound => bound !== handler);

        super.removeEventListener.call(this, event, handler, options);

        if (!Object.keys(this.#events).some(key => st_component.#intersection_events.includes(key)) && this.#intersection_observer) {
            this.#intersection_observer.disconnect();
            this.#intersection_observer = null;
        }

        if (!Object.keys(this.#events).some(key => st_component.#mutation_events.includes(key)) && this.#mutation_observer) {
            this.#mutation_observer.disconnect();
            this.#mutation_observer = null;
        }
    }

    add_state(state_name, state) {
        this.#throw_event('before_state_add', {
            state_name: state_name,
            state_data: state
        });

        if (state.events)
            Object.keys(state.events).forEach(event => state.events[event] = [].concat(state.events[event]));

        this.#statements[state_name] = st_component.#states_composition(st_component.#static_statements[0], state);

        this.#throw_event('on_state_add', {
            state_name: state_name,
            state_data: this.#statements[state_name]
        });
    }

    add_state_map(statements) {
        Object.entries(statements).forEach(([state_name, state]) => {
            this.add_state(state_name, state);
        });
    }

    set_state(param1, param2 = null) {
        let _set_state = (state_name) => {

            this.#throw_event('before_state_set', {
                state_name: state_name,
                state_data: this.#statements[state_name]
            });

            this.#current_state = state_name;
            Object.entries(this.#statements[state_name]).forEach(([key, value]) => {
                if (key === 'events')
                    Object.entries(value).forEach(([event, handlers]) => {
                        (this.#events[event] ?? []).forEach(handler => this.removeEventListener(event, handler));
  
                        handlers.forEach(handler => this.addEventListener(event, handler));
                    });
                else this[key] = value;
            });

            this.#throw_event('on_state_set', {
                state_name: state_name,
                state_data: this.#statements[state_name]
            });
        };
    
        let [key, data] = typeof param1 === 'string'
            ? [param1, param2]
            : [0,      param1];


        if (data) this.add_state(key, data)

        if (!this.#statements[key] && st_component.#static_statements[key])
            this.add_state(key, st_component.#static_statements[key]);
    
        if (this.#statements[key]) _set_state(key);
    }
    
    save_state(state_name = this.#current_state) {
        this.#throw_event('before_state_save', {
            state_name: state_name,
            state_data: this.#statements[state_name]
        });

        this.#statements[state_name] = {
            ...Object.fromEntries(
                Object.entries(this.#statements[this.#current_state]).map(([key, value]) => [
                    key,
                    this[key] ?? value
                ])
            ),
            events: {
                ...Object.fromEntries(
                    Object.entries(this.#events).map(([event, handler]) => [
                        event,
                        handler
                    ])
                )
            }
        };

        this.#throw_event('on_state_save', {
            state_name: state_name,
            state_data: this.#statements[state_name]
        });
    }
    
    send(params = {}) {

        let has_error = false;
        let handle_error = (error = {}) => {
            if (!has_error) {
                this.#throw_event('on_send_failed',
                    error instanceof XMLHttpRequest
                        ? {
                            status: error.status ,
                            statusText: error.statusText,
                            response: error.responseText
                        }
                        : {
                            status: undefined,
                            statusText: '',
                            response: error
                        },
                );

                has_error = true;
            }
        };

        try {
            params = {
                url: this.url,
                method: this.method,
                data: this.dataset,

                ...params
            };

            let request = new XMLHttpRequest();
    
            request.onreadystatechange = () => {
                if (request.readyState !== 4) return;
                if (request.status < 200 || request.status >= 300) return handle_error(request);

                this.#throw_event('on_send_success', {
                    data: request.responseText,
                    request: request
                });

            };
            
            request.onerror = handle_error;
    
            request.open(params.method, params.url, true);
    
            this.#throw_event('before_send', params);

            if (typeof params.data === 'object' && !(params.data instanceof FormData)) {
                request.setRequestHeader('Content-Type', 'application/json');
                request.send(JSON.stringify(params.data));
            } else
                request.send(params.data);

            
            this.#throw_event('on_send', {
                detail: params,
            });

        } catch (error) {
            handle_error(error);
        }
    }
}