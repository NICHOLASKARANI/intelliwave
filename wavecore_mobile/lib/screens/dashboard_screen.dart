import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiService();
  Map<String, dynamic>? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final data = await _api.get(ApiConfig.dashboardEndpoint);
      setState(() { _data = data; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  String _formatKES(dynamic amount) {
    final value = (amount ?? 0).toDouble();
    return 'KSh ${NumberFormat('#,##0.00', 'en_KE').format(value)}';
  }

  @override
  Widget build(BuildContext context) {
    final kpis = _data?['kpis'] ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('WaveCore ERP'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await _api.clearSession();
              if (!mounted) return;
              Navigator.of(context).pushReplacementNamed('/login');
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboard,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Welcome
                  Text(
                    'Welcome, ${_data?['user']?['name'] ?? 'User'}',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    _data?['organization']?['name'] ?? '',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 20),

                  // KPI Grid
                  GridView.count(
                    crossAxisCount: MediaQuery.of(context).size.width > 600 ? 4 : 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: [
                      _kpiCard('Revenue (MTD)', _formatKES(kpis['revenueMTD']), Icons.trending_up, Colors.green),
                      _kpiCard('Receivables', _formatKES(kpis['outstandingReceivables']), Icons.account_balance_wallet, Colors.orange),
                      _kpiCard('Customers', '${kpis['activeCustomers'] ?? 0}', Icons.people, Colors.blue),
                      _kpiCard('Products', '${kpis['inventoryItems'] ?? 0}', Icons.inventory, Colors.purple),
                      _kpiCard('Employees', '${kpis['employees'] ?? 0}', Icons.badge, Colors.indigo),
                      _kpiCard('Invoices', '${kpis['invoiceCount'] ?? 0}', Icons.receipt, Colors.teal),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick Actions
                  const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _quickAction(context, Icons.add, 'New Invoice'),
                      _quickAction(context, Icons.people, 'Add Customer'),
                      _quickAction(context, Icons.inventory, 'Add Product'),
                      _quickAction(context, Icons.receipt, 'Record Payment'),
                      _quickAction(context, Icons.calculate, 'Journal Entry'),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _kpiCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
        ],
      ),
    );
  }

  Widget _quickAction(BuildContext context, IconData icon, String label) {
    return InkWell(
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$label - Coming soon')),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: const Color(0xFF6366F1)),
            const SizedBox(width: 6),
            Text(label, style: const TextStyle(fontSize: 13)),
          ],
        ),
      ),
    );
  }
}