class st_validator{static#t(t,e,r,a){if(r){let o=new RegExp(r);return e||a?e&&a?t.hasAttribute(e)&&o.test(t[a]):(!e||o.test(t.getAttribute(e)))&&(!a||o.test(t[a])):o.test(t.value)}return!e||t.hasAttribute(e)}constructor(t){let e=document.querySelectorAll(t.selector);var r=function(e){t.validator&&!t.validator(e)||!st_validator.#t(e,t.attribute,t.regexp,t.property)?t.on_invalid(e):t.on_valid(e)};let a=t.events??["input","blur"];e.forEach((e=>{!0===t.onload&&r(e),a.forEach((t=>{e.addEventListener(t,(function(){r(e)}))}))}))}}