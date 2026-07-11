// screens/ai/components/index.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import RentalCard from './RentalCard';
import RentalList from './RentalList';
import ServiceCard from './ServiceCard';
import ServiceList from './ServiceList';
import FoodCard from './FoodCard';
import FoodList from './FoodList';
import FoodDetailCard from './FoodDetailCard';  
import MarketplaceCard from './MarketplaceCard';
import MarketplaceList from './MarketplaceList';
import EshopCard from './EshopCard';
import EshopList from './EshopList';
import EshopProductCard from './EshopProductCard';
import EshopProductList from './EshopProductList';
import RoommateCard from './RoommateCard';     
import RoommateList from './RoommateList';      



export const renderAIMessage = (message, onViewDetails, onCall, onViewMore) => {
  const { data } = message;

  if (!data) return null;

  // ─── MIXED MODULES ──────────────────────────────────────────────────────
  if (data.modules && data.modules.length > 1) {
    return (
      <View style={styles.mixedContainer}>
        {/* Rentals */}
        {data.modules.includes('rentals') && data.rentals?.length > 0 && (
          <View style={styles.moduleSection}>
            <RentalList 
              data={{ rentals: data.rentals }} 
              onViewDetails={onViewDetails}
              onViewMore={onViewMore}
            />
          </View>
        )}

        {/* Food */}
        {data.modules.includes('food') && data.foodVendors?.length > 0 && (
          <View style={styles.moduleSection}>
            <FoodList 
              data={{ foodVendors: data.foodVendors }} 
              onViewDetails={onViewDetails} 
              onCall={onCall}
              onViewMore={onViewMore}
            />
          </View>
        )}

        {/* Services */}
        {data.modules.includes('services') && data.providers?.length > 0 && (
          <View style={styles.moduleSection}>
            <ServiceList data={{ providers: data.providers }} onViewDetails={onViewDetails} onCall={onCall} />
          </View>
        )}

        {/* Marketplace */}
        {data.modules.includes('marketplace') && data.marketplaceItems?.length > 0 && (
          <View style={styles.moduleSection}>
            <MarketplaceList 
              data={{ items: data.marketplaceItems, type: data.marketplaceType }} 
              onViewDetails={onViewDetails} 
              onCall={onCall}
              onViewMore={onViewMore}
            />
          </View>
        )}

        {/* Eshops */}
        {data.modules.includes('eshops') && data.eshops?.length > 0 && (
          <View style={styles.moduleSection}>
            <EshopList 
              data={{ eshops: data.eshops }} 
              onViewDetails={onViewDetails} 
              onCall={onCall}
              onViewMore={onViewMore}
            />
          </View>
        )}

        {/* Eshop Products */}
        {data.modules.includes('eshops') && data.eshopProducts?.length > 0 && (
          <View style={styles.moduleSection}>
            <EshopProductList 
              data={{ eshopProducts: data.eshopProducts }} 
              onViewDetails={onViewDetails} 
              onCall={onCall}
              onViewMore={onViewMore}
            />
          </View>
        )}

        {/* Roommate */}
        {data.modules.includes('roommate') && data.roommates?.length > 0 && (
          <View style={styles.moduleSection}>
            <RoommateList 
              data={{ roommates: data.roommates }} 
              onViewDetails={onViewDetails} 
              onCall={onCall}
              onViewMore={onViewMore}
            />
          </View>
        )}
      </View>
    );
  }

  // ─── SINGLE MODULE ──────────────────────────────────────────────────────
  const module = data.module;

  // Rentals
  if (module === 'rentals') {
    if (data.rentals?.length > 0) {
      if (data.rentals.length > 1) {
        return <RentalList 
          data={{ rentals: data.rentals }} 
          onViewDetails={onViewDetails}
          onViewMore={onViewMore}
        />;
      }
      return <RentalCard data={{ rentals: data.rentals }} onViewDetails={onViewDetails} />;
    }
  }

  // Services
  if (module === 'services') {
    if (data.providers?.length > 0) {
      if (data.providers.length > 1) {
        return <ServiceList data={{ providers: data.providers }} onViewDetails={onViewDetails} onCall={onCall} />;
      }
      return <ServiceCard data={{ providers: data.providers }} onViewDetails={onViewDetails} onCall={onCall} />;
    }
  }

  // Food
  if (module === 'food') {
    if (data.isDetails && data.foodVendor) {
      return <FoodDetailCard data={data.foodVendor} onViewDetails={onViewDetails} onCall={onCall} />;
    }
    if (data.foodVendors?.length > 0) {
      if (data.foodVendors.length > 1) {
        return <FoodList 
          data={{ foodVendors: data.foodVendors }} 
          onViewDetails={onViewDetails} 
          onCall={onCall}
          onViewMore={onViewMore}
        />;
      }
      return <FoodCard 
        data={{ foodVendors: data.foodVendors }} 
        onViewDetails={onViewDetails} 
        onCall={onCall} 
      />;
    }
  }

  // Marketplace
  if (module === 'marketplace') {
    if (data.marketplaceItems?.length > 0) {
      if (data.marketplaceItems.length > 1) {
        return <MarketplaceList 
          data={{ items: data.marketplaceItems, type: data.marketplaceType }} 
          onViewDetails={onViewDetails} 
          onCall={onCall}
          onViewMore={onViewMore}
        />;
      }
      return <MarketplaceCard 
        data={{ items: data.marketplaceItems, type: data.marketplaceType }} 
        onViewDetails={onViewDetails} 
        onCall={onCall} 
      />;
    }
  }

  // Eshops - Shops
  if (module === 'eshops') {
    if (data.eshops?.length > 0) {
      if (data.eshops.length > 1) {
        return <EshopList 
          data={{ eshops: data.eshops }} 
          onViewDetails={onViewDetails} 
          onCall={onCall}
          onViewMore={onViewMore}
        />;
      }
      return <EshopCard 
        data={{ eshops: data.eshops }} 
        onViewDetails={onViewDetails} 
        onCall={onCall} 
      />;
    }
  }

  // Eshop Products
  if (data.eshopProducts?.length > 0) {
    if (data.eshopProducts.length > 1) {
      return <EshopProductList 
        data={{ eshopProducts: data.eshopProducts }} 
        onViewDetails={onViewDetails} 
        onCall={onCall}
        onViewMore={onViewMore}
      />;
    }
    return <EshopProductCard 
      data={{ eshopProducts: data.eshopProducts }} 
      onViewDetails={onViewDetails} 
      onCall={onCall} 
    />;
  }

  // ─── Roommate ──────────────────────────────────────────────────────────
  if (module === 'roommate') {
    if (data.roommates?.length > 0) {
      if (data.roommates.length > 1) {
        return <RoommateList 
          data={{ roommates: data.roommates }} 
          onViewDetails={onViewDetails} 
          onCall={onCall}
          onViewMore={onViewMore}
        />;
      }
      return <RoommateCard 
        data={{ roommates: data.roommates }} 
        onViewDetails={onViewDetails} 
        onCall={onCall} 
      />;
    }
  }

  return null;
};

const styles = StyleSheet.create({
  mixedContainer: {
    marginVertical: 4,
  },
  moduleSection: {
    marginBottom: 8,
  },
});

export { 
  RentalCard, 
  RentalList, 
  ServiceCard, 
  ServiceList,
  FoodCard,
  FoodList,
  FoodDetailCard,  
  MarketplaceCard,
  MarketplaceList,
  EshopCard,
  EshopList,
  EshopProductCard,   
  EshopProductList,
  RoommateCard,      
  RoommateList,      
};