export const formatDateTime = (datetime: string): string => {
    if (!datetime) return '-';

    const [datePart, timePart] = datetime.split('T');
    const [year, month, day] = datePart.split('-');

    const cleanTimePart = timePart.replace('Z', '').split('.')[0];
    const [hour, minute] = cleanTimePart.split(':');

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthName = monthNames[parseInt(month) - 1];
    return `${day} ${monthName} ${year}, ${hour}:${minute}`;
};

// export const formatDateOnly = (datetime: string): string => {
//     // For future use if we need date-only formatting
// };

// export const formatTimeOnly = (datetime: string): string => {
//     // For future use if we need time-only formatting
// };
