/**
 * Central notification navigation handler
 * Handles all FCM notification tap navigation across the app
 */

export const handleNotificationNavigation = (navigation, notificationData) => {
  if (!notificationData || !notificationData.type) {
    console.log('No notification type specified');
    return;
  }

  console.log('Handling notification navigation:', notificationData);

  switch (notificationData.type) {
    // ========== CHAT MESSAGES ==========
    case 'chat':
      navigation.navigate('MessageStackNavigator', {
        screen: 'ChatScreen',
        params: {
          chatId: notificationData.conversationId,
          otherUserId: notificationData.senderId,
          otherUserName: notificationData.senderName
        }
      });
      break;

    // ========== FOOD VENDOR ORDERS ==========
    case 'new_order':
      if (notificationData.vendorId) {
        // Food vendor receiving new order
        navigation.navigate('VendorDashboard', {
          screen: 'VendorOrders',
          params: {
            orderId: notificationData.orderId,
            highlightOrder: true
          }
        });
      } else if (notificationData.shopId) {
        // Shop owner receiving new order
        navigation.navigate('Eshop', {
          screen: 'ShopOrders',
          params: {
            orderId: notificationData.orderId,
            highlightOrder: true
          }
        });
      }
      break;

    // ========== USER ORDER UPDATES (Food) ==========
    case 'order_update':
      navigation.navigate('FoodStack', {
        screen: 'OrderDetails',
        params: {
          orderId: notificationData.orderId,
          status: notificationData.status
        }
      });
      break;

    // ========== USER ORDER UPDATES (Shop) ==========
    case 'shop_order_update':
      navigation.navigate('EshopNavigator', {
        screen: 'OrderDetails',
        params: {
          orderId: notificationData.orderId,
          status: notificationData.status
        }
      });
      break;

    // ========== RENTAL INQUIRIES (Removed - Admin only) ==========
    case 'new_inquiry':
      // This now goes to admin app only
      console.log('Inquiry notification - handled in admin app');
      // Optionally show a toast or navigate to home
      navigation.navigate('Main', { screen: 'Home' });
      break;

    // ========== PROMOTIONS & ANNOUNCEMENTS ==========
    case 'promotion':
      if (notificationData.targetScreen) {
        // Navigate to specific screen if provided
        navigation.navigate(notificationData.targetScreen, notificationData.params || {});
      } else if (notificationData.shopId) {
        // Promotion for specific shop
        navigation.navigate('EshopNavigator', {
          screen: 'ShopDetail',
          params: { shopId: notificationData.shopId }
        });
      } else if (notificationData.vendorId) {
        // Promotion for specific food vendor
        navigation.navigate('FoodStack', {
          screen: 'VendorMenu',
          params: { vendorId: notificationData.vendorId }
        });
      } else {
        // General promotion
        navigation.navigate('Main', { screen: 'Home' });
      }
      break;

    case 'shoutout':
    case 'announcement':
      // Navigate to home or notifications screen
      navigation.navigate('Main', { 
        screen: 'Notifications',
        params: { 
          announcementId: notificationData.announcementId 
        }
      });
      break;

    // ========== BLOG/CONTENT ==========
    case 'new_blog':
      navigation.navigate('BlogsNavigator', {
        screen: 'BlogDetail',
        params: { 
          blogId: notificationData.blogId 
        }
      });
      break;

    // ========== SERVICES ==========
    case 'service_request':
      navigation.navigate('ServicesStack', {
        screen: 'RequestDetails',
        params: { 
          requestId: notificationData.requestId 
        }
      });
      break;

    case 'service_update':
      navigation.navigate('ServicesStack', {
        screen: 'MyRequests',
        params: { 
          requestId: notificationData.requestId,
          status: notificationData.status
        }
      });
      break;

    // ========== ROOMMATE MATCHING ==========
    case 'roommate_match':
      navigation.navigate('RoommateStack', {
        screen: 'MatchDetail',
        params: { 
          matchId: notificationData.matchId 
        }
      });
      break;

    // ========== SECOND HAND MARKETPLACE ==========
    case 'item_inquiry':
      navigation.navigate('SecondHandStack', {
        screen: 'ItemDetail',
        params: { 
          itemId: notificationData.itemId 
        }
      });
      break;

    // ========== ACCOMMODATION ==========
    case 'rental_available':
      navigation.navigate('AccomStack', {
        screen: 'RentalDetail',
        params: { 
          rentalId: notificationData.rentalId 
        }
      });
      break;

    // ========== MY SCHOOL / EVENTS ==========
    case 'new_event':
      navigation.navigate('MySchoolNavigator', {
        screen: 'EventDetail',
        params: { 
          eventId: notificationData.eventId 
        }
      });
      break;

    case 'event_reminder':
      navigation.navigate('MySchoolNavigator', {
        screen: 'EventDetail',
        params: { 
          eventId: notificationData.eventId,
          showReminder: true
        }
      });
      break;

    // ========== LINK ME / NETWORKING ==========
    case 'connection_request':
      navigation.navigate('LinkMe', {
        screen: 'ConnectionRequests'
      });
      break;

    case 'connection_accepted':
      navigation.navigate('LinkMe', {
        screen: 'UserProfile',
        params: { 
          userId: notificationData.userId 
        }
      });
      break;

    // ========== ECHEM / CHEMISTRY RESOURCES ==========
    case 'new_resource':
      navigation.navigate('Echem', {
        screen: 'ResourceDetail',
        params: { 
          resourceId: notificationData.resourceId 
        }
      });
      break;

    // ========== DEFAULT / UNKNOWN ==========
    default:
      console.log('Unknown notification type:', notificationData.type);
      // Navigate to home as fallback
      navigation.navigate('Main', { screen: 'Home' });
      break;
  }
};

/**
 * Helper function to validate notification data
 * Use this on backend before sending notifications
 */
export const validateNotificationData = (type, data) => {
  const requiredFields = {
    chat: ['conversationId', 'senderId', 'senderName'],
    new_order: ['orderId'],
    order_update: ['orderId', 'status'],
    shop_order_update: ['orderId', 'status'],
    promotion: [],
    shoutout: [],
    announcement: [],
    new_blog: ['blogId'],
    service_request: ['requestId'],
    service_update: ['requestId', 'status'],
    roommate_match: ['matchId'],
    item_inquiry: ['itemId'],
    rental_available: ['rentalId'],
    new_event: ['eventId'],
    event_reminder: ['eventId'],
    connection_request: [],
    connection_accepted: ['userId'],
    new_resource: ['resourceId']
  };

  const required = requiredFields[type];
  if (!required) {
    console.warn(`Unknown notification type: ${type}`);
    return false;
  }

  const missing = required.filter(field => !data[field]);
  if (missing.length > 0) {
    console.warn(`Missing required fields for ${type}:`, missing);
    return false;
  }

  return true;
};