// screens/localservices/dashboard/Analytics.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Theme from '../../theme/Theme';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from 'react-native-chart-kit';

const { Colors, Typography, Spacing, BorderRadius } = Theme;
const screenWidth = Dimensions.get('window').width;

const Analytics = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [0, 0, 0, 0, 0, 0, 0],
    },
    bookings: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [0, 0, 0, 0, 0, 0, 0],
    },
    services: {
      labels: ['Service 1', 'Service 2', 'Service 3', 'Service 4', 'Service 5'],
      data: [0, 0, 0, 0, 0],
      colors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    },
    metrics: {
      conversionRate: 0,
      customerSatisfaction: 0,
      responseTime: 0,
      repeatCustomers: 0,
    },
    summary: {
      totalRevenue: 0,
      totalBookings: 0,
      activeServices: 0,
      totalProducts: 0,
    },
  });

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    }
  }, [token, timeRange]);

  const loadToken = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      setToken(userToken);
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/services/dashboard/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setAnalyticsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => Colors.primary,
    labelColor: (opacity = 1) => Colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: Colors.primary,
    },
  };

  const progressChartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    color: (opacity = 1) => Colors.primary,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.headerBackSkeleton} />
          <View style={styles.headerTitleSkeleton} />
          <View style={styles.headerFilterSkeleton} />
        </View>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.chartSkeleton} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Business Analytics</Text>
        
        <TouchableOpacity
          style={styles.headerRefresh}
          onPress={fetchAnalyticsData}
        >
          <Ionicons name="refresh" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.timeRangeContainer}
        contentContainerStyle={styles.timeRangeContent}
      >
        {['day', 'week', 'month', 'quarter', 'year'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.timeRangeButtonActive
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              timeRange === range && styles.timeRangeTextActive
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="cash" size={24} color={Colors.success} />
            </View>
            <Text style={styles.summaryValue}>
              ${analyticsData.summary.totalRevenue.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calendar" size={24} color={Colors.info} />
            </View>
            <Text style={styles.summaryValue}>
              {analyticsData.summary.totalBookings}
            </Text>
            <Text style={styles.summaryLabel}>Total Bookings</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="construct" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.summaryValue}>
              {analyticsData.summary.activeServices}
            </Text>
            <Text style={styles.summaryLabel}>Active Services</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="bag" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.summaryValue}>
              {analyticsData.summary.totalProducts}
            </Text>
            <Text style={styles.summaryLabel}>Total Products</Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Revenue Trend</Text>
            <TouchableOpacity>
              <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <LineChart
            data={analyticsData.revenue}
            width={screenWidth - Spacing.lg * 2}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Bookings Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Bookings Trend</Text>
            <TouchableOpacity>
              <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <BarChart
            data={analyticsData.bookings}
            width={screenWidth - Spacing.lg * 2}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <ProgressChart
                data={{
                  labels: ["Conversion"],
                  data: [analyticsData.metrics.conversionRate / 100],
                }}
                width={80}
                height={80}
                strokeWidth={8}
                radius={32}
                chartConfig={progressChartConfig}
                hideLegend
              />
              <View style={styles.metricInfo}>
                <Text style={styles.metricValue}>
                  {analyticsData.metrics.conversionRate}%
                </Text>
                <Text style={styles.metricLabel}>Conversion Rate</Text>
              </View>
            </View>
            
            <View style={styles.metricCard}>
              <ProgressChart
                data={{
                  labels: ["Satisfaction"],
                  data: [analyticsData.metrics.customerSatisfaction / 100],
                }}
                width={80}
                height={80}
                strokeWidth={8}
                radius={32}
                chartConfig={progressChartConfig}
                hideLegend
              />
              <View style={styles.metricInfo}>
                <Text style={styles.metricValue}>
                  {analyticsData.metrics.customerSatisfaction}%
                </Text>
                <Text style={styles.metricLabel}>Satisfaction</Text>
              </View>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <Ionicons name="time" size={32} color={Colors.warning} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricValue}>
                  {analyticsData.metrics.responseTime}h
                </Text>
                <Text style={styles.metricLabel}>Avg Response Time</Text>
              </View>
            </View>
            
            <View style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <Ionicons name="people" size={32} color={Colors.secondary} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricValue}>
                  {analyticsData.metrics.repeatCustomers}
                </Text>
                <Text style={styles.metricLabel}>Repeat Customers</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Services */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>Top Services</Text>
          <View style={styles.servicesChart}>
            <PieChart
              data={analyticsData.services.data.map((value, index) => ({
                name: analyticsData.services.labels[index],
                population: value,
                color: analyticsData.services.colors[index],
                legendFontColor: Colors.text,
                legendFontSize: 12,
              }))}
              width={screenWidth - Spacing.lg * 2}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
          
          <View style={services.legendContainer}>
            {analyticsData.services.labels.map((label, index) => (
              <View key={index} style={styles.legendItem}>
                <View 
                  style={[
                    styles.legendColor,
                    { backgroundColor: analyticsData.services.colors[index] }
                  ]} 
                />
                <Text style={styles.legendText}>{label}</Text>
                <Text style={styles.legendValue}>
                  {analyticsData.services.data[index]} bookings
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Business Insights</Text>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="trending-up" size={24} color={Colors.success} />
              <Text style={styles.insightTitle}>Peak Hours</Text>
            </View>
            <Text style={styles.insightText}>
              Your busiest hours are between 2 PM - 5 PM. Consider scheduling more staff during these hours.
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="star" size={24} color={Colors.warning} />
              <Text style={styles.insightTitle}>Popular Service</Text>
            </View>
            <Text style={styles.insightText}>
              "Emergency Plumbing Repair" is your most popular service with 45 bookings this month.
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="alert-circle" size={24} color={Colors.info} />
              <Text style={styles.insightTitle}>Recommendation</Text>
            </View>
            <Text style={styles.insightText}>
              Consider adding more weekend availability. 68% of bookings are requested for weekends.
            </Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
  },
  headerBack: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '600',
  },
  headerRefresh: {
    padding: Spacing.sm,
  },
  timeRangeContainer: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  timeRangeContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  timeRangeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeRangeText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  timeRangeTextActive: {
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryValue: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  metricValue: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  servicesContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  servicesChart: {
    alignItems: 'center',
  },
  legendContainer: {
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  legendText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  legendValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  insightsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  insightCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  insightTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  insightText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bottomPadding: {
    height: Spacing.xl * 2,
  },
  
  // Loading Skeletons
  loadingContent: {
    padding: Spacing.lg,
  },
  chartSkeleton: {
    height: 300,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  headerBackSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBorder,
  },
  headerTitleSkeleton: {
    width: 180,
    height: 24,
    borderRadius: 4,
    backgroundColor: Colors.cardBorder,
  },
  headerFilterSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBorder,
  },
});

export default Analytics;