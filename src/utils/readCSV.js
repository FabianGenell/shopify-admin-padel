import Papa from 'papaparse';

export async function readCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target.result;
            Papa.parse(contents, {
                header: true,
                complete: (results) => resolve(cleanResults(results.data)),
                error: (error) => reject(error)
            });
        };
        reader.readAsText(file);
    });
}

const cleanResults = (arr) =>
    arr.map((entry) => {
        const entryWithSubObjects = createSubObjects(entry);

        return createObjectArrays(entryWithSubObjects);
    });

function createSubObjects(inputArray) {
    const output = {};

    Object.keys(inputArray).forEach((key) => {
        if (inputArray[key] === '') return;
        let current = output;
        const parts = key.split(']').filter(Boolean);
        parts.forEach((part, index) => {
            part = part.replace(/^\[/, '');
            if (index < parts.length - 1) {
                current[part] = current[part] || {};
                current = current[part];
            } else {
                current[part] = inputArray[key];
            }
        });
    });

    return output;
}

function createObjectArrays(inputObject) {
    const newCustomer = {};
    Object.keys(inputObject).forEach((key) => {
        const value = inputObject[key];
        if (key.includes('address')) {
            newCustomer.addresses = newCustomer.addresses || [];
            newCustomer.addresses.push(value);
        } else if (key.includes('metafield')) {
            newCustomer.metafields = newCustomer.metafields || [];
            newCustomer.metafields.push(value);
        } else {
            newCustomer[key] = value;
        }
    });
    return newCustomer;
}
