/**
 * Retrieves the current store from the URL.
 * @returns {string} The current store name.
 */
function getCurrentStore(){
    const currentURL = new URL(window.location.href);
    const parts  = currentURL.pathname.split('/')

    return parts[parts.indexOf('store') + 1]
}

/**
 * Executes a GraphQL query or mutation.
 * @param {Object} options - The options for the GraphQL request.
 * @param {string} [options.operationName] - The name of the operation.
 * @param {string} options.query - The GraphQL query or mutation.
 * @param {Object} [options.variables] - The variables for the GraphQL request.
 * @returns {Promise<Object>} - A promise that resolves to the JSON response from the GraphQL API.
 */
export async function graphql({ operationName, query, variables }) {
    const url = `https://admin.shopify.com/store/${getCurrentStore()}/admin/api/unversioned/graphql?operation=${operationName}`;

    const body = {
        variables: variables,
        query: query
    }

    
    if(operationName){
        body.operationName = operationName
    }
    
    const requestBody = JSON.stringify(body);

    return fetch(url, {
        headers: {
            'accept': 'application/json',
            'content-type': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        body: requestBody,
        method: 'POST'
    }).then((res) => res.json());
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'api') {
        console.log('Received message (api):', message);
        graphql(message.query)
            .then((response) => {
                sendResponse(response);
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
        return true; // indicates that the response will be sent asynchronously
    }
});