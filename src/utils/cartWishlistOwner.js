/**
 * Resolve MongoDB query fragment for a logged-in user or anonymous guest session.
 */
export function ownerQuery(owner) {
    if (!owner) return {};
    if (owner.userId) {
        return { userId: owner.userId };
    }
    if (owner.guestId) {
        return { guestId: owner.guestId };
    }
    return {};
}

/** Cart / wishlist line belongs to this owner (user or guest). */
export function itemBelongsToOwner(item, owner) {
    if (!item || !owner) return false;
    if (owner.userId) {
        const uid = item.userId?._id ?? item.userId;
        return uid && uid.toString() === owner.userId.toString();
    }
    if (owner.guestId) {
        return item.guestId && item.guestId === owner.guestId;
    }
    return false;
}
