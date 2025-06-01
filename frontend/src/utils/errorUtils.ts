/**
 * Safely extracts an error message from an API error response
 * Prevents React rendering errors when error is an object
 */
export const extractErrorMessage = (err: any, defaultMessage: string): string => {
  if (err.response?.data) {
    if (typeof err.response.data === 'string') {
      return err.response.data;
    } else if (err.response.data.detail) {
      return typeof err.response.data.detail === 'string' 
        ? err.response.data.detail 
        : JSON.stringify(err.response.data.detail);
    } else if (err.response.data.message) {
      return typeof err.response.data.message === 'string'
        ? err.response.data.message
        : JSON.stringify(err.response.data.message);
    } else {
      return JSON.stringify(err.response.data);
    }
  }
  return defaultMessage;
};
