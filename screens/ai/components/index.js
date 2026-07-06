import RentalCard from './RentalCard';
import RentalList from './RentalList';

// Component registry - maps module to components
const componentMap = {
  rentals: {
    single: RentalCard,
    list: RentalList,
  },
  // Future modules
  // food: {
  //   single: FoodCard,
  //   list: FoodList,
  // },
};

/**
 * Render AI message with appropriate UI component
 */
export const renderAIMessage = (message, onViewDetails) => {
  const { module, data } = message;
  
  // If no data or no items, show nothing
  if (!data || !data.count || data.count === 0) {
    return null;
  }

  // Get module components
  const moduleComponents = componentMap[module];
  if (!moduleComponents) {
    return null;
  }

  // Choose component based on count
  const Component = data.count === 1 
    ? moduleComponents.single 
    : moduleComponents.list;

  if (!Component) {
    return null;
  }

  return <Component data={data} onViewDetails={onViewDetails} />;
};

export { RentalCard, RentalList };