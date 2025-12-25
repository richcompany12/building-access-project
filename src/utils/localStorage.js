export const getLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    console.log(`Retrieved from localStorage - Key: ${key}, Raw Value:`, item);
    const parsedItem = item ? JSON.parse(item) : null;
    console.log(`Parsed Value:`, parsedItem);
    return parsedItem;
  } catch (error) {
    console.error('Error getting from localStorage:', error);
    return null;
  }
};

export const setLocalStorage = (key, value) => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    console.log(`Saved to localStorage - Key: ${key}, Value:`, value);
    console.log(`Stringified Value:`, stringValue);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};