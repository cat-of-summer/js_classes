class st_select {
    constructor (selector = 'select') {
        document.querySelectorAll(selector).forEach(select => {
            let select_container = document.createElement('div');
            let options_container = document.createElement('div');

            select_container.setAttribute('type', 'select_container');
            select_container.style.cssText = 'display: inline-block; position: relative;';
            
            options_container.setAttribute('type', 'options_container');
            options_container.style.cssText = 'position: absolute; display: none; left: 0; top: 100%; width: 100%;';

            select.parentNode.insertBefore(select_container, select);
            select_container.append(select, options_container);

            select.addEventListener('mousedown', (event) => {
                event.preventDefault();
                options_container.style.display = options_container.style.display === 'block' ? 'none' : 'block';
            });

            document.addEventListener('click', (event) => {
                if (!select_container.contains(event.target))
                    options_container.style.display = 'none';
            });

            select.querySelectorAll('option').forEach(option => {
                options_container.appendChild(option);
                option.addEventListener('click', () => {
                    select.innerHTML = option.outerHTML;
                    options_container.style.display = 'none';
                });
            });

            let first_option = Array.from(options_container.children).find(option => !option.disabled);
            if (first_option) select.innerHTML = first_option.outerHTML;
        });
    }
}