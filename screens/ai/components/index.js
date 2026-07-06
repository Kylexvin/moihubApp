// screens/ai/components/index.js
import RentalCard from './RentalCard';
import RentalList from './RentalList';

export const renderAIMessage = (message, onViewDetails) => {
  const { data, module } = message;

  if (!data) return null;

  // Rentals Module
  if (module === 'rentals' || module === 'general') {
    if (data.rentals && data.rentals.length > 0) {
      // Show as list if multiple rentals
      if (data.rentals.length > 1) {
        return <RentalList data={data} onViewDetails={onViewDetails} />;
      }
      // Show as card if single rental
      return <RentalCard data={data} onViewDetails={onViewDetails} />;
    }
  }

  return null;
};

export { RentalCard, RentalList };