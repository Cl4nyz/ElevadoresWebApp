/**
 * Utility function to handle nested form data changes
 * @param {Object} formData - Current form data state
 * @param {function} setFormData - State setter function
 * @param {string|null} section - Section name (null for root level)
 * @param {string} field - Field name
 * @param {any} value - New value
 */
export const handleFormDataChange = (formData, setFormData, section, field, value) => {
  if (section) {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    });
  } else {
    setFormData({
      ...formData,
      [field]: value
    });
  }
};

/**
 * Utility function to handle array updates in form data
 * @param {Object} formData - Current form data state
 * @param {function} setFormData - State setter function
 * @param {string} arrayField - Array field name
 * @param {number} index - Array index
 * @param {string} field - Field name within array item
 * @param {any} value - New value
 */
export const handleArrayFieldChange = (formData, setFormData, arrayField, index, field, value) => {
  const newArray = [...formData[arrayField]];
  newArray[index] = { ...newArray[index], [field]: value };
  setFormData({ ...formData, [arrayField]: newArray });
};

/**
 * Utility function to add item to array in form data
 * @param {Object} formData - Current form data state
 * @param {function} setFormData - State setter function
 * @param {string} arrayField - Array field name
 * @param {Object} defaultItem - Default item structure
 */
export const addArrayItem = (formData, setFormData, arrayField, defaultItem) => {
  setFormData({
    ...formData,
    [arrayField]: [...formData[arrayField], defaultItem]
  });
};

/**
 * Utility function to remove item from array in form data
 * @param {Object} formData - Current form data state
 * @param {function} setFormData - State setter function
 * @param {string} arrayField - Array field name
 * @param {number} index - Index to remove
 */
export const removeArrayItem = (formData, setFormData, arrayField, index) => {
  const newArray = formData[arrayField].filter((_, i) => i !== index);
  setFormData({ ...formData, [arrayField]: newArray });
};