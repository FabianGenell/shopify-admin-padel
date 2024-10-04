import { HeltraButton } from '../utils/elements';
import { runBulkCreateCollections } from './bulkMutations/bulkCreateCollections';
import { runBulkCreateCustomers } from './bulkMutations/bulkCreateCustomers';
import { runBulkCreateProducts } from './bulkMutations/bulkCreateProducts';
import { getPadelMonthlyOrders } from './padel/padelMonthlyOrders';
import { getPadelPickingOrders } from './padel/padelPickingOrders';

/**
 * Adds a file input element to the specified container and attaches a change event listener.
 * When a file is selected, it reads the contents of the file and parses it using Papa.parse.
 * Finally, it invokes the provided callback function with the parsed data.
 *
 * @param {String} selector - The selector for container element to append the button input to.
 * @param {function} callback - The callback function to invoke with the parsed CSV.
 * @param {String} label - Button label.
 */
function addBulkMutationButton({ selector, container, callback, label }) {
    const button = new HeltraButton({ label, variant: 'secondary', classes: 'Better-Button__bulk', files: { accept: '.csv', callback: callback, loadingState: true } });
    button.append({ selector, container });
}

/**
 * @param {String} selector - The selector for container element to append the button input to.
 * @param {function} callback - The callback function to invoke.
 * @param {String} label - Button label.
 */
function addButton({ container, callback, label, variant = 'primary' }) {
    const button = new HeltraButton({ label, variant, callback });
    button.append({ container });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'pageLoaded') {
        const parent =
            document.querySelector(
                '#AppFrameMain div.Polaris-Page.Polaris-Page--fullWidth div.Polaris-Page-Header__RightAlign > div.Polaris-ActionMenu div.Polaris-ActionMenu-Actions__ActionsLayout'
            ) || document.querySelector('#AppFrameMain > div > div.Polaris-Page.Polaris-Page--fullWidth div.Polaris-LegacyCard div.Polaris-InlineStack');
        switch (message.path) {
/*             case 'customers':
                addBulkMutationButton({ container: parent, callback: runBulkCreateCustomers, label: 'Import customers' });
                break;
            case 'collections':
                addBulkMutationButton({
                    selector: '#AppFrameMain .Polaris-Box .Polaris-Page-Header__RightAlign',
                    callback: runBulkCreateCollections,
                    label: 'Import collections'
                });
                break;
            case 'products':
                addBulkMutationButton({ container: parent, callback: runBulkCreateProducts, label: 'Import products' });
                break; */
            case 'orders':
                addButton({ container: parent, callback: getPadelMonthlyOrders, variant: 'secondary', label: 'Get monthly order report' });
                addButton({ container: parent, callback: getPadelPickingOrders, label: 'Download Pickings' });
                break;
        }
    }

    if (message.type === 'bulkOperationCompleted') {
        document.querySelectorAll('.Better-Button__bulk').forEach((el) => (el.heltraButton.loading = false));
    }
});
