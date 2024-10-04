import { graphql } from '../../utils/api.js';
import { arrayToJSONL } from '../../utils/jsonl.js';

/**
 * Uploads a JSONL file to Shopify using the provided array.
 *
 * @param {Array} array - The array to be converted to JSONL and uploaded.
 * @returns {Object} - An object containing the staged upload path and target information.
 */
export async function uploadJSONLFile(array) {
    const fileContent = arrayToJSONL(array);

    const stagedUpload = await stagedUploadsCreate('metafieldVariables.jsonl');

    const stagedTarget = stagedUpload.data.stagedUploadsCreate.stagedTargets[0];

    await uploadFile(stagedTarget, fileContent);

    const stagedUploadPath = stagedTarget.parameters.find(({ name }) => name === 'key').value;

    return { stagedUploadPath, stagedTarget };
}

/**
 * Creates a staged upload for a given file name.
 * @param {string} fileName - The name of the file to be uploaded.
 * @returns {Promise} - A promise that resolves to the result of the GraphQL mutation.
 */
export function stagedUploadsCreate(fileName) {
    const query = `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
        }
      }`;

    const variables = {
        input: [
            {
                filename: fileName,
                mimeType: 'text/jsonl',
                httpMethod: 'POST',
                resource: 'BULK_MUTATION_VARIABLES'
            }
        ]
    };

    return graphql({ query, variables });
}

export async function uploadFile(stagedTarget, fileContent) {
    const formData = new FormData();
    stagedTarget.parameters.forEach((param) => {
        formData.append(param.name, param.value);
    });
    const fileBlob = new Blob([fileContent], { type: 'text/jsonl' });
    formData.append('file', fileBlob);

    const response = await fetch(stagedTarget.url, { method: 'POST', body: formData });

    return response.text();
}

/**
 * Creates a bulk mutation for creating metafields.
 *
 * @param {string} stagedUploadPath - The path to the staged upload.
 * @returns {Promise} - A promise that resolves to the result of the bulk operation.
 */
export function bulkOperationRunMutation(mutation, stagedUploadPath) {
    const query = `mutation bulkOperationRunMutation($mutation: String!, $stagedUploadPath: String!) {
        bulkOperationRunMutation(mutation: $mutation, stagedUploadPath: $stagedUploadPath) {
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
        mutation,
        stagedUploadPath
    };

    return graphql({ query, variables });
}

/**
 * Runs a bulk mutation operation on an array of data.
 *
 * @param {string} mutation - The mutation to be performed.
 * @param {Array} array - The array of data to be mutated.
 * @returns {Promise} - A promise that resolves with the result of the bulk mutation operation.
 */
export async function runBulkMutation(mutation, array) {
    const { stagedUploadPath } = await uploadJSONLFile(array);

    const response = await bulkOperationRunMutation(mutation, stagedUploadPath);

    chrome.runtime.sendMessage({ type: 'bulkOperationStart', response });

    return response;
}
