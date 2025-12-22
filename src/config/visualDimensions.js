/**
 * Dimensions finales pour chaque type de visuel
 * Utilisé pour la conversion % -> pixels et la génération des exports
 */

export const VISUAL_DIMENSIONS = {
  'affiche': {
    width: 2480,
    height: 3508,
    dpi: 300,
    format: 'A4 portrait',
    pdf: { width: 210, height: 297 }
  },
  'flyer-recto': {
    width: 1748,
    height: 2480,
    dpi: 300,
    format: 'A5 portrait',
    pdf: { width: 148, height: 210 }
  },
  'flyer-verso': {
    width: 1748,
    height: 2480,
    dpi: 300,
    format: 'A5 portrait',
    pdf: { width: 148, height: 210 }
  },
  'post-rs': {
    width: 1080,
    height: 1080,
    dpi: 72,
    format: 'Instagram carré',
    pdf: { width: 210, height: 210 }
  },
  'post-rs-45': {
    width: 1080,
    height: 1350,
    dpi: 72,
    format: 'Instagram 4:5',
    pdf: { width: 210, height: 262.5 }
  },
  'storie': {
    width: 1080,
    height: 1920,
    dpi: 72,
    format: 'Instagram story',
    pdf: { width: 210, height: 373.33 }
  },
  'communique': {
    width: 2480,
    height: 3508,
    dpi: 300,
    format: 'A4 portrait',
    pdf: { width: 210, height: 297 }
  }
};

/**
 * Récupère les dimensions pour un type de visuel donné
 * @param {string} visualType - Le type de visuel (affiche, flyer-recto, etc.)
 * @returns {object} Les dimensions du visuel
 */
export const getDimensions = (visualType) => {
  return VISUAL_DIMENSIONS[visualType] || VISUAL_DIMENSIONS['affiche'];
};

/**
 * Calcule le ratio d'aspect pour un type de visuel
 * @param {string} visualType - Le type de visuel
 * @returns {number} Le ratio largeur/hauteur
 */
export const getAspectRatio = (visualType) => {
  const dims = getDimensions(visualType);
  return dims.width / dims.height;
};

/**
 * Convertit une valeur en pourcentage en pixels
 * @param {number} percentage - La valeur en pourcentage
 * @param {number} dimension - La dimension de référence en pixels
 * @returns {number} La valeur en pixels
 */
export const percentToPixels = (percentage, dimension) => {
  return (percentage / 100) * dimension;
};

/**
 * Convertit une valeur en pixels en pourcentage
 * @param {number} pixels - La valeur en pixels
 * @param {number} dimension - La dimension de référence en pixels
 * @returns {number} La valeur en pourcentage
 */
export const pixelsToPercent = (pixels, dimension) => {
  return (pixels / dimension) * 100;
};
