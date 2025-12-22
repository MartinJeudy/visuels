/**
 * Utilitaires pour gérer les configurations des visuels Hormur
 * Gère le chargement, la fusion et l'application des configurations JSON
 */

import visualConfigData from '../config/hormur-visual-config.json';
import visualConfigDataBW from '../config/hormur-visual-config-bw.json';
import { getDimensions, percentToPixels } from '../config/visualDimensions.js';

/**
 * Charge la configuration pour un type de visuel donné
 * @param {string} visualType - Le type de visuel (affiche, flyer-recto, etc.)
 * @param {string} variant - La variante optionnelle (pour gérer les différences de téléchargement)
 * @param {boolean} isBlackAndWhite - Si vrai, charge la configuration noir et blanc
 * @returns {object} La configuration du visuel
 */
export const loadVisualConfig = (visualType, variant = null, isBlackAndWhite = false) => {
  try {
    const configData = isBlackAndWhite ? visualConfigDataBW : visualConfigData;
    const baseConfig = configData[visualType] || {};

    // Si une variante est spécifiée, fusionner avec les overrides
    if (variant && configData._variants && configData._variants[variant]) {
      const variantOverrides = configData._variants[variant][visualType];
      if (variantOverrides) {
        return deepMerge(baseConfig, variantOverrides);
      }
    }

    return baseConfig;
  } catch (error) {
    console.error(`Erreur lors du chargement de la configuration pour ${visualType}:`, error);
    return {};
  }
};

/**
 * Fusionne profondément deux objets
 * @param {object} target - L'objet cible
 * @param {object} source - L'objet source
 * @returns {object} L'objet fusionné
 */
const deepMerge = (target, source) => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
};

/**
 * Vérifie si une valeur est un objet
 */
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Récupère la valeur d'une propriété de configuration pour un élément donné
 * @param {string} visualType - Le type de visuel
 * @param {string} element - Le nom de l'élément (logo, title, etc.)
 * @param {string} property - La propriété (top, left, fontSize, etc.)
 * @param {any} defaultValue - La valeur par défaut si non trouvée
 * @param {string} variant - La variante optionnelle
 * @param {boolean} isBlackAndWhite - Si vrai, utilise la configuration noir et blanc
 * @returns {any} La valeur de la propriété
 */
export const getConfigValue = (visualType, element, property, defaultValue = null, variant = null, isBlackAndWhite = false) => {
  const config = loadVisualConfig(visualType, variant, isBlackAndWhite);

  if (!config[element]) {
    return defaultValue;
  }

  return config[element][property] !== undefined ? config[element][property] : defaultValue;
};

/**
 * Convertit une configuration en pourcentage en style CSS
 * Applique automatiquement les conversions nécessaires
 * @param {string} visualType - Le type de visuel
 * @param {string} element - Le nom de l'élément
 * @param {object} overrides - Surcharges optionnelles de la config
 * @param {string} variant - La variante optionnelle
 * @param {boolean} isBlackAndWhite - Si vrai, utilise la configuration noir et blanc
 * @returns {object} Un objet de styles CSS prêt à l'emploi
 */
export const configToStyle = (visualType, element, overrides = {}, variant = null, isBlackAndWhite = false) => {
  const config = loadVisualConfig(visualType, variant, isBlackAndWhite);
  const elementConfig = { ...config[element], ...overrides };

  if (!elementConfig) {
    return {};
  }

  const style = {};

  // Propriétés de positionnement (%)
  const positionProps = ['top', 'left', 'right', 'bottom'];
  positionProps.forEach(prop => {
    if (elementConfig[prop] !== undefined) {
      style[prop] = `${elementConfig[prop]}%`;
    }
  });

  // Propriétés de dimension (%)
  if (elementConfig.width !== undefined) {
    style.width = `${elementConfig.width}%`;
  }
  if (elementConfig.height !== undefined && typeof elementConfig.height === 'number' && elementConfig.height > 100) {
    // Si height > 100, c'est probablement en pixels (pour les logos)
    style.height = `${elementConfig.height}px`;
  } else if (elementConfig.height !== undefined) {
    style.height = `${elementConfig.height}%`;
  }

  // Propriétés de typographie
  if (elementConfig.fontSize !== undefined) {
    style.fontSize = `${elementConfig.fontSize}px`;
  }
  if (elementConfig.fontWeight !== undefined) {
    style.fontWeight = elementConfig.fontWeight;
  }
  if (elementConfig.letterSpacing !== undefined) {
    style.letterSpacing = `${elementConfig.letterSpacing}px`;
  }

  // Propriétés d'espacement
  if (elementConfig.padding !== undefined) {
    style.padding = `${elementConfig.padding}px`;
  }
  if (elementConfig.paddingBottom !== undefined) {
    style.paddingBottom = `${elementConfig.paddingBottom}%`;
  }
  if (elementConfig.marginBottom !== undefined) {
    style.marginBottom = `${elementConfig.marginBottom}px`;
  }

  // Propriétés visuelles
  if (elementConfig.opacity !== undefined) {
    style.opacity = elementConfig.opacity;
  }

  // Propriété spéciale pour les QR codes
  if (elementConfig.size !== undefined) {
    style.width = `${elementConfig.size}px`;
    style.height = `${elementConfig.size}px`;
  }

  return style;
};

