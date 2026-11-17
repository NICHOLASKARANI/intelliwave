SELECT 'MarketplaceListing' AS t, COUNT(*)::int AS c FROM "MarketplaceListing"
UNION ALL SELECT 'User', COUNT(*)::int FROM "User"
UNION ALL SELECT 'Organization', COUNT(*)::int FROM "Organization"
UNION ALL SELECT 'Supplier', COUNT(*)::int FROM "Supplier"
UNION ALL SELECT 'PurchaseOrder', COUNT(*)::int FROM "PurchaseOrder"
UNION ALL SELECT 'PendingBankPayment', COUNT(*)::int FROM "PendingBankPayment"
ORDER BY t;