import { readCSV } from './readCSV';
import { notify } from './notifications';

/**
 * @typedef {Object} ButtonOptions
 * @property {string} variant - The type of the button. Can only be "plain" | "primary" | "secondary" | "tertiary" | "monochromePlain"
 * @property {function} callback - What should happen when button is clicked
 * @property {string} label - The type of the button.
 * @property {Object} files - The files object
 * @property {string} files.accept - The types of files that the button should accept
 * @property {function} files.callback - What should happen when a file is selected
 * @property {Boolean} files.loadingState - Wether or not to show loading state once file is loaded
 */

/**
 * Represents a Button element.
 * @extends HTMLElement
 */
export class HeltraButton {
    /**
     * Creates a new Button instance.
     * @param {ButtonOptions} options - The options for the button.
     */
    constructor({ variant = 'primary', label = 'Button', callback, classes, files, container, append = true }) {
        this.variant = variant;
        this.label = label;



        this.button = document.createElement('button');

        const variantCaptialized = this.variant.charAt(0).toUpperCase() + this.variant.slice(1).toLowerCase();

        this.button.className = `Better-Button ${classes} Polaris-Button Polaris-Button--variant${variantCaptialized} Polaris-Button--pressable Polaris-Button--sizeMedium Polaris-Button--textAlignCenter`;

        this.button.innerHTML = `<span>${this.label}</span>`;

        this.button.heltraButton = this;

        if (typeof callback === 'function') {
            this.callback = callback;
            this.id = this.generateID();
            this.button.id = this.id;
        }

        if (files) {
            this.files = files;
            this.createFileInput();
        } else if (this.callback) {
            this.button.addEventListener('click', this.handleClick.bind(this));
        }

        if (container && append === true) {
            this.append({ container });
        }
    }

    set loading(value) {
        if (value) {
            this.button.classList.add('Polaris-Button--disabled', 'Polaris-Button--loading');
            this.addSpinner();
        } else {
            this.button.classList.remove('Polaris-Button--disabled', 'Polaris-Button--loading');
            this.button.querySelector('.Polaris-Button__Spinner').remove();
        }
        this.disabled = value;
    }

    async handleClick() {
        this.loading = true;
        try {
            await this.callback();
        } catch (error) {
            this.loading = false;
            notify({ message: `Error performing ${this.callback.name}`, isError: true });

            throw new Error(error);
        }
        this.loading = false;
    }

    generateID() {
        return 'button-' + this.callback.name;
    }

    addSpinner() {
        const spinner = document.createElement('span');
        spinner.classList = 'Polaris-Button__Spinner';
        spinner.innerHTML =
            '<span class="Polaris-Spinner Polaris-Spinner--sizeSmall"><svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7.229 1.173a9.25 9.25 0 1011.655 11.412 1.25 1.25 0 10-2.4-.698 6.75 6.75 0 11-8.506-8.329 1.25 1.25 0 10-.75-2.385z"></path></svg></span>';
        this.button.prepend(spinner);
    }

    createFileInput() {
        if (!this.files.accept) return console.warn(`Missing file type`);

        this.fileInput = document.createElement('input');

        this.fileInput.type = 'file';
        this.fileInput.accept = this.files.accept;
        this.fileInput.style.display = 'none';

        this.button.addEventListener('click', () => this.fileInput.click());

        this.fileInput.addEventListener('change', (event) => {
            if (this.files.accept === '.csv') {
                readCSV(event.target.files[0]).then((res) => {
                    if (this.files.loadingState) {
                        this.loading = true;
                    }
                    this.files.callback(res);
                });
            } else {
                this.files.callback(event);
            }
        });
    }

    /**
     * Appends the button and file input elements to the specified container.
     * @param {Object} options - The options for appending the elements.
     * @param {HTMLElement} options.container - The container element to append the elements to.
     * @param {string} options.selector - The CSS selector for the container element.
     */
    append({ container, selector }) {
        this.container = container || document.querySelector(selector);

        if (!this.container) return console.warn('Missing container');
        if (this.container.querySelectorAll(`#${this.id}`).length > 0) return console.warn('Container already has button', this.id);

        this.container.appendChild(this.button);

        if (this.fileInput) {
            this.container.appendChild(this.fileInput);
        }
    }
}
