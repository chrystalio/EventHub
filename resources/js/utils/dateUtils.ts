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

export const formatDateTimeLong = (datetime: string): string => {
    if (!datetime) return '-';

    const [datePart, timePart] = datetime.split('T');
    const [year, month, day] = datePart.split('-');

    const cleanTimePart = timePart.replace('Z', '').split('.')[0];
    const [hour, minute] = cleanTimePart.split(':');

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate day of week (simplified)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayName = dayNames[date.getDay()];

    const monthName = monthNames[parseInt(month) - 1];
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;

    return `${dayName}, ${monthName} ${parseInt(day)}, ${year} at ${hour12}:${minute} ${ampm}`;
};

export const formatDateOnly = (datetime: string): string => {
    if (!datetime) return '-';

    const [datePart] = datetime.split('T');
    const [year, month, day] = datePart.split('-');

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthName = monthNames[parseInt(month) - 1];
    return `${monthName} ${parseInt(day)}, ${year}`;
};

export const formatTimeOnly = (datetime: string): string => {
    if (!datetime) return '-';

    const [, timePart] = datetime.split('T');
    const cleanTimePart = timePart.replace('Z', '').split('.')[0];
    const [hour, minute] = cleanTimePart.split(':');

    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;

    return `${hour12}:${minute} ${ampm}`;
};
