// screens/eshop/CartScreen.js
const CartScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dummyContainer}>
        <Icon name="shopping-cart" size={80} color="#6366f1" />
        <Text style={styles.dummyTitle}>Shopping Cart</Text>
        <Text style={styles.dummyText}>
          Your cart items will be displayed here
        </Text>
        <Text style={styles.dummyNote}>🚧 Coming Soon!</Text>
      </View>
    </SafeAreaView>
  );
};
export default CartScreen;