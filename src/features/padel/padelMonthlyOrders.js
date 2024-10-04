import { fetchJSONL } from '../../utils/jsonl';
import { runBulkQuery } from '../bulkQueries/bulkQuery';
import * as XLSX from 'xlsx/xlsx.mjs';

/**
 * @typedef {Object} Order
 * @property {string} name - The name of the order.
 * @property {string} createdAt - The creation date of the order in ISO 8601 format.
 * @property {Object} currentTotalPriceSet - The current total price set of the order.
 * @property {Object} currentTotalPriceSet.shopMoney - The shop money details.
 * @property {string} currentTotalPriceSet.shopMoney.amount - The amount of the shop money.
 * @property {Object} totalShippingPriceSet - The total shipping price set of the order.
 * @property {Object} totalShippingPriceSet.shopMoney - The shop money details for shipping.
 * @property {string} totalShippingPriceSet.shopMoney.amount - The amount of the shop money for shipping.
 * @property {number} currentSubtotalLineItemsQuantity - The current subtotal line items quantity.
 * @property {string} currentTotalWeight - The current total weight of the order.
 * @property {Object} customer - The customer who made the order.
 * @property {string} customer.displayName - The display name of the customer.
 * @property {Object} shippingAddress - The shipping address for the order.
 * @property {string} shippingAddress.countryCodeV2 - The country code of the shipping address.
 * @property {?Object} nif - The metafield of the order, or null if there is none.
 * @property {String} nif.value - The value
 */

export function getPadelMonthlyOrders() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    function formatMonth(month) {
        if (month < 10) {
            return `0${month}`;
        }
        return month;
    }

    const query = `
    query {
        orders(query: "created_at:>='${year}-${formatMonth(month)}-1T00:00:00Z' AND created_at:<${year}-${formatMonth(month + 1)}-1T00:00:00Z") {
            edges {
                node {
                    name
                    createdAt
                    currentTotalPriceSet {
                        shopMoney {
                            amount
                        }
                    }
                    totalShippingPriceSet {
                        shopMoney {
                            amount
                        }
                    }
                    currentSubtotalLineItemsQuantity
                    currentTotalWeight
                    customer {
                        displayName
                    }
                    shippingAddress {
                        countryCodeV2
                    }
                    nif: metafield(key: "resident_id", namespace: "RESIDENT_ID_APP") {
                        value
                    }
                    intrastat: metafield(key: "intrastat", namespace: "custom") {
                        value
                    }
                    shippingLine {
                        title
                    }
                }
            }
        }
    }
    `;

    return runBulkQuery(query)
        .then((data) => createExcelFromData(data))
        .catch((error) => {
            console.error('An error occurred:', error);
        });
}

async function createExcelFromData(data) {
    const ordersRaw = await fetchJSONL(data.url);

    const orders = cleanOrderData(ordersRaw);

    const excelURL = generateExcel(orders);

    chrome.runtime.sendMessage({ type: 'download', url: excelURL, filename: getExcelName() });
}

function getExcelName() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const lastMonthString = lastMonth.toLocaleDateString('es', { month: 'long' });
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return `Reporte para ${capitalizeFirstLetter(lastMonthString)}.xlsx`;
}

function cleanOrderData(ordersRaw) {
    const distanceMap = new Map([
        ['BE', 1500],
        ['BG', 3000],
        ['CZ', 2200],
        ['DK', 2500],
        ['DE', 2300],
        ['EE', 3800],
        ['IE', 2300],
        ['GR', 3700],
        ['FR', 1200],
        ['HR', 2200],
        ['IT', 2000],
        ['CY', 4000],
        ['LV', 3500],
        ['LT', 3300],
        ['LU', 1700],
        ['HU', 2600],
        ['MT', 3000],
        ['NL', 1800],
        ['AT', 2400],
        ['PL', 2900],
        ['PT', 600],
        ['RO', 2600],
        ['SI', 2200],
        ['SK', 2700],
        ['FI', 4000],
        ['SE', 3200]
    ]);

    /**
     * Formats the order data.
     *
     * @param {Order} order - The order object.
     * @returns {Object} - The formatted order data.
     */
    function formatOrderData(order) {
        try {
            const country = order.shippingAddress ? order.shippingAddress?.countryCodeV2 : null;

            if (country == null || country == 'ES') {
                return null;
            }

            let shippingMethod = null;
            if (order.shippingLine != null && order.shippingLine?.title != null) {
                shippingMethod = order.shippingLine.title.includes('Express') ? '4.- AEREO' : '3.- CARRETERA';
            }

            const distanceBorder = country == 'PT' ? 300 : 445;
            const distance = distanceMap.get(country);

            if(distance == null) return null

            const dateCreatedString = new Date(order.createdAt).toLocaleDateString('es');

            return {
                'FECHA OPERACION': dateCreatedString,
                'NIF': order.nif?.value,
                'CLIENTES': order.customer.displayName,
                'IMPORTE': order.currentTotalPriceSet.shopMoney.amount,
                'ESTADO DESTINO': country,
                'PROVINCIA ORIGEN': 28,
                'CONDICIONES ENTREGA': 'DAP: ENTREGADO EN LUGAR CONVENIDO',
                'NATURALEZA DE LA TRANSACCION': '11: Compraventa en firme',
                'MODO TRANSPORTE': shippingMethod,
                'PUERTO CARGA/DESCARGA': 'VACIO',
                'CODIGO DE MERCANCIA': order.intrastat?.value,
                'REGIMEN ESTADISTICO': '2.- DEST.FINAL OTRO E.M.',
                'MASA NETA': order.currentTotalWeight / 1000,
                'UNIDADES': null,
                'IMPORTE TRANSPORTE Y SEGURO': order.totalShippingPriceSet.shopMoney.amount,
                'DISTANCIA DESDE ORIGEN A DESTINO': distance,
                'DISTANCIA DESDE ORIGEN A FRONTERA ESPAÑOLA': distanceBorder,
                'VALOR ESTADISTICO': '=O2*(Q2/P2)+D2'
            };
        } catch (error) {
            console.error("Couldn't formar order: ", order, error);
            return null;
        }
    }

    const orders = ordersRaw.map((order) => formatOrderData(order));

    return orders.filter((o) => o != null);
}

function generateExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    return url;
}
