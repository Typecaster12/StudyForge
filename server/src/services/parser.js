import pdf from 'pdf-parse';

/**
 * Extracts text from a PDF buffer.
 * @param {Buffer} dataBuffer 
 * @returns {Promise<string>}
 */
export async function extractText(dataBuffer) {
    try {
        const data = await pdf(dataBuffer);
        return cleanText(data.text);
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF');
    }
}

/**
 * Cleans extracted text (removes double spaces, etc.)
 * @param {string} text 
 * @returns {string}
 */
export function cleanText(text) {
    return text
        .replace(/\n\s*\n/g, '\n\n') // Remove excessive newlines
        .replace(/[ \t]+/g, ' ')     // Remove excessive spaces
        .trim();
}
