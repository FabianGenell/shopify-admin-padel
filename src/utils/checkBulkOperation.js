import { graphql } from './api';
import { notify } from './notifications';

export async function checkBulkOperation(type) {
    const bulkOperation = await runBulkdOperationQuery(type);

    const currentBulkOperation = bulkOperation.data.currentBulkOperation;

    const status = currentBulkOperation.status;

    if (status === 'RUNNING') {
        return setTimeout(() => {
            checkBulkOperation(type);
        }, 5000);
    }

    chrome.runtime.sendMessage({ type: 'bulkOperationCompleted', currentBulkOperation });

    const prettyType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

    notify({ message: `${prettyType} completed`, isError: status !== 'COMPLETED' });
}

function runBulkdOperationQuery(type) {
    const query = `query {
        currentBulkOperation(type: ${type}) {
           id
           status
           errorCode
           createdAt
           completedAt
           objectCount
           fileSize
           url
           partialDataUrl
        }
    }
    `;

    return graphql({ query });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'bulkOperationStart') {
        console.log('bulkOperationStart recieved', { message });
        const data = message.response.data;
        if (data) {
            const bulkOperationQuery = data.bulkOperationRunMutation || data.bulkOperationRunQuery;

            if (bulkOperationQuery.userErrors.length > 0) {
                notify({ message: bulkOperationQuery.userErrors[0].message, isError: true });
                chrome.runtime.sendMessage({ type: 'bulkOperationCompleted', currentBulkOperation: bulkOperationQuery });

                return bulkOperationQuery.userErrors.forEach((err) => console.error(err.message, err));
            }

            const type = bulkOperationQuery.bulkOperation.type;
            checkBulkOperation(type);
        } else {
            console.error('missing data in bulkOperation')
        }
    }
});
