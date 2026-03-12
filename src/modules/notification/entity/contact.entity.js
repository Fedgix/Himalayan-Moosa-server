class ContactEntity {
    constructor({ name, email, phoneNumber, comment, status = 'pending', submittedAt, _id, createdAt, updatedAt }) {
        this.id = _id;
        this.name = name;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.comment = comment;
        this.status = status;
        this.submittedAt = submittedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromDocument(doc) {
        if (!doc) return null;
        return new ContactEntity(doc.toObject ? doc.toObject() : doc);
    }

    static fromDocuments(docs) {
        return docs.map(doc => ContactEntity.fromDocument(doc));
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phoneNumber: this.phoneNumber,
            comment: this.comment,
            status: this.status,
            submittedAt: this.submittedAt,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export default ContactEntity;
