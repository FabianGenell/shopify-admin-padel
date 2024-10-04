import { runBulkMutation } from './bulkMutation';

export async function runBulkCreateCollections(collections) {
    const mutation = `mutation collectionCreate($input: CollectionInput!) {
        collectionCreate(input: $input) {
          collection {
            id
            availablePublicationCount
            handle
          }
          userErrors {
            field
            message
          }
        }
      }`;

    const res = await runBulkMutation(mutation, collections);

    return res;
}
