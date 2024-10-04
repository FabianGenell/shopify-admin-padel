/**
 * Parses a JSONL (JSON Lines) string into an array of JavaScript objects.
 *
 * @param {string} jsonlString - The JSONL string to parse.
 * @returns {Array} - An array of JavaScript objects parsed from the JSONL string.
 */
export function parseJSONL(jsonlString) {
    const lines = jsonlString.trim().split('\n');
    return lines.map((line) => JSON.parse(line));
}

/**
 * Converts an array of objects to JSONL format.
 * @param {array} data - The array of objects to convert.
 * @returns {string} - The data in JSONL format.
 */
export function arrayToJSONL(data) {
    const lines = data.map((item) => JSON.stringify(item));
    return lines.join('\n');
}

/**
 * Fetches a JSONL file from the specified URL.
 * @param {string} url - The URL of the JSONL file to fetch.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects parsed from the JSONL file.
 * @throws {Error} - If there is an HTTP error or if the JSONL file fails to parse.
 */
export function fetchJSONL(url) {
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then((text) => {
            try {
                return parseJSONL(text);
            } catch (error) {
                console.error('Failed to parse JSONL:', error);
                throw error;
            }
        })
        .catch((error) => {
            console.error('Failed to fetch JSONL:', error);
            throw error;
        });
}
