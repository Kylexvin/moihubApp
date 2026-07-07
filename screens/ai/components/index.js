// screens/ai/components/index.js
import RentalCard from './RentalCard';
import RentalList from './RentalList';
import ServiceCard from './ServiceCard';
import ServiceList from './ServiceList';
import FoodCard from './FoodCard';
import FoodList from './FoodList';

export const renderAIMessage = (message, onViewDetails) => {
  const { data, module } = message;

  if (!data) return null;

  // Rentals Module
  if (module === 'rentals') {
    if (data.rentals && data.rentals.length > 0) {
      if (data.rentals.length > 1) {
        return <RentalList data={data} onViewDetails={onViewDetails} />;
      }
      return <RentalCard data={data} onViewDetails={onViewDetails} />;
    }
  }

  // Services Module
  if (module === 'services') {
    if (data.providers && data.providers.length > 0) {
      if (data.providers.length > 1) {
        return <ServiceList data={data} onViewDetails={onViewDetails} />;
      }
      return <ServiceCard data={data} onViewDetails={onViewDetails} />;
    }
  }

  // Food Module
  if (module === 'food') {
    if (data.foodVendors && data.foodVendors.length > 0) {
      if (data.foodVendors.length > 1) {
        return <FoodList data={data} onViewDetails={onViewDetails} />;
      }
      return <FoodCard data={data} onViewDetails={onViewDetails} />;
    }
  }

  return null;
};

export { 
  RentalCard, 
  RentalList, 
  ServiceCard, 
  ServiceList,
  FoodCard,
  FoodList
};