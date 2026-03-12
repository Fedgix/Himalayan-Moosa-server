import Contact from '../models/contact.model.js';
import CustomError from '../../../utils/custom.error.js';
import HttpStatusCode from '../../../utils/http.status.codes.js';

export const ContactFormRepository = {
    async create(contactData) {
        try {
            const contact = new Contact(contactData);
            const savedContact = await contact.save();
            return savedContact;
        } catch (error) {
            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => err.message);
                throw new CustomError(
                    'Validation failed',
                    HttpStatusCode.BAD_REQUEST,
                    true,
                    { validationErrors }
                );
            }
            throw new CustomError(
                'Failed to create contact form',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    },

    async findAll(filters = {}, options = {}) {
        try {
            const { page = 1, limit = 10, sortBy = 'submittedAt', sortOrder = -1 } = options;
            const skip = (page - 1) * limit;

            const pipeline = [
                { $match: filters },
                { $sort: { [sortBy]: sortOrder } },
                {
                    $facet: {
                        data: [
                            { $skip: skip },
                            { $limit: limit }
                        ],
                        totalCount: [
                            { $count: "count" }
                        ]
                    }
                }
            ];

            const result = await Contact.aggregate(pipeline);
            const contacts = result[0].data;
            const totalCount = result[0].totalCount[0]?.count || 0;

            return {
                contacts,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit)
            };
        } catch (error) {
            throw new CustomError(
                'Failed to fetch contact forms',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    },

    async findById(id) {
        try {
            const contact = await Contact.findById(id);
            return contact;
        } catch (error) {
            throw new CustomError(
                'Failed to fetch contact form',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    },

    async updateStatus(id, status) {
        try {
            const contact = await Contact.findByIdAndUpdate(
                id,
                { status },
                { new: true, runValidators: true }
            );
            
            if (!contact) {
                throw new CustomError(
                    'Contact form not found',
                    HttpStatusCode.NOT_FOUND,
                    true
                );
            }
            
            return contact;
        } catch (error) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                'Failed to update contact form status',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    },

    async getContactStats() {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalContacts: { $sum: '$count' },
                        statusBreakdown: {
                            $push: {
                                status: '$_id',
                                count: '$count'
                            }
                        }
                    }
                }
            ];

            const result = await Contact.aggregate(pipeline);
            return result[0] || { totalContacts: 0, statusBreakdown: [] };
        } catch (error) {
            throw new CustomError(
                'Failed to fetch contact statistics',
                HttpStatusCode.INTERNAL_SERVER,
                true
            );
        }
    }
};