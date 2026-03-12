import CustomError from "../../../utils/custom.error.js";

export class BannerEntity {
  constructor(data = {}) {
    this.id = data._id || data.id || null;
    this.title = data.title || '';
    this.order = data.order || 0;
    this.description = data.description || '';
    this.isDefault = data.isDefault !== undefined ? data.isDefault : false;
    this.image = data.image || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static fromModel(model) {
    if (!model) return null;
    return new BannerEntity(model.toObject());
  }

  static fromModelList(models) {
    return models.map(model => BannerEntity.fromModel(model));
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      order: this.order,
      description: this.description,
      isDefault: this.isDefault,
      image: this.image,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toCreateDTO() {
    return {
      title: this.title,
      order: this.order,
      description: this.description,
      isDefault: this.isDefault,
      image: this.image,
      isActive: this.isActive
    };
  }

  toUpdateDTO() {
    const dto = {};
    if (this.title !== undefined) dto.title = this.title;
    if (this.order !== undefined) dto.order = this.order;
    if (this.description !== undefined) dto.description = this.description;
    if (this.isDefault !== undefined) dto.isDefault = this.isDefault;
    if (this.image !== undefined) dto.image = this.image;
    if (this.isActive !== undefined) dto.isActive = this.isActive;
    return dto;
  }

  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!this.image || this.image.trim().length === 0) {
      errors.push('Image is required');
    }

    if (this.title && this.title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }

    if (this.description && this.description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }

    if (this.order < 0) {
      errors.push('Order must be a positive number');
    }

    if (errors.length > 0) {
      throw new CustomError(errors.join(', '), 400);
    }
  }
}