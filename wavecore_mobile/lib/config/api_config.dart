class ApiConfig {
  static const String baseUrl = 'https://www.intelliwavve.com/api/wavecore';
  
  static const String loginEndpoint = '$baseUrl/auth/login';
  static const String signupEndpoint = '$baseUrl/auth/signup';
  static const String logoutEndpoint = '$baseUrl/auth/logout';
  static const String sessionEndpoint = '$baseUrl/auth/session';
  static const String dashboardEndpoint = '$baseUrl/dashboard';
  static const String searchEndpoint = '$baseUrl/search';
  static const String notificationsEndpoint = '$baseUrl/notifications';
  
  static const String accountsEndpoint = '$baseUrl/gl/chart-of-accounts';
  static const String journalEntriesEndpoint = '$baseUrl/gl/journal-entries';
  static const String invoicesEndpoint = '$baseUrl/finance/invoices';
  static const String paymentsEndpoint = '$baseUrl/finance/payments';
  static const String budgetsEndpoint = '$baseUrl/finance/budgets';
  
  static const String customersEndpoint = '$baseUrl/crm/customers';
  static const String leadsEndpoint = '$baseUrl/crm/leads';
  static const String opportunitiesEndpoint = '$baseUrl/crm/opportunities';
  
  static const String productsEndpoint = '$baseUrl/inventory/products';
  static const String warehousesEndpoint = '$baseUrl/inventory/warehouses';
  
  static const String employeesEndpoint = '$baseUrl/hr/employees';
}