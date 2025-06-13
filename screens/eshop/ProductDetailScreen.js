// screens/eshop/ProductDetailScreen.js
const ProductDetailScreen = ({ route }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dummyContainer}>
        <Icon name="shopping-bag" size={80} color="#6366f1" />
        <Text style={styles.dummyTitle}>Product Details</Text>
        <Text style={styles.dummyText}>
          Detailed product information will be shown here
        </Text>
        <Text style={styles.dummyNote}>🚧 Coming Soon!</Text>
      </View>
    </SafeAreaView>
  );
};
export default ProductDetailScreen;