export class UserEntity {
    constructor(data) {
        this.id = data._id || data.id;
        this.googleId = data.googleId;
        this.firstName = data.firstName;
        this.lastName = data.lastName;
        this.name = data.name || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : data.name);
        this.email = data.email;
        this.avatar = data.avatar;
        this.role = data.role || 'user';
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            name: this.name,
            email: this.email,
            avatar: this.avatar,
            role: this.role,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromGoogleProfile(profile) {
        return new UserEntity({
            googleId: profile.googleId,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            role: 'user',
            isActive: true
        });
    }
}