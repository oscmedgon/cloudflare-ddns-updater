/**
 *
 * @param {String} message - Message body.
 * @param {"info" | "warning" | "error"} kind - Defines the kind of log
 */
export function logger(message, kind = 'info') {
    const date = new Date()
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const seconds = date.getSeconds();

    const printableDate = `${month}/${day}/${year} - ${hour}:${minute}:${seconds}`

    const finalMessage = `${kind.toUpperCase()}: ${printableDate} - ${message}`
    if (kind === 'error') {
        console.error(finalMessage);
    } else if (kind === 'warning') {
        console.warn(finalMessage);
    } else {
        console.info(finalMessage);
    }
}
