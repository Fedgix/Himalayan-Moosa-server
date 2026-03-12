import { ContactFormService } from '../services/contact.form.service.js';
import { sendSuccess } from '../../../utils/response.handler.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

export const ContactFormController = {
    createContact: async (req, res, next) => {
        console.log("Req: ",req.body)
        const contact = await ContactFormService.createContact(req.body);

        return sendSuccess(
            res,
            'Contact form submitted successfully',
            { contact: contact.toJSON() },
            HttpStatusCode.CREATED
        );
    },

    getAllContacts: async (req, res, next) => {
        const { page, limit, sortBy, sortOrder, status } = req.query;
        
        const filters = {};
        if (status) filters.status = status;

        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            sortBy: sortBy || 'submittedAt',
            sortOrder: sortOrder === 'asc' ? 1 : -1
        };

        const result = await ContactFormService.getAllContacts(filters, options);
        
        return sendSuccess(
            res,
            'Contact forms retrieved successfully',
            {
                contacts: result.contacts.map(contact => contact.toJSON()),
                pagination: {
                    currentPage: result.currentPage,
                    totalPages: result.totalPages,
                    totalCount: result.totalCount
                }
            }
        );
    },

    getContactById: async (req, res, next) => {
        const { id } = req.params;
        const contact = await ContactFormService.getContactById(id);
        
        return sendSuccess(
            res,
            'Contact form retrieved successfully',
            { contact: contact.toJSON() }
        );
    },

    updateContactStatus: async (req, res, next) => {
        const { id } = req.params;
        const { status } = req.body;
        
        const updatedContact = await ContactFormService.updateContactStatus(id, status);
        
        return sendSuccess(
            res,
            'Contact form status updated successfully',
            { contact: updatedContact.toJSON() }
        );
    },

    getContactStatistics: async (req, res, next) => {
        const stats = await ContactFormService.getContactStatistics();
        
        return sendSuccess(
            res,
            'Contact statistics retrieved successfully',
            { statistics: stats }
        );
    }
};