import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { graphql } from '../../utils/api';

function createPDF(arrays, extras) {
    const doc = createPDFFromTables(arrays, extras);

    doc.save(`Pickings ${new Date().toLocaleString('es')}.pdf`);
}

function createPDFFromTables(arrays, extras) {
    const doc = new jsPDF();

    const addOrderNumbersToPDF = () => {
        doc.setFontSize(8);
        doc.text(`Orden: ${extras.firstOrder} - ${extras.lastOrder}`, 4, 4);
    };

    const createTable = (arr) => {
        console.log('creating table', arr);
        if (arr.length === 0) return;
        const finalY = doc.lastAutoTable.finalY + 20 || 10;
        const pdfArray = arr.map((entry) => Object.values(entry));
        const head = Object.keys(arr[0]) || ['Cantidad', 'Orden en Almacén', 'SKU', 'Nombre'];
        doc.autoTable({
            startY: finalY,
            head: [head],
            body: pdfArray,
            didDrawPage: addOrderNumbersToPDF
        });
    };

    arrays.forEach((arr) => createTable(arr));

    return doc;
}

function getOrders() {
    const query = `query {
        orders(first: 150, query: "status:OPEN AND financial_status:PAID AND NOT return_status:IN_PROGRESS AND tag_not:'REVER returns'", sortKey: CREATED_AT, reverse:false) {
          nodes {
            id
            createdAt
            name
            note: metafield(namespace: "ADDITIONAL_NOTES", key: "additional_notes") {
                value
            }
            lineItems(first: 100) {
              nodes {
                product {
                  id
                  title
                  ordenAlmacen: metafield(namespace: "custom", key: "orden_almacen") {
                    value
                  }
                }
                quantity
                sku
                name
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
      }`;
    return graphql({ query });
}

function getFlatLineItemsArray(orders) {
    return orders.flatMap((order) => {
        //console.log({lineItems: order.lineItems.edges})
        const lineItems = order.lineItems.nodes.filter((lineItem) => lineItem.product != null);

        return lineItems.map((lineItem) => {
            lineItem.orderAlmacen = lineItem.product.ordenAlmacen?.value.replace(',', '.');
            lineItem.orderName = order.name
            lineItem.customAttributes = lineItem.customAttributes.filter(attr => attr.key[0] !== '_')
            delete lineItem.product;
            return lineItem;
        });
    });
}

function mergeLineItemsByKey(lineItems, mergeKey) {
    return lineItems.reduce((accumulator, lineItem) => {
        const alreadyExistingLineItem = accumulator.find((item) => item[mergeKey] === lineItem[mergeKey]);

        if (alreadyExistingLineItem) {
            alreadyExistingLineItem.quantity = alreadyExistingLineItem.quantity + lineItem.quantity;
        } else {
            accumulator.push(lineItem);
        }

        return accumulator;
    }, []);
}

function getOrganizedLineItems(lineItemArray) {
    const mergedLineItemsByName = mergeLineItemsByKey(lineItemArray, 'name');

    const sortedLineItemsByAlmacen = mergedLineItemsByName.sort((a, b) => (a.orderAlmacen || 0) - (b.orderAlmacen || 0));

    return sortedLineItemsByAlmacen.map(lineItem => {
        return {
            'Quantity': lineItem.quantity,
            'SKU': lineItem.sku,
            'Name': lineItem.name,
            'Almacen': lineItem.orderAlmacen
        }
    });
}

function getOrderNotes(orders) {
    return orders
        .filter((order) => order.note != null)
        .map((order) => {
            return { Order: order.name, Date: order.createdAt, Note: order.note.value };
        });
}

function getCustomAttributeProducts(lineItems) {
    const attributeLineItems = lineItems.filter((lineItem) => lineItem.customAttributes.length > 0);

    return attributeLineItems.map((lineItem) => {
        const item = {
            Product: lineItem.name,
            SKU: lineItem.sku,
            Order: lineItem.orderName
        };

        for (const attribute of lineItem.customAttributes) {
            item[attribute.key] = attribute.value;
        }

        return item;
    });
}

export async function getPadelPickingOrders() {
    const data = await getOrders();
    console.log(data);
    const orders = data.data.orders.nodes;

    const firstOrder = orders[0].name;

    const lastOrder = orders[orders.length - 1].name;

    const lineItems = getFlatLineItemsArray(orders);

    const lineItemArr = getOrganizedLineItems(lineItems);

    const orderNotes = getOrderNotes(orders);

    const customAttributeProducts = getCustomAttributeProducts(lineItems);

    console.log({ lineItemArr, orderNotes, customAttributeProducts });

    createPDF([orderNotes, customAttributeProducts, lineItemArr], { firstOrder, lastOrder });
}
