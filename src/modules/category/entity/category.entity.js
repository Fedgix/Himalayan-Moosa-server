import CustomError from "../../../utils/custom.error.js";
import HttpStatusCode from "../../../utils/http.status.codes.js";
import { sanitizeHtml } from "../../../utils/sanitizer.js";
import { isValidImageUrl } from "../../../utils/url.validator.js";

export class CategoryEntity {
  constructor(data = {}) {
    this.id = data._id || data.id || null;
    this.name = data.name || '';
    this.slug = data.slug || '';
    this.description = data.description || '';
    this.image = data.image || null;
    this.icon = data.icon || null;
    this.parentCategory = data.parentCategory || null;
    this.level = data.level || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.displayOrder = data.displayOrder || 0;
    this.seoMeta = data.seoMeta || {
      title: '',
      description: '',
      keywords: []
    };
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.subcategories = data.subcategories || [];
    this.parent = data.parent || null;
    this.productCount = data.productCount || 0;
    this.products = data.products || [];
  }

  static fromModel(model) {
    if (!model) return null;
    return new CategoryEntity(model.toObject());
  }

  static fromModelList(models) {
    return models.map(model => CategoryEntity.fromModel(model));
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      image: this.image,
      icon: this.icon,
      parentCategory: this.parentCategory,
      level: this.level,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      seoMeta: this.seoMeta,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      subcategories: this.subcategories,
      parent: this.parent,
      productCount: this.productCount,
      products: this.products
    };
  }

  toCreateDTO() {
        return {
            name: this.name,
      slug: this.slug,
            description: this.description,
            image: this.image,
      icon: this.icon,
      parentCategory: this.parentCategory,
      isActive: this.isActive,
      displayOrder: this.displayOrder,
      seoMeta: this.seoMeta
    };
  }

  toUpdateDTO() {
    const dto = {};
    if (this.name !== undefined) dto.name = this.name;
    if (this.slug !== undefined) dto.slug = this.slug;
    if (this.description !== undefined) dto.description = this.description;
    if (this.image !== undefined) dto.image = this.image;
    if (this.icon !== undefined) dto.icon = this.icon;
    if (this.parentCategory !== undefined) dto.parentCategory = this.parentCategory;
    if (this.isActive !== undefined) dto.isActive = this.isActive;
    if (this.displayOrder !== undefined) dto.displayOrder = this.displayOrder;
    if (this.seoMeta !== undefined) dto.seoMeta = this.seoMeta;
    return dto;
  }
}