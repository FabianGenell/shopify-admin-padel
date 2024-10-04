import { runBulkMutation } from './bulkMutation';

export async function runBulkCreateProducts(products) {
    const mutation = `mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`;

    const res = await runBulkMutation(mutation, products);

    return res;
}
