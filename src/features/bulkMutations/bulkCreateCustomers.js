import {runBulkMutation} from './bulkMutation';

export async function runBulkCreateCustomers(customers) {

    const formattedCustomers = customers.map(customer => {
        const newCustomer = {}

        if(customer.emailMarketingConsent){
            newCustomer.emailMarketingConsent = {...customer.emailMarketingConsent}
            delete customer.emailMarketingConsent
        }
        if(customer.smsMarketingConsent){
            newCustomer.smsMarketingConsent = {...customer.smsMarketingConsent}
            delete customer.smsMarketingConsent
        }

        newCustomer.input = customer

        return newCustomer
    })

    const mutation = `mutation customerCreate($input: CustomerInput!) {
            customerCreate(input: $input) {
                customer {
                    id
                    email
                    locale
                }
                userErrors {
                    field
                    message
                }
            }
        }`;

    const res = await runBulkMutation(mutation, formattedCustomers)

    return res
}
        

