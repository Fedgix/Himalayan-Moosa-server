import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (dirty) => {
    return DOMPurify.sanitize(dirty, { 
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [] 
    });
};