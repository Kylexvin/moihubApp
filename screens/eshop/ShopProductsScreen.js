// screens/eshop/ShopProductsScreen.js
const ShopProductsScreen = ({ route, navigation }) => {
  const { shopName } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dummyContainer}>
        <Icon name="construction" size={80} color="#6366f1" />
        <Text style={styles.dummyTitle}>Shop Products</Text>
        <Text style={styles.dummyText}>
          Products from {shopName} will be displayed here
        </Text>
        <Text style={styles.dummyNote}>🚧 Coming Soon!</Text>
      </View>
    </SafeAreaView>
  );
};

export default ShopProductsScreen;