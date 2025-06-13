// screens/eshop/OrdersScreen.js
const OrdersScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dummyContainer}>
        <Icon name="receipt" size={80} color="#6366f1" />
        <Text style={styles.dummyTitle}>My Orders</Text>
        <Text style={styles.dummyText}>
          Your order history will be shown here
        </Text>
        <Text style={styles.dummyNote}>🚧 Coming Soon!</Text>
      </View>
    </SafeAreaView>
  );
};
export default OrdersScreen;