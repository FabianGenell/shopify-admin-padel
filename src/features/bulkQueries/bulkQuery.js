import { graphql } from '../../utils/api';
import { notify } from '../../utils/notifications';

/**
 * Starts a bulk query
 *
 * @param {string} query - The query to be run.
 * @returns {Promise} - A promise that resolves to the result of the bulk operation.
 */
export function bulkOperationRunQuery(query) {

    const bulkQuery = `mutation bulkOperationRunQuery($query: String!) {
      bulkOperationRunQuery(query: $query) {
        bulkOperation {
          id
          status
          type
        }
        userErrors {
          field
          message
        }
      }
    }
      `;

    const variables = {
        query
    };

    return graphql({ query: bulkQuery, variables });
}

/**
 * Runs a bulk query operation
 *
 * @param {string} query - The query to be performed.
 * @returns {Promise} - A promise that resolves with the result of the bulk query operation.
 */
export async function runBulkQuery(query) {
    const response = await bulkOperationRunQuery(query);

    if (response.errors) {
        const errors = Object.values(response.errors);
        notify({ message: errors[0], isError: true });
        return console.error(response.errors);
    }

    chrome.runtime.sendMessage({ type: 'bulkOperationStart', response });

    const responseData = response.data.bulkOperationRunQuery
    if(responseData.userErrors.length > 0){
      return console.error('Error running bulk query', responseData.userErrors)
    }
    return awaitResolveMessage(responseData.bulkOperation.id);
}

/**
 * Waits for a specific message with a matching ID to be received from the Chrome runtime.
 * Resolves the promise when the message is received.
 *
 * @param {string} id - The ID of the message to wait for.
 * @returns {Promise} - A promise that resolves when the message is received.
 */
function awaitResolveMessage(id) {
    return new Promise((resolve) => {
        chrome.runtime.onMessage.addListener(function listener(message, sender, sendResponse) {
            if (message.type === 'bulkOperationCompleted' && message.currentBulkOperation.id === id) {
                chrome.runtime.onMessage.removeListener(listener);
                resolve(message.currentBulkOperation);
            }
        });
    });
}
