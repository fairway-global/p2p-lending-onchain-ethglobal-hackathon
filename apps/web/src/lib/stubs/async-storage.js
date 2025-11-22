// Stub module for @react-native-async-storage/async-storage
// This is only used to satisfy webpack imports from @metamask/sdk
// In a web environment, we don't actually need this functionality

export default {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
  getAllKeys: async () => [],
  multiGet: async () => [],
  multiSet: async () => {},
  multiRemove: async () => {},
};

