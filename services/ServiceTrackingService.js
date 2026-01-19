// services/ServiceTrackingService.js
import DataService from './DataService';

export const ServiceTrackingService = {
  // Track when a service is clicked/used
  async trackServiceUsage(serviceId, serviceTitle, category) {
    try {
      const now = Date.now();
      
      // Get current usage data - ensure it's always an object
      const usageData = await DataService.getAppSetting('service_usage', {}) || {};
      
      // Initialize service entry if it doesn't exist
      if (!usageData[serviceId]) {
        usageData[serviceId] = {
          id: serviceId,
          title: serviceTitle,
          category: category,
          clickCount: 0,
          lastClicked: 0,
          firstClicked: now,
          clickHistory: []
        };
      }
      
      // Update usage stats
      usageData[serviceId].clickCount++;
      usageData[serviceId].lastClicked = now;
      usageData[serviceId].clickHistory = usageData[serviceId].clickHistory || [];
      usageData[serviceId].clickHistory.push(now);
      
      // Keep only last 100 clicks
      if (usageData[serviceId].clickHistory.length > 100) {
        usageData[serviceId].clickHistory = usageData[serviceId].clickHistory.slice(-100);
      }
      
      // Save updated data
      await DataService.setAppSetting('service_usage', usageData);
      
      // Also record in user behavior
      await DataService.trackUserAction(
        'anonymous',
        'service_click',
        'ServicesScreen',
        {
          serviceId,
          serviceTitle,
          category,
          clickCount: usageData[serviceId].clickCount
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error tracking service usage:', error);
      return false;
    }
  },

  // Get service usage data
  async getServiceUsage(limit = 50) {
    try {
      const usageData = await DataService.getAppSetting('service_usage', {}) || {};
      
      // Convert to array and sort by usage
      const servicesArray = Object.values(usageData);
      
      if (servicesArray.length === 0) {
        return [];
      }
      
      // Sort by: recent clicks (weighted) + total clicks
      servicesArray.sort((a, b) => {
        const aScore = this.calculateUsageScore(a);
        const bScore = this.calculateUsageScore(b);
        return bScore - aScore; // Descending
      });
      
      return servicesArray.slice(0, limit);
    } catch (error) {
      console.error('Error getting service usage:', error);
      return [];
    }
  },

  // Calculate a usage score (customize this based on your needs)
  calculateUsageScore(service) {
    if (!service || !service.clickHistory || service.clickHistory.length === 0) {
      return 0;
    }
    
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    
    let score = 0;
    
    // Base score from total clicks
    score += (service.clickCount || 0) * 10;
    
    // Weight recent clicks more heavily
    (service.clickHistory || []).forEach(clickTime => {
      const recency = now - clickTime;
      
      if (recency < oneDay) {
        score += 50; // Clicks within last 24 hours
      } else if (recency < oneWeek) {
        score += 20; // Clicks within last week
      } else if (recency < oneMonth) {
        score += 5; // Clicks within last month
      } else {
        score += 1; // Older clicks
      }
    });
    
    // Bonus for services clicked in last 24 hours
    if (service.lastClicked && (now - service.lastClicked < oneDay)) {
      score += 30;
    }
    
    return score;
  },

  // Get recommended order for services
  async getRecommendedServiceOrder(category = 'All') {
    try {
      const usageData = await DataService.getAppSetting('service_usage', {}) || {};
      const servicesArray = Object.values(usageData);
      
      if (servicesArray.length === 0) {
        return [];
      }
      
      // Filter by category if needed
      const filteredServices = category === 'All' 
        ? servicesArray 
        : servicesArray.filter(s => s.category === category);
      
      if (filteredServices.length === 0) {
        return [];
      }
      
      // Sort by usage score
      filteredServices.sort((a, b) => {
        const aScore = this.calculateUsageScore(a);
        const bScore = this.calculateUsageScore(b);
        return bScore - aScore;
      });
      
      // Return just the IDs in order
      return filteredServices.map(s => s.id);
    } catch (error) {
      console.error('Error getting recommended order:', error);
      return [];
    }
  },

  // Clear usage data (for debugging or user reset)
  async clearServiceUsage() {
    await DataService.setAppSetting('service_usage', {});
    return true;
  },

  // Get most used services by category
  async getMostUsedServicesByCategory(limit = 3) {
    try {
      const usageData = await DataService.getAppSetting('service_usage', {}) || {};
      const servicesArray = Object.values(usageData);
      
      if (servicesArray.length === 0) {
        return {};
      }
      
      // Group by category
      const byCategory = {};
      
      servicesArray.forEach(service => {
        if (!service.category) return;
        
        if (!byCategory[service.category]) {
          byCategory[service.category] = [];
        }
        byCategory[service.category].push(service);
      });
      
      // Sort within each category and limit
      Object.keys(byCategory).forEach(category => {
        byCategory[category].sort((a, b) => {
          const aScore = this.calculateUsageScore(a);
          const bScore = this.calculateUsageScore(b);
          return bScore - aScore;
        });
        
        byCategory[category] = byCategory[category].slice(0, limit);
      });
      
      return byCategory;
    } catch (error) {
      console.error('Error getting most used by category:', error);
      return {};
    }
  },

  // Get service usage stats
  async getServiceStats() {
    try {
      const usageData = await DataService.getAppSetting('service_usage', {}) || {};
      const servicesArray = Object.values(usageData);
      
      if (servicesArray.length === 0) {
        return {
          totalClicks: 0,
          mostUsedService: null,
          totalServices: 0,
          averageClicksPerService: 0
        };
      }
      
      const totalClicks = servicesArray.reduce((sum, service) => sum + (service.clickCount || 0), 0);
      const mostUsedService = servicesArray.reduce((prev, current) => 
        ((prev.clickCount || 0) > (current.clickCount || 0)) ? prev : current
      );
      
      return {
        totalClicks,
        mostUsedService: {
          id: mostUsedService.id,
          title: mostUsedService.title,
          clickCount: mostUsedService.clickCount || 0
        },
        totalServices: servicesArray.length,
        averageClicksPerService: totalClicks / servicesArray.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting service stats:', error);
      return null;
    }
  },

  // Initialize default services with zero usage
  async initializeDefaultServices(services) {
    try {
      const usageData = await DataService.getAppSetting('service_usage', {}) || {};
      
      services.forEach(service => {
        if (!usageData[service.id]) {
          usageData[service.id] = {
            id: service.id,
            title: service.title,
            category: service.category,
            clickCount: 0,
            lastClicked: 0,
            firstClicked: 0,
            clickHistory: []
          };
        }
      });
      
      await DataService.setAppSetting('service_usage', usageData);
      return true;
    } catch (error) {
      console.error('Error initializing default services:', error);
      return false;
    }
  }
};

export default ServiceTrackingService;