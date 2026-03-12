import CustomError from '../../../utils/custom.error.js';

export class AddressEntity {
    constructor({
        id = null,
        userId,
        fullName,
        phoneNumber,
        addressLine1,
        addressLine2 = '',
        landmark = '',
        city,
        state,
        pinCode,
        country = 'India',
        addressType = 'HOME', // HOME, WORK, OTHER
        isDefault = false,
        // Handle snake_case input from request body
        address_type,
        is_default,
        createdAt = null,
        updatedAt = null
    }) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        this.addressLine1 = addressLine1;
        this.addressLine2 = addressLine2;
        this.landmark = landmark;
        this.city = city;
        this.state = state;
        this.pinCode = pinCode;
        this.country = country;
        
        // Handle both camelCase and snake_case inputs
        this.addressType = addressType || address_type || 'HOME';
        this.isDefault = isDefault !== undefined ? isDefault : (is_default !== undefined ? is_default : false);
        
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        this.validate();
    }

    validate() {
        const errors = [];

        // User ID validation
        if (!this.userId) {
            errors.push('User ID is required');
        }

        // Full name validation
        if (!this.fullName || typeof this.fullName !== 'string') {
            errors.push('Full name is required');
        } else if (this.fullName.trim().length < 2) {
            errors.push('Full name must be at least 2 characters long');
        } else if (this.fullName.trim().length > 100) {
            errors.push('Full name cannot exceed 100 characters');
        } else if (!/^[a-zA-Z\s.'-]+$/.test(this.fullName.trim())) {
            errors.push('Full name can only contain letters, spaces, dots, hyphens and apostrophes');
        }

        // Phone number validation
        if (!this.phoneNumber || typeof this.phoneNumber !== 'string') {
            errors.push('Phone number is required');
        } else {
            const cleanPhone = this.phoneNumber.replace(/\s+/g, '');
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                errors.push('Phone number must be a valid 10-digit Indian mobile number');
            }
            this.phoneNumber = cleanPhone; // Store cleaned phone number
        }

        // Address line 1 validation
        if (!this.addressLine1 || typeof this.addressLine1 !== 'string') {
            errors.push('Address line 1 is required');
        } else if (this.addressLine1.trim().length < 5) {
            errors.push('Address line 1 must be at least 5 characters long');
        } else if (this.addressLine1.trim().length > 255) {
            errors.push('Address line 1 cannot exceed 255 characters');
        }

        // Address line 2 validation (optional)
        if (this.addressLine2 && typeof this.addressLine2 === 'string' && this.addressLine2.trim().length > 255) {
            errors.push('Address line 2 cannot exceed 255 characters');
        }

        // Landmark validation (optional)
        if (this.landmark && typeof this.landmark === 'string' && this.landmark.trim().length > 100) {
            errors.push('Landmark cannot exceed 100 characters');
        }

        // City validation
        if (!this.city || typeof this.city !== 'string') {
            errors.push('City is required');
        } else if (this.city.trim().length < 2) {
            errors.push('City must be at least 2 characters long');
        } else if (this.city.trim().length > 100) {
            errors.push('City cannot exceed 100 characters');
        } else if (!/^[a-zA-Z\s.'-]+$/.test(this.city.trim())) {
            errors.push('City can only contain letters, spaces, dots, hyphens and apostrophes');
        }

        // State validation
        if (!this.state || typeof this.state !== 'string') {
            errors.push('State is required');
        } else if (!this.isValidIndianState(this.state.trim())) {
            errors.push('Please provide a valid Indian state');
        }

        // PIN code validation
        if (!this.pinCode || typeof this.pinCode !== 'string') {
            errors.push('PIN code is required');
        } else {
            const cleanPin = this.pinCode.replace(/\s+/g, '');
            if (!/^\d{6}$/.test(cleanPin)) {
                errors.push('PIN code must be a valid 6-digit Indian postal code');
            }
            this.pinCode = cleanPin; // Store cleaned PIN code
        }

        // Country validation
        if (this.country && this.country.trim().toLowerCase() !== 'india') {
            errors.push('Only Indian addresses are currently supported');
        }
        this.country = 'India'; // Force India as default

        // Address type validation
        const validAddressTypes = ['HOME', 'WORK', 'OTHER'];
        if (!validAddressTypes.includes(this.addressType.toUpperCase())) {
            errors.push('Address type must be HOME, WORK, or OTHER');
        }
        this.addressType = this.addressType.toUpperCase();

        // Boolean validation
        if (typeof this.isDefault !== 'boolean') {
            this.isDefault = Boolean(this.isDefault);
        }

        // Trim string values
        this.fullName = this.fullName?.trim();
        this.addressLine1 = this.addressLine1?.trim();
        this.addressLine2 = this.addressLine2?.trim();
        this.landmark = this.landmark?.trim();
        this.city = this.city?.trim();
        this.state = this.state?.trim();

        if (errors.length > 0) {
            throw new CustomError(`Address validation failed: ${errors.join(', ')}`, 400, true, { validationErrors: errors });
        }
    }

    isValidIndianState(state) {
        const indianStates = [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
            'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
            'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
            'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
            'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
            'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
        ];
        
        return indianStates.some(validState => 
            validState.toLowerCase() === state.toLowerCase()
        );
    }

    static fromDatabase(dbData) {
        if (!dbData) return null;
        
        return new AddressEntity({
            id: dbData.id || dbData._id,
            userId: dbData.userId,
            fullName: dbData.fullName,
            phoneNumber: dbData.phoneNumber,
            addressLine1: dbData.addressLine1,
            addressLine2: dbData.addressLine2,
            landmark: dbData.landmark,
            city: dbData.city,
            state: dbData.state,
            pinCode: dbData.pinCode,
            country: dbData.country,
            addressType: dbData.addressType,
            isDefault: dbData.isDefault,
            createdAt: dbData.createdAt,
            updatedAt: dbData.updatedAt
        });
    }

    toDatabase() {
        return {
            userId: this.userId,
            fullName: this.fullName,
            phoneNumber: this.phoneNumber,
            addressLine1: this.addressLine1,
            addressLine2: this.addressLine2,
            landmark: this.landmark,
            city: this.city,
            state: this.state,
            pinCode: this.pinCode,
            country: this.country,
            addressType: this.addressType,
            isDefault: this.isDefault
        };
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            fullName: this.fullName,
            phoneNumber: this.phoneNumber,
            addressLine1: this.addressLine1,
            addressLine2: this.addressLine2,
            landmark: this.landmark,
            city: this.city,
            state: this.state,
            pinCode: this.pinCode,
            country: this.country,
            addressType: this.addressType,
            isDefault: this.isDefault,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}