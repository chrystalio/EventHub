const getLocalDate = (datetime: string): Date | null => {
    if (!datetime) return null;
    const isoDatetime = datetime.replace(' ', 'T');
    return new Date(isoDatetime);
};

export const formatDateTime = (datetime: string): string => {
    const date = getLocalDate(datetime);
    if (!date) return '-';

    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatDateTimeLong = (datetime: string): string => {
    const date = getLocalDate(datetime);
    if (!date) return '-';

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };
    const formatted = new Intl.DateTimeFormat('en-US', options).format(date);
    return formatted.replace(' at', ' at');
};

export const formatDateOnly = (datetime: string): string => {
    const date = getLocalDate(datetime);
    if (!date) return '-';

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatTimeOnly = (datetime: string): string => {
    const date = getLocalDate(datetime);
    if (!date) return '-';

    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
};
