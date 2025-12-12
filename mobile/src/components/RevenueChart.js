import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Menu, IconButton } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const RevenueChart = ({ monthlyRevenue = [], onMonthSelect, collapsible = true, defaultCollapsed = false, selectedMonthKey }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [computedMonths, setComputedMonths] = useState([]);
  const [computedLabels, setComputedLabels] = useState([]);
  const [computedData, setComputedData] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // helpers
  const parseToDate = (d) => {
    if (!d) return null;
    const str = String(d);
    const yearMonthMatch = str.match(/^(\d{4})-(\d{2})$/);
    if (yearMonthMatch) {
      const y = parseInt(yearMonthMatch[1], 10);
      const m = parseInt(yearMonthMatch[2], 10);
      return new Date(y, m - 1, 1);
    }
    const dt = new Date(str);
    if (isNaN(dt.getTime())) return null;
    return dt;
  };

  const monthKey = (d) => {
    const dt = parseToDate(d);
    if (!dt) return null;
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  };

  const getLastNMonths = (endDate, n) => {
    const months = [];
    const e = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    for (let i = n - 1; i >= 0; i--) {
      const m = new Date(e.getFullYear(), e.getMonth() - i, 1);
      months.push(m);
    }
    return months;
  };

  useEffect(() => {
    // Determine latest month from provided data, or fallback to current month
    let latest = new Date();
    if (Array.isArray(monthlyRevenue) && monthlyRevenue.length > 0) {
      // find max month in data using parser
      const max = monthlyRevenue.reduce((acc, cur) => {
        const d = parseToDate(cur.month) || acc;
        return d > acc ? d : acc;
      }, parseToDate(monthlyRevenue[0].month) || new Date());
      latest = max;
    }
    // Build last 6 months range
    const monthsArr = getLastNMonths(latest, 6); // oldest -> newest
    // Build revenue map keyed by YYYY-MM from incoming monthlyRevenue
    const revMap = {};
    (monthlyRevenue || []).forEach(m => { revMap[monthKey(m.month)] = parseFloat(m.revenue) || 0; });
    // compute array of values for these months
    const computedData = monthsArr.map(m => revMap[monthKey(m)] || 0);
    setComputedMonths(monthsArr);
    setComputedLabels(monthsArr.map(m => m.toLocaleString('default', { month: 'short' })));
    setComputedData(computedData);
    setSelectedIndex(monthsArr.length - 1);
    if (typeof onMonthSelect === 'function') onMonthSelect(monthKey(monthsArr[monthsArr.length - 1]));
  }, [monthlyRevenue]);

  // update selectedIndex when parent passes selectedMonthKey
  useEffect(() => {
    if (!selectedMonthKey || computedMonths.length === 0) return;
    const idx = computedMonths.findIndex(m => monthKey(m) === selectedMonthKey);
    if (idx >= 0) setSelectedIndex(idx);
  }, [selectedMonthKey, computedMonths]);

  const labels = computedLabels;
  const data = computedData;

  const barColors = data.map((_, idx) => (opacity = 1) => {
    // Highlight the selected index
    if (idx === selectedIndex) return `rgba(0, 122, 255, ${opacity})`;
    return `rgba(200, 200, 200, ${opacity})`;
  });

  const handleSelect = (idx) => {
    setSelectedIndex(idx);
    setMenuVisible(false);
    if (typeof onMonthSelect === 'function' && computedMonths[idx]) {
      onMonthSelect(monthKey(computedMonths[idx]));
    }
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Revenue Trends</Text>
          <Text style={styles.subtitle}>Monthly revenue</Text>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="calendar" size={20} onPress={() => setMenuVisible(true)} />}
        >
          {(computedMonths || []).map((m, i) => (
            <Menu.Item key={i} title={`${m.toLocaleString('default', { month: 'short', year: 'numeric' })}`} onPress={() => handleSelect(i)} />
          ))}
        </Menu>
      </View>

      <View style={styles.headerControls}>
        <View style={{ flex: 1 }}>
          <Text style={styles.smallSummary}>Showing last 6 months</Text>
        </View>
        {collapsible && (
          <IconButton
            icon={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            onPress={() => setIsCollapsed(prev => !prev)}
            accessibilityLabel={isCollapsed ? 'Expand chart' : 'Collapse chart'}
          />
        )}
      </View>

      {!isCollapsed && (
        <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Selected: {computedMonths[selectedIndex] ? computedMonths[selectedIndex].toLocaleString('default', { month: 'short', year: 'numeric' }) : 'N/A'}</Text>
        <Text style={styles.summaryText}>RM{(data[selectedIndex] || 0).toFixed(0)}</Text>
        </View>
      )}

      {/* show a note if only 1 month exists */}
      {(computedMonths || []).length === 1 && !isCollapsed && (
        <Text style={{ color: '#666', marginVertical: 4 }}>Only one month of revenue data available.</Text>
      )}

      {!isCollapsed && (
        <BarChart
        data={{ labels: labels, datasets: [{ data, colors: barColors }] }}
        width={Math.max(screenWidth - 32, labels.length * 60)}
        height={180}
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        onDataPointClick={(d) => {
          if (d && typeof d.index === 'number') handleSelect(d.index);
        }}
        withCustomBarColorFromData
        flatColor
        style={styles.chart}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerControls: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  smallSummary: { fontSize: 12, color: '#666' },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12, color: '#666' },
  chart: { marginVertical: 8, borderRadius: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryText: { fontSize: 14, color: '#333' },
});

export default RevenueChart;
