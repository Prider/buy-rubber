export interface AnnouncedPrice {
  date?: string | Date | null;
  productTypeId?: string;
  price?: number;
}

export interface GroupPriceSheet {
  id: string;
  prices: Array<{ productTypeId: string; price: number }>;
}

export function resolvePurchaseUnitPrice({
  dailyPrices,
  memberGroups,
  groupId,
  productTypeId,
  todayDate,
}: {
  dailyPrices: AnnouncedPrice[];
  memberGroups: GroupPriceSheet[];
  groupId?: string | null;
  productTypeId: string;
  todayDate: string;
}): string {
  if (groupId) {
    const group = memberGroups.find((item) => item.id === groupId);
    const groupPrice = group?.prices.find((price) => price.productTypeId === productTypeId);
    if (groupPrice && Number.isFinite(groupPrice.price)) {
      return String(groupPrice.price);
    }
  }

  let announced = dailyPrices.find((price) => {
    if (!price.date) return false;
    const priceDate = new Date(price.date).toISOString().split('T')[0];
    return price.productTypeId === productTypeId && priceDate === todayDate;
  });

  if (!announced) {
    announced = dailyPrices
      .filter((price) => price.productTypeId === productTypeId)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })[0];
  }

  return announced && Number.isFinite(announced.price) ? String(announced.price) : '';
}