/**
 * Convertit une configuration pour le rendu haute résolution (téléchargement)
 * Convertit les pourcentages en pixels basés sur les dimensions finales
 * @param {string} visualType - Le type de visuel
 * @param {string} element - Le nom de l'élément
 * @param {object} overrides - Surcharges optionnelles
 * @param {string} variant - La variante optionnelle
 * @param {boolean} isBlackAndWhite - Si vrai, utilise la configuration noir et blanc
 * @returns {object} Un objet de styles avec valeurs en pixels
 */
export const configToPixelStyle = (visualType, element, overrides = {}, variant = null, isBlackAndWhite = false) => {
  const config = loadVisualConfig(visualType, variant, isBlackAndWhite);
  const elementConfig = { ...config[element], ...overrides };
  const dimensions = getDimensions(visualType);

  if (!elementConfig) {
    return {};
  }

  const style = {};

  // Convertir les positions en pixels
  if (elementConfig.top !== undefined) {
    style.top = `${percentToPixels(elementConfig.top, dimensions.height)}px`;
  }
  if (elementConfig.bottom !== undefined) {
    style.bottom = `${percentToPixels(elementConfig.bottom, dimensions.height)}px`;
  }
  if (elementConfig.left !== undefined) {
    style.left = `${percentToPixels(elementConfig.left, dimensions.width)}px`;
  }
  if (elementConfig.right !== undefined) {
    style.right = `${percentToPixels(elementConfig.right, dimensions.width)}px`;
  }

  // Convertir les dimensions en pixels
  if (elementConfig.width !== undefined) {
    style.width = `${percentToPixels(elementConfig.width, dimensions.width)}px`;
  }
  if (elementConfig.height !== undefined && typeof elementConfig.height === 'number' && elementConfig.height > 100) {
    // Si height > 100, c'est déjà en pixels
    style.height = `${elementConfig.height}px`;
  } else if (elementConfig.height !== undefined) {
    style.height = `${percentToPixels(elementConfig.height, dimensions.height)}px`;
  }

  // Les propriétés typographiques et visuelles restent identiques
  if (elementConfig.fontSize !== undefined) {
    style.fontSize = `${elementConfig.fontSize}px`;
  }
  if (elementConfig.fontWeight !== undefined) {
    style.fontWeight = elementConfig.fontWeight;
  }
  if (elementConfig.letterSpacing !== undefined) {
    style.letterSpacing = `${elementConfig.letterSpacing}px`;
  }
  if (elementConfig.padding !== undefined) {
    style.padding = `${elementConfig.padding}px`;
  }
  if (elementConfig.paddingBottom !== undefined) {
    style.paddingBottom = `${percentToPixels(elementConfig.paddingBottom, dimensions.height)}px`;
  }
  if (elementConfig.marginBottom !== undefined) {
    style.marginBottom = `${elementConfig.marginBottom}px`;
  }
  if (elementConfig.opacity !== undefined) {
    style.opacity = elementConfig.opacity;
  }
  if (elementConfig.size !== undefined) {
    style.width = `${elementConfig.size}px`;
    style.height = `${elementConfig.size}px`;
  }

  return style;
};

/**
 * Fusionne les configurations sauvegardées (mode dev) avec les configurations par défaut
 * @param {object} defaultConfigs - Les configurations par défaut
 * @param {object} savedConfigs - Les configurations sauvegardées
 * @returns {object} Les configurations fusionnées
 */
export const mergeWithSavedConfig = (defaultConfigs, savedConfigs) => {
  const merged = {};

  Object.keys(defaultConfigs).forEach(visualId => {
    merged[visualId] = {
      ...defaultConfigs[visualId],
      ...(savedConfigs[visualId] || {})
    };

    // Fusionner aussi au niveau des éléments
    Object.keys(defaultConfigs[visualId] || {}).forEach(element => {
      merged[visualId][element] = {
        ...defaultConfigs[visualId][element],
        ...(savedConfigs[visualId]?.[element] || {})
      };
    });
  });

  return merged;
};

/**
 * Charge toutes les configurations pour tous les types de visuels
 * @param {boolean} isBlackAndWhite - Si vrai, charge les configurations noir et blanc
 * @returns {object} Toutes les configurations
 */
export const loadAllConfigs = (isBlackAndWhite = false) => {
  const visualTypes = ['affiche', 'flyer-recto', 'flyer-verso', 'post-rs', 'post-rs-45', 'storie', 'communique'];
  const configs = {};

  visualTypes.forEach(type => {
    configs[type] = loadVisualConfig(type, null, isBlackAndWhite);
  });

  return configs;
};

/**
 * Valide une configuration
 * @param {object} config - La configuration à valider
 * @returns {boolean} True si la configuration est valide
 */
export const validateConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return false;
  }

  // Vérifier qu'au moins un élément est défini
  return Object.keys(config).length > 0;
};

/**
 * Exporte une configuration au format JSON
 * @param {string} visualType - Le type de visuel
 * @param {object} config - La configuration à exporter
 * @returns {string} La configuration au format JSON
 */
export const exportConfig = (visualType, config) => {
  return JSON.stringify({ [visualType]: config }, null, 2);
};

/**
 * Importe une configuration depuis JSON
 * @param {string} jsonString - La chaîne JSON à importer
 * @returns {object} La configuration importée
 */
export const importConfig = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Erreur lors de l\'importation de la configuration:', error);
    return null;
  }
};
