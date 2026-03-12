export const isValidUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
};

export const isValidImageUrl = (url) => {
    if (!isValidUrl(url)) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    return imageExtensions.test(url);
};
