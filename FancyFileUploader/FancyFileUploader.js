class FancyFileUploader {
  constructor({
    target_selector,
    draggble_zone_selector,
    add_button_selector,
    files_list_selector,
    file_template,
    max_files = 0,
    max_file_size = 0,      // в байтах, 0 — без лимита на единичный файл
    max_total_size = 0,     // в байтах, 0 — без лимита на все файлы
    input_name = 'files[]',
    human_readable_size = false
  }) {
    this.targets = document.querySelectorAll(target_selector);
    this.draggble_selector = draggble_zone_selector;
    this.add_button_selector = add_button_selector;
    this.files_list_selector = files_list_selector;
    this.max_files = max_files;
    this.max_file_size = max_file_size;
    this.max_total_size = max_total_size;
    this.input_name = input_name;
    this.human_readable_size = human_readable_size;

    // Поддержка селектора или строки шаблона
    let templateHTML;
    try {
      const templateNodes = document.querySelectorAll(file_template);
      if (templateNodes.length > 0) {
        templateHTML = templateNodes[0].outerHTML;
        templateNodes.forEach(el => el.remove());
      } else {
        templateHTML = file_template;
      }
    } catch {
      templateHTML = file_template;
    }
    this.file_template = templateHTML;

    // Инициализируем каждый таргет
    this.targets.forEach(target => this.initTarget(target));
  }

  initTarget(target) {
    target.fileCount = 0;
    target.totalSize = 0;
    const dropZones = target.querySelectorAll(this.draggble_selector);
    const addButtons = target.querySelectorAll(this.add_button_selector);
    const fileList = target.querySelector(this.files_list_selector);
    if (!fileList) return;

    const handleFiles = (files) => {
      Array.from(files).forEach(file => {
        // проверка по количеству
        if (this.max_files > 0 && target.fileCount >= this.max_files) {
          alert(`Максимум файлов: ${this.max_files}`);
          return;
        }
        // проверка по размеру одного файла
        if (this.max_file_size > 0 && file.size > this.max_file_size) {
          alert(`Файл "${file.name}" слишком большой! Максимум ${this.formatSize(this.max_file_size)}.`);
          return;
        }
        // проверка по общей сумме файлов
        if (this.max_total_size > 0 && target.totalSize + file.size > this.max_total_size) {
          alert(`Превышен общий лимит! Максимальная сумма всех файлов ${this.formatSize(this.max_total_size)}.`);
          return;
        }

        const entry = this.createFileEntry(file, target);
        fileList.appendChild(entry);
        target.fileCount++;
        target.totalSize += file.size;
      });
    };

    // Drag'n'drop
    dropZones.forEach(zone => {
      ['dragenter', 'dragover'].forEach(evt => zone.addEventListener(evt, e => {
        e.preventDefault(); zone.classList.add('dragover');
      }));
      ['dragleave', 'drop'].forEach(evt => zone.addEventListener(evt, e => {
        e.preventDefault(); zone.classList.remove('dragover');
      }));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      });
    });

    // Кнопка добавления
    addButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (this.max_files > 0 && target.fileCount >= this.max_files) {
          alert(`Максимум файлов: ${this.max_files}`);
          return;
        }
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.multiple = this.max_files !== 1;
        fileInput.addEventListener('change', () => handleFiles(fileInput.files));

        document.body.appendChild(fileInput);
        fileInput.click();
      });
    });
  }

  formatSize(size) {
    if (!this.human_readable_size) return (size / 1024).toFixed(1) + ' КБ';
    const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024; i++;
    }
    return size.toFixed(1) + ' ' + units[i];
  }

  createFileEntry(file, target) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.file_template.trim();
    const entry = wrapper.firstElementChild;

    // Сохраняем размер для последующего вычета
    entry.dataset.size = file.size;

    const previewEls = entry.querySelectorAll('img[preview]');
    const filenameEls = entry.querySelectorAll('[filename]');
    const weightEls = entry.querySelectorAll('[fileweight]');
    const deleteBtns = entry.querySelectorAll('[delete_button]');

    // Превью изображений
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => previewEls.forEach(el => el.src = e.target.result);
      reader.readAsDataURL(file);
    } else {
      previewEls.forEach(el => el.remove());
    }

    filenameEls.forEach(el => el.textContent = file.name);
    weightEls.forEach(el => el.textContent = this.formatSize(file.size));

    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        entry.remove();
        target.fileCount = Math.max(0, target.fileCount - 1);
        target.totalSize = Math.max(0, target.totalSize - parseInt(entry.dataset.size));
      });
    });

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'file';
    let name = this.input_name;
    if (this.max_files !== 1) {
      if (!name.endsWith('[]')) name += '[]';
    } else {
      if (name.endsWith('[]')) name = name.slice(0, -2);
    }
    hiddenInput.name = name;
    hiddenInput.style.display = 'none';

    const dt = new DataTransfer();
    dt.items.add(file);
    hiddenInput.files = dt.files;
    entry.appendChild(hiddenInput);

    return entry;
  }
}

// Пример инициализации:
// new FancyFileUploader({
//   target_selector: '.upload-wrapper',
//   draggble_zone_selector: '.drop-zone',
//   add_button_selector: '.add-file-btn',
//   files_list_selector: '.file-list',
//   file_template: '#file-template',
//   max_files: 5,
//   max_file_size: 10 * 1024 * 1024, // 10 MB
//   max_total_size: 50 * 1024 * 1024, // 50 MB total
//   input_name: 'UF_PRODUCT_FILES[]',
//   human_readable_size: true
// });
