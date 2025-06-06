// screens/NotificationsScreen.js
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

const NotificationsScreen = () => {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Notifications</Text>
      <ScrollView>
        {[
          { title: "Semester Registration", message: "Registration for semester 2 is now open", time: "2 hours ago", read: false },
          { title: "Library Book Due", message: "Your borrowed book is due in 2 days", time: "Yesterday", read: true },
          { title: "New Course Material", message: "New resources available for CSC301", time: "2 days ago", read: true }
        ].map((notification, idx) => (
          <View key={idx} style={[styles.notificationItem, !notification.read && styles.unreadNotification]}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginVertical: 16,
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#005f4b',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  unreadDot: {
    width: 10, 
    height: 10,
    borderRadius: 5,
    backgroundColor: '#005f4b',
    marginLeft: 10,
  },
});

export default NotificationsScreen;