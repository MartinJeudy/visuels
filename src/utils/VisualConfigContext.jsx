/**
 * Contexte React pour gérer les configurations des visuels Hormur
 * Fournit un accès global aux configurations et aux utilitaires
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadVisualConfig,
  loadAllConfigs,
  getConfigValue as getConfigValueUtil,
  configToStyle,
  configToPixelStyle,
  mergeWithSavedConfig,
  exportConfig,
  importConfig
} from './configUtils.js';

// Créer le contexte
const VisualConfigContext = createContext(null);

/**
 * Provider pour le contexte de configuration des visuels
 */
export const VisualConfigProvider = ({ children, isDev = false }) => {
  // Charger les configurations par défaut depuis les fichiers JSON
  const defaultConfigs = useMemo(() => loadAllConfigs(false), []);
  const defaultConfigsBW = useMemo(() => loadAllConfigs(true), []);

  // État pour les configurations personnalisées (mode développeur - couleur)
  const [devConfigs, setDevConfigs] = useState(() => {
    if (!isDev) return {};

    const saved = localStorage.getItem('hormur_dev_configs');
    if (saved) {
      try {
        const savedConfigs = JSON.parse(saved);
        return mergeWithSavedConfig(defaultConfigs, savedConfigs);
      } catch (e) {
        console.error('Erreur parsing configs sauvegardées:', e);
        return defaultConfigs;
      }
    }

    return defaultConfigs;
  });

  // État pour les configurations N&B (mode développeur)
  const [devConfigsBW, setDevConfigsBW] = useState(() => {
    if (!isDev) return {};

    const saved = localStorage.getItem('hormur_dev_configs_bw');
    if (saved) {
      try {
        const savedConfigs = JSON.parse(saved);
        return mergeWithSavedConfig(defaultConfigsBW, savedConfigs);
      } catch (e) {
        console.error('Erreur parsing configs N&B sauvegardées:', e);
        return defaultConfigsBW;
      }
    }

    return defaultConfigsBW;
  });

  // Sauvegarder automatiquement les configurations
  useEffect(() => {
    if (isDev && Object.keys(devConfigs).length > 0) {
      localStorage.setItem('hormur_dev_configs', JSON.stringify(devConfigs));
    }
  }, [devConfigs, isDev]);

  useEffect(() => {
    if (isDev && Object.keys(devConfigsBW).length > 0) {
      localStorage.setItem('hormur_dev_configs_bw', JSON.stringify(devConfigsBW));
    }
  }, [devConfigsBW, isDev]);

  /**
   * Récupère la configuration pour un type de visuel donné
   */
  const getConfig = useCallback((visualType, isBlackAndWhite = false, variant = null) => {
    if (isDev) {
      const configs = isBlackAndWhite ? devConfigsBW : devConfigs;
      return configs[visualType] || loadVisualConfig(visualType, variant, isBlackAndWhite);
    }
    return loadVisualConfig(visualType, variant, isBlackAndWhite);
  }, [isDev, devConfigs, devConfigsBW]);

  /**
   * Récupère la valeur d'une propriété de configuration
   */
  const getConfigValue = useCallback((visualType, element, property, defaultValue = null, isBlackAndWhite = false, variant = null) => {
    const config = getConfig(visualType, isBlackAndWhite, variant);
    return config[element]?.[property] ?? defaultValue;
  }, [getConfig]);

  /**
   * Convertit une configuration en style CSS
   */
  const getElementStyle = useCallback((visualType, element, overrides = {}, isBlackAndWhite = false, variant = null) => {
    if (isDev) {
      const config = getConfig(visualType, isBlackAndWhite, variant);
      const elementConfig = { ...config[element], ...overrides };

      if (!elementConfig) return {};

      const style = {};

      // Propriétés de positionnement (%)
      const positionProps = ['top', 'left', 'right', 'bottom'];
      positionProps.forEach(prop => {
        if (elementConfig[prop] !== undefined) {
          style[prop] = `${elementConfig[prop]}%`;
        }
      });

      // Propriétés de dimension
      if (elementConfig.width !== undefined) {
        style.width = `${elementConfig.width}%`;
      }
      if (elementConfig.height !== undefined && typeof elementConfig.height === 'number' && elementConfig.height > 100) {
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

      // QR code
      if (elementConfig.size !== undefined) {
        style.width = `${elementConfig.size}px`;
        style.height = `${elementConfig.size}px`;
      }

      return style;
    }

    return configToStyle(visualType, element, overrides, variant, isBlackAndWhite);
  }, [isDev, getConfig]);

  /**
   * Convertit une configuration en style avec pixels (pour téléchargement)
   */
  const getElementPixelStyle = useCallback((visualType, element, overrides = {}, isBlackAndWhite = false, variant = null) => {
    return configToPixelStyle(visualType, element, overrides, variant, isBlackAndWhite);
  }, []);

  /**
   * Met à jour une configuration (mode développeur)
   */
  const updateConfig = useCallback((visualType, element, property, value, isBlackAndWhite = false) => {
    if (!isDev) return;

    const setConfig = isBlackAndWhite ? setDevConfigsBW : setDevConfigs;

    setConfig(prev => ({
      ...prev,
      [visualType]: {
        ...prev[visualType],
        [element]: {
          ...prev[visualType]?.[element],
          [property]: value
        }
      }
    }));
  }, [isDev]);

  /**
   * Exporte une configuration
   */
  const handleExportConfig = useCallback((visualType, isBlackAndWhite = false) => {
    const config = getConfig(visualType, isBlackAndWhite);
    return exportConfig(visualType, config);
  }, [getConfig]);

  /**
   * Importe une configuration
   */
  const handleImportConfig = useCallback((jsonString, isBlackAndWhite = false) => {
    const imported = importConfig(jsonString);
    if (imported) {
      const setConfig = isBlackAndWhite ? setDevConfigsBW : setDevConfigs;
      setConfig(prev => ({ ...prev, ...imported }));
      return true;
    }
    return false;
  }, []);

  /**
   * Réinitialise les configurations aux valeurs par défaut
   */
  const resetConfigs = useCallback((isBlackAndWhite = false) => {
    const setConfig = isBlackAndWhite ? setDevConfigsBW : setDevConfigs;
    const defaults = isBlackAndWhite ? defaultConfigsBW : defaultConfigs;
    setConfig(defaults);

    if (isBlackAndWhite) {
      localStorage.removeItem('hormur_dev_configs_bw');
    } else {
      localStorage.removeItem('hormur_dev_configs');
    }
  }, [defaultConfigs, defaultConfigsBW]);

  const contextValue = {
    // Configurations
    defaultConfigs,
    defaultConfigsBW,
    devConfigs,
    devConfigsBW,

    // Fonctions de récupération
    getConfig,
    getConfigValue,
    getElementStyle,
    getElementPixelStyle,

    // Fonctions de modification (mode dev)
    updateConfig,
    resetConfigs,

    // Import/Export
    exportConfig: handleExportConfig,
    importConfig: handleImportConfig,

    // État
    isDev
  };

  return (
    <VisualConfigContext.Provider value={contextValue}>
      {children}
    </VisualConfigContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte de configuration
 */
export const useVisualConfig = () => {
  const context = useContext(VisualConfigContext);

  if (!context) {
    throw new Error('useVisualConfig doit être utilisé dans un VisualConfigProvider');
  }

  return context;
};

/**
 * Hook simplifié pour récupérer un style d'élément
 * @param {string} visualType - Le type de visuel
 * @param {string} element - Le nom de l'élément
 * @param {object} options - Options (overrides, isBlackAndWhite, variant)
 * @returns {object} Le style CSS de l'élément
 */
export const useElementStyle = (visualType, element, options = {}) => {
  const { getElementStyle } = useVisualConfig();
  const { overrides = {}, isBlackAndWhite = false, variant = null } = options;

  return useMemo(
    () => getElementStyle(visualType, element, overrides, isBlackAndWhite, variant),
    [getElementStyle, visualType, element, overrides, isBlackAndWhite, variant]
  );
};

/**
 * Hook simplifié pour récupérer une valeur de configuration
 * @param {string} visualType - Le type de visuel
 * @param {string} element - Le nom de l'élément
 * @param {string} property - La propriété
 * @param {any} defaultValue - Valeur par défaut
 * @param {object} options - Options (isBlackAndWhite, variant)
 * @returns {any} La valeur de la propriété
 */
export const useConfigValue = (visualType, element, property, defaultValue = null, options = {}) => {
  const { getConfigValue } = useVisualConfig();
  const { isBlackAndWhite = false, variant = null } = options;

  return useMemo(
    () => getConfigValue(visualType, element, property, defaultValue, isBlackAndWhite, variant),
    [getConfigValue, visualType, element, property, defaultValue, isBlackAndWhite, variant]
  );
};

export default VisualConfigContext;
