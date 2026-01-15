import { useState, useRef, memo, useCallback, useEffect } from 'react';
import { ArrowLeft, Download, ImagePlus, Palette, Type, FileText, X, Eye, Edit3, Home, Mail, CreditCard, Check, Move, ZoomIn, Upload, Settings, Save, Info, Server } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { domToPng, domToJpeg, domToCanvas } from 'modern-screenshot';
import jsPDF from 'jspdf';
import { loadAllConfigs, mergeWithSavedConfig, loadVisualConfig } from './utils/configUtils.js';
import { VISUAL_DIMENSIONS } from './config/visualDimensions.js';

// ============================================================
// FEATURE FLAGS - Fonctionnalités activables/désactivables
// ============================================================
// Pour activer le bouton Envoyer : changer false en true
const ENABLE_SEND_BUTTON = false;
// Pour activer la page de maintenance : changer false en true
const UNDER_MAINTENANCE = false;
// ============================================================

// Fonction utilitaire pour compresser les images base64
// Réduit la taille pour éviter les erreurs QuotaExceededError du localStorage
const compressImage = (base64Image, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    // Si ce n'est pas une image base64, retourner tel quel
    if (!base64Image || !base64Image.startsWith('data:image')) {
      resolve(base64Image);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // Calculer les nouvelles dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Créer un canvas pour redimensionner
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en JPEG avec la qualité spécifiée
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.onerror = () => {
      // En cas d'erreur, retourner l'image originale
      resolve(base64Image);
    };
    img.src = base64Image;
  });
};

// Fonction pour sauvegarder l'image avec gestion des erreurs de quota
const saveImageToLocalStorage = async (image) => {
  if (!image) return true;

  try {
    localStorage.setItem('hormur_uploaded_image', image);
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.warn('⚠️ Image trop grande, tentative de compression...');

      // Essayer avec une compression progressive
      const compressionLevels = [
        { maxWidth: 1200, quality: 0.7 },
        { maxWidth: 1000, quality: 0.6 },
        { maxWidth: 800, quality: 0.5 },
        { maxWidth: 600, quality: 0.4 }
      ];

      for (const level of compressionLevels) {
        try {
          const compressed = await compressImage(image, level.maxWidth, level.quality);
          localStorage.setItem('hormur_uploaded_image', compressed);
          console.log(`✅ Image compressée avec succès (${level.maxWidth}px, qualité ${level.quality})`);
          return true;
        } catch (compressError) {
          if (compressError.name !== 'QuotaExceededError') {
            console.error('Erreur de compression:', compressError);
            return false;
          }
          // Continuer avec le niveau de compression suivant
        }
      }

      // Si même la compression maximale ne fonctionne pas
      console.error('❌ Image trop grande même après compression maximale');
      return false;
    }
    console.error('Erreur localStorage:', e);
    return false;
  }
};

// Mode développeur activé via URL: ?dev=true
const isDev = new URLSearchParams(window.location.search).get('dev') === 'true';

// Vider le localStorage si demandé via URL: ?clearStorage=true
if (new URLSearchParams(window.location.search).get('clearStorage') === 'true') {
  console.log('🧹 Nettoyage du localStorage des configurations...');
  localStorage.removeItem('hormur_dev_configs');
  localStorage.removeItem('hormur_dev_configs_bw');
  console.log('✅ Configurations réinitialisées ! Rechargez la page sans le paramètre clearStorage.');
  alert('✅ Configurations réinitialisées !\n\nLes configurations ont été supprimées du localStorage.\nLa page va se recharger pour appliquer les configurations par défaut.');
  // Retirer le paramètre clearStorage de l'URL et recharger
  const url = new URL(window.location);
  url.searchParams.delete('clearStorage');
  window.location.href = url.toString();
}

// Capturer le referrer au chargement pour le bouton retour
const initialReferrer = document.referrer;

const hormurColors = [
  {
    name: 'Bleu Océan',
    value: '#1380c7',
    text: '#feb7db',
    postTemplate: 'PostPRO_CONCERT_1_bleu.png',
    afficheTemplate: 'Affiche Bleue.png',
    flyerTemplate: 'Flyer Bleu.png',
    rsTemplate: 'Cadre RS carre bleu.png',
    rs45Template: 'Cadre bleu RS.png',
    storieTemplate: 'Storie Bleue.png'
  },
  {
    name: 'Vert Émeraude',
    value: '#00b179',
    text: '#d7f879',
    postTemplate: 'PostPRO_CONCERT_5_Vert.png',
    afficheTemplate: 'Affiche Verte.png',
    flyerTemplate: 'Flyer Vert.png',
    rsTemplate: 'Cadre RS carre vert.png',
    rs45Template: 'Cadre vert RS.png',
    storieTemplate: 'Storie Verte.png'
  },
  {
    name: 'Vert Pomme',
    value: '#d7f879',
    text: '#00b17e',
    postTemplate: 'PostPRO_CONCERT_6_VertCitron.png',
    afficheTemplate: 'Affiche Citron.png',
    flyerTemplate: 'Flyer Citron.png',
    rsTemplate: 'Cadre RS carre citron.png',
    rs45Template: 'Cadre citron RS.png',
    storieTemplate: 'Storie Citron.png'
  },
  {
    name: 'Jaune Citron',
    value: '#f7ce64',
    text: '#f75b40',
    postTemplate: 'PostPRO_CONCERT_3_Jaune.png',
    afficheTemplate: 'Affiche Jaune.png',
    flyerTemplate: 'Flyer Jaune.png',
    rsTemplate: 'Cadre RS carre jaune.png',
    rs45Template: 'Cadre jaune RS.png',
    storieTemplate: 'Storie Jaune.png'
  },
  {
    name: 'Orange Hormur',
    value: '#fb593d',
    text: '#f7ce64',
    postTemplate: 'PostPRO_CONCERT_4_Orange.png',
    afficheTemplate: 'Affiche Orange.png',
    flyerTemplate: 'Flyer Orange.png',
    rsTemplate: 'Cadre RS carre orange.png',
    rs45Template: 'Cadre orange RS.png',
    storieTemplate: 'Storie Orange.png'
  },
  {
    name: 'Rose Saumon',
    value: '#fd94ac',
    text: '#157fcd',
    postTemplate: 'PostPRO_CONCERT_2_Rose.png',
    afficheTemplate: 'Affiche Rose bleue.png',
    flyerTemplate: 'Flyer Rose bleu.png',
    rsTemplate: 'Cadre RS carre rose bleu.png',
    rs45Template: 'Cadre rose bleu RS.png',
    storieTemplate: 'Storie Rose bleue.png'
  },
  {
    name: 'Rose Bonbon',
    value: '#feb2dc',
    text: '#fc4735',
    postTemplate: 'PostPRO_CONCERT_7_RoseRouge.png',
    afficheTemplate: 'Affiche Rose Rouge.png',
    flyerTemplate: 'Flyer Rose Rouge.png',
    rsTemplate: 'Cadre RS carre rose rouge.png',
    rs45Template: 'Cadre rose rouge RS.png',
    storieTemplate: 'Storie Rose Rouge.png'
  },
  {
    name: 'Rouge Vif',
    value: '#fc4735',
    text: '#feb7db',
    postTemplate: 'PostPRO_CONCERT_8_Rouge.png',
    afficheTemplate: 'Affiche Rouge Rose.png',
    flyerTemplate: 'Flyer Rouge Rose.png',
    rsTemplate: 'Cadre RS carre rouge.png',
    rs45Template: 'Cadre rouge RS.png',
    storieTemplate: 'Storie Rouge Rose.png'
  },
  {
    name: 'Noir & Blanc',
    value: '#ffffff',
    text: '#000000',
    isBlackAndWhite: true,
    displayName: 'Noir & Blanc',
    afficheTemplate: 'Affiche blanche.png',
    flyerTemplate: 'Flyer blanc.png',
    rsTemplate: 'Cadre RS carre blanc.png',
    rs45Template: 'Cadre blanc RS.png',
    storieTemplate: 'Storie blanche.png'
  }
];

const visualTypes = [
  {
    id: 'affiche',
    name: 'Affiche A4',
    icon: '📄',
    canvas: { width: 210, height: 297 },
    pdf: { width: 210, height: 297 }
  },
  {
    id: 'flyer-recto',
    name: 'Flyer A5 Recto',
    icon: '📋',
    canvas: { width: 148, height: 210 },
    pdf: { width: 148, height: 210 }
  },
  {
    id: 'flyer-verso',
    name: 'Flyer A5 Verso',
    icon: '📋',
    canvas: { width: 148, height: 210 },
    pdf: { width: 148, height: 210 }
  },
  {
    id: 'communique',
    name: 'Communiqué',
    icon: '📰',
    canvas: { width: 210, height: 297 },
    pdf: { width: 210, height: 297 }
  },
  {
    id: 'post-rs',
    name: 'Post RS (1:1)',
    icon: '📱',
    canvas: { width: 1080, height: 1080 },
    pdf: { width: 210, height: 210 }
  },
  {
    id: 'post-rs-45',
    name: 'Post RS (4:5)',
    icon: '📱',
    canvas: { width: 1080, height: 1350 },
    pdf: { width: 210, height: 262.5 }
  },
  {
    id: 'storie',
    name: 'Storie (9:16)',
    icon: '📲',
    canvas: { width: 1080, height: 1920 },
    pdf: { width: 210, height: 373.3 }
  }
];

const convivialiteOptions = [
  { value: 'none', label: 'Aucun' },
  { value: 'repas', label: 'Repas partagé' },
  { value: 'apero', label: 'Apéro participatif' }
];

const TitleInput = memo(({ value, onChange, maxLength }) => (
  <input
    type="text"
    maxLength={maxLength || 40}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
));

const ArtistNameInput = memo(({ value, onChange, maxLength }) => (
  <input
    type="text"
    maxLength={maxLength || 40}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="La Valse des Hippos"
  />
));

const DescriptionInput = memo(({ value, onChange, maxLength }) => (
  <textarea
    value={value}
    maxLength={maxLength || 600}
    onChange={onChange}
    rows={3}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
));

const OrganizerInput = memo(({ value, onChange, maxLength }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    maxLength={maxLength || 30}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="Christine & Marius"
  />
));

const PersonalMessageInput = memo(({ value, onChange }) => (
  <textarea
    value={value}
    onChange={onChange}
    rows={4}
    maxLength={400}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="Hâte de vous accueillir..."
  />
));

const EventUrlInput = memo(({ value, onChange }) => (
  <input
    type="url"
    value={value}
    onChange={onChange}
    readOnly
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-100 cursor-not-allowed"
    placeholder="https://hormur.com/event/..."
  />
));

const LogoUploadInput = memo(({ label, value, onChange, onRemove }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {value ? (
      <div className="flex items-center gap-2">
        <img src={value} alt="Logo" className="h-12 w-auto object-contain bg-white p-1 border rounded" />
        <button onClick={onRemove} className="text-red-600 hover:text-red-700 text-xs">Supprimer</button>
      </div>
    ) : null}
  </div>
));

// Panneau de configuration développeur amélioré
const DevConfigPanel = ({ visualId, config, onUpdate, onExport, onImport }) => {
  const handleChange = (element, property, value) => {
    onUpdate(visualId, element, property, value);
  };

  const getInputType = (prop, value) => {
    // Propriétés de position (%)
    if (['top', 'left', 'right', 'bottom'].includes(prop)) {
      return { type: 'range', min: 0, max: 100, step: 0.5, unit: '%' };
    }
    // Propriétés de taille (%)
    if (['width', 'height', 'paddingBottom'].includes(prop)) {
      return { type: 'range', min: 0, max: 100, step: 0.5, unit: '%' };
    }
    // Opacité (0 à 1)
    if (prop === 'opacity') {
      return { type: 'range', min: 0, max: 1, step: 0.01, unit: '' };
    }
    // Taille de police
    if (prop === 'fontSize') {
      return { type: 'range', min: 4, max: 80, step: 0.5, unit: 'px' };
    }
    // Hauteur d'image/logo
    if (prop === 'height' && typeof value === 'number' && value < 200) {
      return { type: 'range', min: 10, max: 100, step: 1, unit: 'px' };
    }
    // Taille QR code
    if (prop === 'size') {
      return { type: 'range', min: 20, max: 150, step: 2, unit: 'px' };
    }
    // Padding
    if (prop === 'padding') {
      return { type: 'range', min: 0, max: 30, step: 1, unit: 'px' };
    }
    // Font weight
    if (prop === 'fontWeight') {
      return { type: 'range', min: 100, max: 900, step: 100, unit: '' };
    }
    // Letter spacing
    if (prop === 'letterSpacing') {
      return { type: 'range', min: -3, max: 3, step: 0.1, unit: 'px' };
    }
    // Margin/spacing
    if (prop.includes('margin') || prop.includes('Margin')) {
      return { type: 'range', min: -50, max: 50, step: 1, unit: 'px' };
    }

    // Par défaut
    if (typeof value === 'number') {
      return { type: 'range', min: 0, max: 100, step: 0.5, unit: '' };
    }

    return { type: 'text', unit: '' };
  };

  const renderControl = (element, prop, val) => {
    const inputConfig = getInputType(prop, val);

    if (inputConfig.type === 'range') {
      return (
        <div key={prop} className="space-y-1">
          <label className="text-xs text-gray-700 font-semibold flex items-center justify-between">
            <span>{prop}</span>
            <span className="text-orange-600 font-mono">
              {val}{inputConfig.unit}
            </span>
          </label>
          <input
            type="range"
            min={inputConfig.min}
            max={inputConfig.max}
            step={inputConfig.step}
            value={val}
            onChange={(e) => handleChange(element, prop, parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-600"
          />
        </div>
      );
    }

    return (
      <div key={prop} className="space-y-1">
        <label className="text-xs text-gray-700 font-semibold">{prop}</label>
        <input
          type="text"
          value={val}
          onChange={(e) => handleChange(element, prop, e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
    );
  };

  const groupProperties = (props) => {
    const groups = {
      position: [],
      size: [],
      typography: [],
      spacing: [],
      other: []
    };

    Object.entries(props).forEach(([prop, val]) => {
      if (['top', 'left', 'right', 'bottom'].includes(prop)) {
        groups.position.push([prop, val]);
      } else if (['width', 'height', 'size', 'paddingBottom'].includes(prop)) {
        groups.size.push([prop, val]);
      } else if (['fontSize', 'fontWeight', 'letterSpacing'].includes(prop)) {
        groups.typography.push([prop, val]);
      } else if (['padding', 'margin', 'marginBottom'].includes(prop) || prop.includes('margin')) {
        groups.spacing.push([prop, val]);
      } else {
        groups.other.push([prop, val]);
      }
    });

    return groups;
  };

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Settings size={16} className="text-yellow-600" />
          🔧 Mode Dev - {visualId}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-1"
          >
            <Save size={12} /> Exporter JSON
          </button>
          <button
            onClick={onImport}
            className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center gap-1"
          >
            <Upload size={12} /> Importer
          </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-2 rounded mb-3">
        <p className="text-xs text-orange-900 font-medium">
          ✨ Modifications en temps réel • Sauvegarde automatique
        </p>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {Object.entries(config || {}).map(([element, props]) => (
          <div key={element} className="bg-white p-3 rounded-lg border-2 border-gray-200 shadow-sm">
            <h4 className="font-bold text-sm mb-3 text-gray-900 uppercase border-b-2 border-orange-300 pb-2 flex items-center gap-2">
              <span className="text-orange-500">▸</span>
              {element}
            </h4>

            {(() => {
              const groups = groupProperties(props);
              return (
                <div className="space-y-4">
                  {groups.position.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-2">📍 Position</div>
                      <div className="space-y-3">
                        {groups.position.map(([prop, val]) => renderControl(element, prop, val))}
                      </div>
                    </div>
                  )}

                  {groups.size.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-2">📏 Taille</div>
                      <div className="space-y-3">
                        {groups.size.map(([prop, val]) => renderControl(element, prop, val))}
                      </div>
                    </div>
                  )}

                  {groups.typography.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-2">🔤 Typographie</div>
                      <div className="space-y-3">
                        {groups.typography.map(([prop, val]) => renderControl(element, prop, val))}
                      </div>
                    </div>
                  )}

                  {groups.spacing.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-2">↔️ Espacement</div>
                      <div className="space-y-3">
                        {groups.spacing.map(([prop, val]) => renderControl(element, prop, val))}
                      </div>
                    </div>
                  )}

                  {groups.other.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-2">⚙️ Autres</div>
                      <div className="space-y-3">
                        {groups.other.map(([prop, val]) => renderControl(element, prop, val))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        ))}
      </div>
    </div>
  );
};

const DownloadModal = ({ onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Télécharger le visuel</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Choisissez le format de téléchargement :</p>

        <div className="space-y-3">
          <button
            onClick={() => onDownload('pdf')}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <FileText size={20} />
            PDF (Impression)
          </button>
          <button
            onClick={() => onDownload('jpeg')}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ImagePlus size={20} />
            JPEG (Partage)
          </button>
          <button
            onClick={() => onDownload('png')}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Palette size={20} />
            PNG (Web)
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Le téléchargement prend quelques secondes
        </p>
      </div>
    </div>
  );
};

// Composant d'animation de progression pendant le téléchargement
const DownloadProgressModal = ({ visualPreview, formatLabel, progress }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
        {/* Conteneur avec effet de révélation */}
        <div className="relative mb-6 mx-auto overflow-hidden rounded-xl shadow-lg" style={{ maxWidth: '220px' }}>
          {/* Fond grisé représentant le visuel non généré */}
          <div
            className="w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
            style={{ aspectRatio: visualPreview?.aspectRatio || '1/1' }}
          >
            {/* Icône du format */}
            <div className="text-gray-400 opacity-30">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          </div>

          {/* Effet de remplissage (niveau d'eau qui monte) */}
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-orange-500 via-orange-400 to-orange-300 transition-all duration-300 ease-out"
            style={{ height: `${progress}%` }}
          >
            {/* Effet de vague */}
            <div
              className="absolute inset-x-0 top-0 h-3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                transform: 'translateY(-50%)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>

          {/* Pourcentage au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white drop-shadow-lg">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Texte de statut */}
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-800">
            {progress >= 100 ? 'Terminé !' : 'Création en cours...'}
          </p>
          <p className="text-sm text-gray-500">
            {progress < 30 && "Préparation du visuel..."}
            {progress >= 30 && progress < 60 && "Génération en haute qualité..."}
            {progress >= 60 && progress < 90 && "Finalisation..."}
            {progress >= 90 && progress < 100 && "Presque terminé !"}
            {progress >= 100 && "Téléchargement du fichier..."}
          </p>
          <p className="text-xs text-orange-600 font-medium mt-2">
            Format : {formatLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

const SendModal = ({ onClose, onConfirmSend, onShowSubscription }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Envoyer les visuels</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-900 leading-relaxed">
          <strong>📧 Envoi automatique</strong><br />
          Les visuels seront envoyés par email (et SMS si renseigné) aux organisateurs : artistes et hôtes.
        </p>
      </div>

      <div className="bg-amber-50 p-3 rounded-lg mb-4">
        <p className="text-xs text-amber-800">
          <strong>🎁 Premier envoi gratuit !</strong> Les envois suivants nécessitent un abonnement Premium.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Annuler
        </button>
        <button
          onClick={onConfirmSend}
          className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
        >
          Envoyer
        </button>
      </div>

      <button
        onClick={onShowSubscription}
        className="w-full mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
      >
        Voir l'abonnement Premium →
      </button>
    </div>
  </div>
);

const SubscriptionModal = ({ onClose, userEmail }) => {
  // Générer le lien Stripe avec l'email Hormur en client_reference_id
  // Cela permet de lier le compte Stripe au compte Hormur même si les emails diffèrent
  const stripeBaseUrl = "https://buy.stripe.com/7sI14S1sm5nA7lufYY";
  const stripeUrl = userEmail
    ? `${stripeBaseUrl}?client_reference_id=${encodeURIComponent(userEmail)}&prefilled_email=${encodeURIComponent(userEmail)}`
    : stripeBaseUrl;

  return (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-2xl">Formules d'abonnement</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border-2 border-gray-200 rounded-xl p-6">
          <div className="text-center mb-4">
            <h4 className="font-bold text-xl mb-2">Gratuit</h4>
            <div className="text-4xl font-black text-gray-900">0€</div>
            <p className="text-sm text-gray-600">par mois</p>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span>1 envoi email/SMS gratuit</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span>Téléchargements illimités</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span>Tous les formats (PDF, JPG, PNG)</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span>5 types de visuels</span>
            </li>
          </ul>
          <button className="w-full py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
            Gratuit
          </button>
        </div>

        <div className="border-4 border-orange-500 rounded-xl p-6 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold">
            RECOMMANDÉ
          </div>
          <div className="text-center mb-4">
            <h4 className="font-bold text-xl mb-2">Premium</h4>
            <div className="text-4xl font-black text-orange-500">9€</div>
            <p className="text-sm text-gray-600">par mois</p>
            <div className="mt-2 inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
              7 jours d'essai gratuit
            </div>
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-sm">
              <Check size={16} className="text-orange-500 mt-0.5" />
              <span><strong>Envois illimités</strong> email/SMS</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={16} className="text-orange-500 mt-0.5" />
              <span><strong>Téléchargements illimités</strong> HD</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={16} className="text-orange-500 mt-0.5" />
              <span><strong>10+ templates</strong> exclusifs</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={16} className="text-orange-500 mt-0.5" />
              <span><strong>Suggestions IA</strong> (titres)</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={16} className="text-orange-500 mt-0.5" />
              <span><strong>Support</strong> prioritaire</span>
            </li>
          </ul>
          <a
            href={stripeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors text-center"
          >
            Commencer l'essai gratuit
          </a>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-xl">
        <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
          <Info size={16} className="text-gray-500" />
          Pourquoi passer Premium ?
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          💡 L'abonnement Premium est idéal si vous organisez plus de 2 événements par mois.
          Il vous permet de gagner du temps grâce à l'envoi automatique et d'accéder à des designs exclusifs.
          <strong>Sans engagement, annulable à tout moment.</strong>
        </p>
      </div>
    </div>
  </div>
  );
};

// Fonction utilitaire pour vérifier le statut Premium
const checkPremiumStatus = async (email) => {
  if (!email) return false;
  try {
    const response = await fetch('/.netlify/functions/check-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) return false;

    const data = await response.json();
    return data.isPremium;
  } catch (error) {
    console.error("Erreur vérification premium:", error);
    return false;
  }
};

const DraggableElement = ({
  id,
  children,
  style,
  isSelected,
  onSelect,
  onDragStart,
  editMode
}) => {
  const handleMouseDown = (e) => {
    if (!editMode) return;
    e.stopPropagation();
    onSelect(id);
    onDragStart(e, id);
  };

  return (
    <div
      data-element-id={id}
      style={{
        ...style,
        cursor: editMode ? 'move' : 'default',
        outline: isSelected && editMode ? '2px solid #fb593d' : 'none',
        outlineOffset: '2px',
      }}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
};

const EditPanel = memo(({
  visualTypes,
  selectedVisual,
  setSelectedVisual,
  eventData,
  onTitleChange,
  onArtistNameChange,
  onDescriptionChange,
  onOrganizerChange,
  onChezHabitantChange,
  onPersonalMessageChange,
  onEventUrlChange,
  onTimeChange,
  convivialiteOptions,
  onConvivialiteChange,
  dragActive,
  onDrag,
  onDrop,
  uploadedImage,
  fileInputRef,
  onImageUpload,
  hormurColors,
  selectedColor,
  setSelectedColor,
  imagePositionX,
  imagePositionY,
  imageZoom,
  onImagePositionXChange,
  onImagePositionYChange,
  onImageZoomChange,
  onResetImagePosition,
  isBlackAndWhite,
  hostLogo,
  artistLogo,
  onHostLogoUpload,
  onArtistLogoUpload,
  onHostLogoRemove,
  onArtistLogoRemove,
  hostLogoInputRef,
  artistLogoInputRef,
  isMobileView,
  isReformulating
}) => (
  <div className="space-y-4">
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="font-bold text-base mb-3 flex items-center gap-2">
        <FileText size={18} className="text-orange-500" />
        Type de visuel
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visualTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedVisual(type.id)}
            className={`p-2 rounded-lg border-2 transition-all ${selectedVisual === type.id
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="text-xl mb-1">{type.icon}</div>
            <div className="text-xs font-medium text-gray-700">{type.name}</div>
          </button>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="font-bold text-base mb-3 flex items-center gap-2">
        <Type size={18} className="text-orange-500" />
        Contenu
      </h2>

      {isReformulating && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm text-blue-700">
          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Optimisation des textes en cours...
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre <span className="text-gray-400">(max 25 car.)</span>
          </label>
          <TitleInput
            value={eventData.title}
            onChange={onTitleChange}
            maxLength={25}
          />
          <div className="text-xs text-gray-500 mt-1">{eventData.title.length}/25</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom d'artiste <span className="text-gray-400">(max 36 car.)</span>
          </label>
          <ArtistNameInput
            value={eventData.artistName}
            onChange={onArtistNameChange}
            maxLength={36}
          />
          <div className="text-xs text-gray-500 mt-1">{eventData.artistName.length}/36</div>
        </div>

        {(selectedVisual === 'flyer-verso' || selectedVisual === 'communique') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(max 222 car.)</span>
            </label>
            <DescriptionInput
              value={eventData.description}
              onChange={onDescriptionChange}
              maxLength={222}
            />
            <div className="text-xs text-gray-500 mt-1">{eventData.description.length}/222</div>
          </div>
        )}
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="font-bold text-base mb-3 flex items-center gap-2">
        <Home size={18} className="text-orange-500" />
        Informations organisateurs
      </h2>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prénoms (hôte & artiste) <span className="text-gray-400">(max 30 car.)</span>
          </label>
          <OrganizerInput
            value={eventData.organizerNames}
            onChange={onOrganizerChange}
            maxLength={30}
          />
          <div className="text-xs text-gray-500 mt-1">{eventData.organizerNames.length}/30</div>
        </div>

        {selectedVisual !== 'post-rs' && selectedVisual !== 'post-rs-45' && selectedVisual !== 'storie' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chezHabitant"
              checked={eventData.chezHabitant}
              onChange={onChezHabitantChange}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="chezHabitant" className="text-sm font-medium text-gray-700">
              🏠 Afficher "Chez l'habitant"
            </label>
          </div>
        )}

        {selectedVisual === 'flyer-verso' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message personnel <span className="text-gray-400">(max 400 car.)</span>
            </label>
            <PersonalMessageInput
              value={eventData.personalMessage}
              onChange={onPersonalMessageChange}
            />
            <div className="text-xs text-gray-500 mt-1">{eventData.personalMessage.length}/400</div>
          </div>
        )}

        {(selectedVisual === 'affiche' || selectedVisual === 'flyer-recto' || selectedVisual === 'flyer-verso') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Convivialité
            </label>
            <div className="grid grid-cols-3 gap-2">
              {convivialiteOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onConvivialiteChange(option.value)}
                  className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${eventData.convivialite === option.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section logos masquée pour la v1
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs font-bold text-blue-900 mb-2">🎨 Logos personnalisés (Premium)</p>
          <p className="text-xs text-blue-800 mb-3">Ajoutez vos logos d'hôte et d'artiste sur tous les visuels</p>

          <input ref={hostLogoInputRef} type="file" accept="image/*" onChange={onHostLogoUpload} className="hidden" />
          <input ref={artistLogoInputRef} type="file" accept="image/*" onChange={onArtistLogoUpload} className="hidden" />

          <div className="space-y-2">
            <button onClick={() => hostLogoInputRef.current?.click()} className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg hover:bg-blue-50">
              {hostLogo ? '✓ Logo Hôte ajouté' : '+ Ajouter logo Hôte'}
            </button>
            {hostLogo && <LogoUploadInput label="" value={hostLogo} onRemove={onHostLogoRemove} />}

            <button onClick={() => artistLogoInputRef.current?.click()} className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg hover:bg-blue-50">
              {artistLogo ? '✓ Logo Artiste ajouté' : '+ Ajouter logo Artiste'}
            </button>
            {artistLogo && <LogoUploadInput label="" value={artistLogo} onRemove={onArtistLogoRemove} />}
          </div>
        </div>
        */}
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="font-bold text-base mb-3 flex items-center gap-2">
        <ImagePlus size={18} className="text-orange-500" />
        Image {selectedVisual !== 'communique' && '(format carré)'}
      </h2>
      <div className="space-y-3">
        {!isMobileView && (
          <div
            className={`relative h-40 rounded-lg overflow-hidden border-2 border-dashed transition-colors ${dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
              }`}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
          >
            <div style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#f3f4f6'
            }}>
              <img
                src={uploadedImage}
                alt="Preview"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `translate(calc(-50% + ${(imagePositionX - 50)}%), calc(-50% + ${(imagePositionY - 50)}%)) scale(${imageZoom / 100})`,
                  transformOrigin: 'center'
                }}
              />
            </div>
            {dragActive && (
              <div className="absolute inset-0 bg-orange-100 bg-opacity-90 flex items-center justify-center">
                <p className="text-orange-700 font-semibold">Déposer l'image ici</p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-gray-700 font-medium"
        >
          Choisir une image ou glisser-déposer
        </button>

        {!isMobileView && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Move size={14} className="text-orange-500" />
                Position & Zoom
              </h3>
              <button
                onClick={onResetImagePosition}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Réinitialiser
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                ↔️ Horizontal : {imagePositionX}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={imagePositionX}
                onChange={onImagePositionXChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                ↕️ Vertical : {imagePositionY}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={imagePositionY}
                onChange={onImagePositionYChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                <ZoomIn size={12} /> Zoom : {imageZoom}%
              </label>
              <input
                type="range"
                min="60"
                max="400"
                value={imageZoom}
                onChange={onImageZoomChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 text-center">💡 {isMobileView ? 'Ajustez depuis l\'aperçu' : 'Ajustez la position et le zoom pour un cadrage parfait'}</p>
      </div>
    </div>

    {selectedVisual !== 'communique' && (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
          <Palette size={18} className="text-orange-500" />
          Couleur
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {hormurColors.map(color => (
            <button
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              className={`aspect-square rounded-lg transition-all flex items-center justify-center text-xs font-bold ${selectedColor === color.value
                ? 'ring-4 ring-gray-900 ring-offset-2 scale-105'
                : 'hover:scale-105'
                } ${color.isBlackAndWhite ? 'border-2 border-gray-300' : ''}`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            >
              {color.isBlackAndWhite && (
                <span className="text-black px-1">Noir & Blanc</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
));

const ScalablePreview = ({ children, selectedVisual, visualDimensions }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const getReferenceWidth = () => {
    if (['post-rs', 'post-rs-45', 'storie'].includes(selectedVisual)) {
      return 400;
    }
    return 350;
  };

  const referenceWidth = getReferenceWidth();

  // Calcul du ratio pour la hauteur
  const dims = visualDimensions[selectedVisual] || visualDimensions['affiche'];
  const aspectRatio = dims.width / dims.height;
  const referenceHeight = referenceWidth / aspectRatio;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth;
        const newScale = availableWidth / referenceWidth;
        setScale(newScale);
      }
    };

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    // Initial call
    updateScale();

    return () => resizeObserver.disconnect();
  }, [referenceWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: `${referenceWidth}px`,
        margin: '0 auto',
        height: `${referenceHeight * scale}px`, // Hauteur dynamique ajustée !
        position: 'relative',
        overflow: 'hidden' // Important pour cacher le débordement si scale > 1 (rare ici)
      }}
    >
      <div style={{
        width: `${referenceWidth}px`,
        height: `${referenceHeight}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute',
        top: 0,
        left: 0
      }}>
        {children}
      </div>
    </div>
  );
};

// Fonction utilitaire pour le téléchargement base64 (N8N Backup)
function downloadBase64File(base64, filename, mimeType = 'application/octet-stream') {
  if (!base64) {
    console.error("Erreur: Chaîne Base64 vide");
    return;
  }

  // 1. Nettoyage : retirer le préfixe data:..;base64, s'il existe
  let cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;

  // 2. Nettoyage agressif : ne garder que les caractères Base64 valides (A-Z, a-z, 0-9, +, /, =)
  // Cela supprime les espaces, sauts de ligne (\n, \r), et tout autre caractère invalide.
  cleanBase64 = cleanBase64.replace(/[^A-Za-z0-9+/=]/g, "");

  // 3. Correction du padding (la longueur doit être un multiple de 4)
  while (cleanBase64.length % 4) {
    cleanBase64 += '=';
  }

  try {
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Uint8Array(byteCharacters.length);

    // Conversion optimisée
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const blob = new Blob([byteNumbers], { type: mimeType });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'hormur-visual';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyage mémoire
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);

  } catch (e) {
    console.error("Erreur critique lors du décodage Base64:", e);
    console.error("Chaîne (début):", cleanBase64.substring(0, 50));
    alert("Impossible de traiter l'image reçue du serveur (Format invalide).");
  }
}

const App = () => {
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      eventName: params.get('eventName') || '',
      eventDescription: params.get('eventDescription') || '',
      eventDate: params.get('eventDate') || '',
      eventTime: params.get('eventTime') || '',
      eventURL: params.get('eventURL') || '',
      eventImage: params.get('eventImage') || '',
      artistName: params.get('artistName') || '',
      city: params.get('ville') || 'VOTRE VILLE',
      department: params.get('zip') ? params.get('zip').substring(0, 2) : '00',
      email: params.get('email') || ''
    };
  };

  // Formate l'heure : "18:00" → "18h" ou "18:30" → "18h30"
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const [hours, minutes] = parts;
      if (minutes === '00') {
        return `${hours}h`;
      }
      return `${hours}h${minutes}`;
    }
    return timeStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 2) {
      const [day, month] = parts;
      const months = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEP', 'OCT', 'NOV', 'DÉC'];
      const monthIndex = parseInt(month) - 1;
      return `${day} ${months[monthIndex] || month} 2025`;
    }
    return dateStr;
  };

  const extractCityFromURL = (url) => {
    return "VOTRE VILLE";
  };

  const getAdminUrl = (eventUrl) => {
    // Priorité 1: Utiliser le referrer s'il pointe vers hormur.com (c'est l'URL d'où l'utilisateur vient)
    if (initialReferrer && initialReferrer.includes('hormur.com')) {
      return initialReferrer;
    }
    // Priorité 2: Utiliser l'eventUrl du paramètre
    if (!eventUrl) return '';
    const url = eventUrl.replace(/\/$/, '');
    return `${url}/admin`;
  };

  // Limites de caractères pour chaque champ
  const TEXT_LIMITS = {
    title: 25,
    artistName: 36,
    description: 222,
    organizerNames: 30,
    personalMessage: 400
  };

  // Fonction pour tronquer les textes selon les limites définies
  const truncateEventData = (data) => ({
    ...data,
    title: (data.title || '').slice(0, TEXT_LIMITS.title),
    artistName: (data.artistName || '').slice(0, TEXT_LIMITS.artistName),
    description: (data.description || '').slice(0, TEXT_LIMITS.description),
    organizerNames: (data.organizerNames || '').slice(0, TEXT_LIMITS.organizerNames),
    personalMessage: (data.personalMessage || '').slice(0, TEXT_LIMITS.personalMessage)
  });

  const [eventData, setEventData] = useState(() => {
    const urlParams = getUrlParams();
    const savedData = localStorage.getItem('hormur_event_data');
    const parsedSavedData = savedData ? JSON.parse(savedData) : null;

    if (urlParams.eventName || urlParams.eventURL) {
      // Si on a des données sauvegardées pour le MÊME événement (même URL),
      // on les garde (préserve les reformulations IA et modifications utilisateur)
      if (parsedSavedData && parsedSavedData.eventUrl === urlParams.eventURL) {
        console.log('📂 Données existantes trouvées pour cet événement, conservation des modifications');
        return truncateEventData(parsedSavedData);
      }

      // Sinon, c'est un nouvel événement, on charge depuis l'URL
      console.log('🆕 Nouvel événement détecté, chargement depuis l\'URL');
      const initialData = truncateEventData({
        title: urlParams.eventName || "Trio de contrebasses",
        artistName: urlParams.artistName || "La Valse des Hippos",
        date: formatDate(urlParams.eventDate) || "16 NOV 2025",
        time: formatTime(urlParams.eventTime) || "17h",
        city: urlParams.city || "JOUÉ-LÈS-TOURS",
        department: urlParams.department || "37",
        organizerNames: "",
        eventUrl: urlParams.eventURL || "https://hormur.com/event/01994344-f113-7096-a7-6f6e28d480",
        description: urlParams.eventDescription || "Découvrez un concert intimiste dans un cadre chaleureux et convivial.",
        personalMessage: "Hâte de vous accueillir pour ce moment de partage artistique !",
        convivialite: "repas",
        chezHabitant: true
      });
      localStorage.setItem('hormur_event_data', JSON.stringify(initialData));
      // Effacer les flags de reformulation pour permettre une nouvelle reformulation
      sessionStorage.removeItem('hormur_ai_reformulated');
      localStorage.removeItem('hormur_ai_reformulated_event');
      return initialData;
    }

    if (parsedSavedData) {
      return truncateEventData(parsedSavedData);
    }

    return truncateEventData({
      title: "Trio de contrebasses",
      artistName: "La Valse des Hippos",
      date: "16 NOV 2025",
      time: "17h",
      city: "JOUÉ-LÈS-TOURS",
      department: "37",
      organizerNames: "",
      eventUrl: "https://hormur.com/event/01994344-f113-7096-a7-6f6e28d480",
      description: "Découvrez un concert intimiste dans un cadre chaleureux et convivial.",
      personalMessage: "Hâte de vous accueillir pour cette soirée unique !",
      convivialite: "repas",
      chezHabitant: true
    });
  });

  const [selectedColor, setSelectedColor] = useState(() => {
    return localStorage.getItem('hormur_selected_color') || '#1380c7';
  });

  const [selectedVisual, setSelectedVisual] = useState(() => {
    return localStorage.getItem('hormur_selected_visual') || 'affiche';
  });

  const [uploadedImage, setUploadedImage] = useState(() => {
    const savedImage = localStorage.getItem('hormur_uploaded_image');
    return savedImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop';
  });

  useEffect(() => {
    const urlParams = getUrlParams();
    const imageUrl = urlParams.eventImage;

    if (!imageUrl || uploadedImage.startsWith('data:')) return;

    const convertImageToBase64 = async (url) => {
      try {
        console.log('🔄 Conversion de l\'image en base64...');
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();

        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log('✅ Image convertie en base64');
            resolve(reader.result);
          };
          reader.onerror = () => {
            console.error('❌ Erreur FileReader');
            resolve(null);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('❌ Erreur conversion image:', error);
        return null;
      }
    };

    convertImageToBase64(imageUrl).then(base64Image => {
      if (base64Image) {
        setUploadedImage(base64Image);
        localStorage.setItem('hormur_uploaded_image', base64Image);
      } else {
        setUploadedImage(imageUrl);
      }
    });
  }, []);

  // AI Reformulation Effect - Reformule automatiquement les textes trop longs des URL params
  useEffect(() => {
    const reformulateFromUrlParams = async () => {
      const urlParams = getUrlParams();

      // Si pas de paramètres URL, ne rien faire
      if (!urlParams.eventName && !urlParams.eventURL) {
        return;
      }

      // Vérifier si on a déjà reformulé CET événement spécifique (persiste même après fermeture navigateur)
      const reformulatedEventUrl = localStorage.getItem('hormur_ai_reformulated_event');
      if (reformulatedEventUrl === urlParams.eventURL) {
        console.log('🤖 AI: Cet événement a déjà été reformulé');
        return;
      }

      // Vérifier aussi dans sessionStorage pour éviter les doubles appels dans la même session
      const sessionKey = 'hormur_ai_reformulated';
      if (sessionStorage.getItem(sessionKey)) {
        console.log('🤖 AI: Reformulation déjà effectuée cette session');
        return;
      }

      // Récupérer les textes ORIGINAUX (non tronqués) depuis les URL params
      const originalTitle = urlParams.eventName || '';
      const originalDescription = urlParams.eventDescription || '';
      const originalArtistName = urlParams.artistName || '';

      const limits = {
        title: { max: TEXT_LIMITS.title, type: 'title' },
        artistName: { max: TEXT_LIMITS.artistName, type: 'artist' },
        description: { max: TEXT_LIMITS.description, type: 'description' }
      };

      // Vérifier si au moins un texte dépasse sa limite
      const needsReformulation =
        originalTitle.length > limits.title.max ||
        originalDescription.length > limits.description.max ||
        originalArtistName.length > limits.artistName.max;

      if (!needsReformulation) {
        console.log('✅ AI: Aucune reformulation nécessaire');
        sessionStorage.setItem(sessionKey, 'true');
        return;
      }

      console.log('🤖 AI: Lancement de la reformulation automatique...');
      setIsReformulating(true);

      const reformulateText = async (text, maxLength, type) => {
        try {
          // Skip en local sans Netlify Dev
          if (window.location.hostname === 'localhost' && !window.location.port.includes('8888')) {
            console.log('⚠️ Reformulation AI ignorée en local (nécessite Netlify Dev)');
            return text.slice(0, maxLength);
          }

          const response = await fetch('/.netlify/functions/reformulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, maxLength, type })
          });

          const data = await response.json();

          if (!response.ok) {
            console.error('❌ AI Error:', data.error, data.details || '');
            return text.slice(0, maxLength);
          }

          return data.reformulatedText || text.slice(0, maxLength);
        } catch (e) {
          console.error('AI Error:', e);
          return text.slice(0, maxLength);
        }
      };

      // Lancer les reformulations en parallèle pour plus de rapidité
      const promises = [];
      const updates = {};

      if (originalTitle.length > limits.title.max) {
        console.log(`🤖 AI: Titre trop long (${originalTitle.length}/${limits.title.max})`);
        promises.push(
          reformulateText(originalTitle, limits.title.max, 'title')
            .then(result => { updates.title = result; })
        );
      }

      if (originalArtistName.length > limits.artistName.max) {
        console.log(`🤖 AI: Nom artiste trop long (${originalArtistName.length}/${limits.artistName.max})`);
        promises.push(
          reformulateText(originalArtistName, limits.artistName.max, 'artist')
            .then(result => { updates.artistName = result; })
        );
      }

      if (originalDescription.length > limits.description.max) {
        console.log(`🤖 AI: Description trop longue (${originalDescription.length}/${limits.description.max})`);
        promises.push(
          reformulateText(originalDescription, limits.description.max, 'description')
            .then(result => { updates.description = result; })
        );
      }

      try {
        await Promise.all(promises);

        if (Object.keys(updates).length > 0) {
          console.log('✨ AI: Reformulation terminée !', updates);
          setEventData(prev => {
            const newData = { ...prev, ...updates };
            localStorage.setItem('hormur_event_data', JSON.stringify(newData));
            return newData;
          });
        }
      } catch (error) {
        console.error('❌ AI: Erreur lors de la reformulation:', error);
      } finally {
        setIsReformulating(false);
        // Marquer cet événement comme reformulé (persiste après fermeture navigateur)
        localStorage.setItem('hormur_ai_reformulated_event', urlParams.eventURL);
        sessionStorage.setItem(sessionKey, 'true');
      }
    };

    // Lancer rapidement (100ms) pour ne pas trop ralentir l'affichage initial
    const timer = setTimeout(reformulateFromUrlParams, 100);
    return () => clearTimeout(timer);
  }, []); // Exécuter une seule fois au montage

  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isReformulating, setIsReformulating] = useState(false);
  const [mobileView, setMobileView] = useState('edit');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [hostLogo, setHostLogo] = useState(null);
  const [artistLogo, setArtistLogo] = useState(null);
  const hostLogoInputRef = useRef(null);
  const artistLogoInputRef = useRef(null);

  // Mode édition et élément sélectionné
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [imageSettings, setImageSettings] = useState(() => {
    const saved = localStorage.getItem('hormur_image_settings');
    return saved ? JSON.parse(saved) : {
      affiche: { positionX: 50, positionY: 50, zoom: 100 },
      flyerRecto: { positionX: 50, positionY: 50, zoom: 100 },
      flyerVerso: { positionX: 50, positionY: 50, zoom: 100 },
      communique: { positionX: 50, positionY: 50, zoom: 100 },
      postRS: { positionX: 50, positionY: 50, zoom: 100 },
      postRS45: { positionX: 50, positionY: 50, zoom: 100 },
      storie: { positionX: 50, positionY: 50, zoom: 100 }
    };
  });

  useEffect(() => {
    localStorage.setItem('hormur_event_data', JSON.stringify(eventData));
  }, [eventData]);

  useEffect(() => {
    localStorage.setItem('hormur_selected_color', selectedColor);
  }, [selectedColor]);

  useEffect(() => {
    localStorage.setItem('hormur_selected_visual', selectedVisual);
  }, [selectedVisual]);

  useEffect(() => {
    // Utiliser la fonction avec gestion des erreurs de quota et compression
    saveImageToLocalStorage(uploadedImage).then(success => {
      if (!success && uploadedImage) {
        console.warn('⚠️ Impossible de sauvegarder l\'image dans le localStorage - elle sera perdue au rechargement');
      }
    });
  }, [uploadedImage]);

  useEffect(() => {
    localStorage.setItem('hormur_image_settings', JSON.stringify(imageSettings));
  }, [imageSettings]);

  const getSettingsKey = (visualId) => {
    const mapping = {
      'affiche': 'affiche',
      'flyer-recto': 'flyerRecto',
      'flyer-verso': 'flyerVerso',
      'communique': 'communique',
      'post-rs': 'postRS',
      'post-rs-45': 'postRS45',
      'storie': 'storie'
    };
    return mapping[visualId] || 'affiche';
  };

  const getCurrentSettings = () => {
    const key = getSettingsKey(selectedVisual);
    return imageSettings[key] || { positionX: 50, positionY: 50, zoom: 100 };
  };

  const updateCurrentSettings = (updates) => {
    const key = getSettingsKey(selectedVisual);
    setImageSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates
      }
    }));
  };

  const currentSettings = getCurrentSettings();

  const generateVisualBase64 = async (visualType) => {
    // 1. Sauvegarder le type actuel
    const currentVisual = selectedVisual;

    // 2. Changer temporairement pour le rendu (si nécessaire, mais ici on va tricher)
    // Le plus simple est de réutiliser la logique de handleDownload mais en retournant le base64
    // On doit simuler le rendu de chaque visuel. C'est complexe en React pur sans changer l'état.

    // Pour cette étape, on va envoyer le visuel COURANT.

    const element = visualRef.current;
    if (!element) return null;

    const finalDims = VISUAL_DIMENSIONS[visualType] || VISUAL_DIMENSIONS['affiche'];
    const originalWidth = element.offsetWidth;
    const originalHeight = element.offsetHeight;
    const scaleFactor = finalDims.width / originalWidth;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // Hide scrollbars during capture

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0'; // Changed from '-9999px'
    wrapper.style.top = '0';
    wrapper.style.width = `${Math.ceil(finalDims.width)}px`; // Round up to avoid sub-pixel gaps
    wrapper.style.height = `${Math.ceil(finalDims.height)}px`;
    wrapper.style.zIndex = '-9999';
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.overflow = 'hidden';
    document.body.appendChild(wrapper);

    const clone = element.cloneNode(true);
    clone.style.width = `${originalWidth}px`;
    clone.style.height = `${originalHeight}px`;
    clone.style.transform = `scale(${scaleFactor})`;
    clone.style.transformOrigin = 'top left'; // Explicit top left
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none'; // Remove any shadow that might cause artifacts

    // Remove shadow from QR code specifically
    const qrCodeContainer = clone.querySelector('[id="qrcode"] > div');
    if (qrCodeContainer) {
      qrCodeContainer.style.boxShadow = 'none';
    }

    // Nettoyer
    clone.querySelectorAll('[style*="outline"]').forEach(el => el.style.outline = 'none');

    wrapper.appendChild(clone);

    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 200));

    const options = {
      width: finalDims.width,
      height: finalDims.height,
      backgroundColor: '#ffffff',
      style: { transform: 'none' }
    };

    const dataUrl = await domToJpeg(wrapper, { ...options, quality: 0.85 });
    document.body.removeChild(wrapper);
    document.body.style.overflow = originalOverflow; // Restore scrollbars

    return dataUrl;
  };

  const handleSendConfirm = useCallback(async (emailOrEvent) => {
    // Note: 'email' doit être passé depuis la modale. Si la modale ne le passe pas, il faut le récupérer autrement.
    // Supposons que SendModal passe l'email ou qu'on l'a dans le state.
    // Pour l'instant on utilise l'email de l'URL ou un prompt si manquant

    // Si appelé via onClick, le premier argument est l'événement, donc on l'ignore s'il n'est pas une string
    const emailArg = typeof emailOrEvent === 'string' ? emailOrEvent : null;
    const recipientEmail = emailArg || getUrlParams().email || prompt("Veuillez entrer votre email :");
    if (!recipientEmail) return;

    // --- LOGIQUE PREMIUM ---
    const hasSentFreeEmail = localStorage.getItem('hasSentFreeEmail');

    if (hasSentFreeEmail) {
      // Déjà utilisé l'envoi gratuit, on vérifie le statut Premium
      setIsDownloading(true); // Petit loading pendant la vérif
      const isPremium = await checkPremiumStatus(recipientEmail);
      setIsDownloading(false);

      if (!isPremium) {
        setShowSendModal(false);
        setShowSubscriptionModal(true);
        return;
      }
    }
    // -----------------------

    setIsDownloading(true); // On réutilise le state de loading

    try {
      // 1. Générer le visuel courant (pour commencer)
      const currentImage = await generateVisualBase64(selectedVisual);

      if (!currentImage) throw new Error("Impossible de générer l'image");

      // 2. Envoyer au backend sécurisé
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail,
          images: {
            [selectedVisual]: currentImage
          },
          eventData: eventData
        })
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi");

      // Marquer comme utilisé après succès
      localStorage.setItem('hasSentFreeEmail', 'true');

      alert('✅ Envoi réussi ! Vos visuels arrivent par email.');
      setShowSendModal(false);

    } catch (error) {
      console.error('Erreur envoi:', error);
      alert('❌ Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setIsDownloading(false);
    }
  }, [selectedVisual, eventData]);



  const handleShowSubscriptionFromSend = useCallback(() => {
    setShowSendModal(false);
    setShowSubscriptionModal(true);
  }, []);

  const fileInputRef = useRef(null);
  const visualRef = useRef(null);

  // Helpers pour déterminer la couleur et le type de visuel
  const getCurrentColor = () => {
    return hormurColors.find(c => c.value === selectedColor) || hormurColors[0];
  };

  const isBlackAndWhite = () => {
    const color = getCurrentColor();
    return color.isBlackAndWhite === true;
  };

  // ==========================================
  // CONFIGURATION DÉVELOPPEUR
  // ==========================================

  // Configurations par défaut communes - Chargées depuis les fichiers JSON
  const getDefaultConfigs = () => loadAllConfigs();

  // Fonction pour fusionner les configs sauvegardées avec les defaults
  // Utilise maintenant la fonction importée depuis configUtils
  const mergeWithDefaults = mergeWithSavedConfig;

  // Configurations pour les visuels en couleur
  const [devConfigs, setDevConfigs] = useState(() => {
    const defaultConfigs = getDefaultConfigs();

    // En mode dev, fusionner avec les configurations sauvegardées
    if (isDev) {
      const saved = localStorage.getItem('hormur_dev_configs');
      if (saved) {
        try {
          const savedConfigs = JSON.parse(saved);
          return mergeWithDefaults(defaultConfigs, savedConfigs);
        } catch (e) {
          console.error('Erreur parsing configs sauvegardées:', e);
          return defaultConfigs;
        }
      }
    }

    return defaultConfigs;
  });

  // Configurations pour les visuels en noir et blanc
  const [devConfigsBW, setDevConfigsBW] = useState(() => {
    const defaultConfigsBW = loadAllConfigs(true);

    // En mode dev, fusionner avec les configurations sauvegardées
    if (isDev) {
      const saved = localStorage.getItem('hormur_dev_configs_bw');
      if (saved) {
        try {
          const savedConfigs = JSON.parse(saved);
          return mergeWithDefaults(defaultConfigsBW, savedConfigs);
        } catch (e) {
          console.error('Erreur parsing configs N&B sauvegardées:', e);
          return defaultConfigsBW;
        }
      }
    }

    return defaultConfigsBW;
  });

  // Sauvegarder automatiquement les configurations
  useEffect(() => {
    if (isDev) {
      localStorage.setItem('hormur_dev_configs', JSON.stringify(devConfigs));
    }
  }, [devConfigs]);

  useEffect(() => {
    if (isDev) {
      localStorage.setItem('hormur_dev_configs_bw', JSON.stringify(devConfigsBW));
    }
  }, [devConfigsBW]);

  // Mettre à jour une configuration (mode dev uniquement)
  const updateDevConfig = useCallback((visualId, element, property, value) => {
    if (!isDev) return;  // Empêcher les modifications en mode production

    const isBW = isBlackAndWhite();
    const setConfig = isBW ? setDevConfigsBW : setDevConfigs;

    setConfig(prev => ({
      ...prev,
      [visualId]: {
        ...prev[visualId]?.[element],
        [element]: {
          ...prev[visualId]?.[element],
          [property]: value
        }
      }
    }));
  }, [selectedColor]);

  // Exporter la configuration en JSON
  const exportDevConfig = useCallback(() => {
    const isBW = isBlackAndWhite();
    const configs = isBW ? devConfigsBW : devConfigs;
    const type = isBW ? 'bw' : 'color';
    const data = JSON.stringify(configs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hormur-config-${type}-${selectedVisual}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert(`✅ Configuration ${isBW ? 'Noir & Blanc' : 'Couleur'} exportée avec succès`);
  }, [devConfigs, devConfigsBW, selectedVisual, selectedColor]);

  // Importer une configuration JSON
  const importDevConfig = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target.result);
          const isBW = isBlackAndWhite();
          const setConfig = isBW ? setDevConfigsBW : setDevConfigs;
          const storageKey = isBW ? 'hormur_dev_configs_bw' : 'hormur_dev_configs';

          setConfig(config);
          localStorage.setItem(storageKey, JSON.stringify(config));
          alert(`✅ Configuration ${isBW ? 'Noir & Blanc' : 'Couleur'} importée avec succès`);
        } catch (error) {
          alert('❌ Erreur lors de l\'import : fichier JSON invalide');
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [selectedColor]);

  // Récupérer la configuration actuelle pour le visuel sélectionné
  const getCurrentDevConfig = useCallback(() => {
    const isBW = isBlackAndWhite();
    const configs = isBW ? devConfigsBW : devConfigs;
    return configs[selectedVisual] || {};
  }, [devConfigs, devConfigsBW, selectedVisual, selectedColor]);

  // Appliquer les valeurs de configuration dans le rendu
  const getConfigValue = useCallback((element, property, defaultValue) => {
    const config = getCurrentDevConfig();
    return config[element]?.[property] ?? defaultValue;
  }, [getCurrentDevConfig]);

  // ==========================================
  // FIN CONFIGURATION DÉVELOPPEUR
  // ==========================================

  // Handlers de drag & drop
  const handleDragStart = (e, elementId) => {
    setIsDragging(true);
    setSelectedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e) => {
    if (!isDragging || !selectedElement) return;

    const visualElement = visualRef.current;
    if (!visualElement) return;

    const rect = visualElement.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    const currentConfig = getCurrentDevConfig();
    const elementConfig = currentConfig[selectedElement] || {};

    // Détecter quelles propriétés de positionnement l'élément utilise
    const hasTop = elementConfig.top !== undefined;
    const hasBottom = elementConfig.bottom !== undefined;
    const hasLeft = elementConfig.left !== undefined;
    const hasRight = elementConfig.right !== undefined;

    // Mettre à jour la position horizontale
    if (hasLeft) {
      updateDevConfig(selectedVisual, selectedElement, 'left', (elementConfig.left || 0) + deltaX);
    }
    if (hasRight) {
      // Pour right, on diminue quand on va vers la droite
      updateDevConfig(selectedVisual, selectedElement, 'right', (elementConfig.right || 0) - deltaX);
    }

    // Mettre à jour la position verticale
    if (hasTop) {
      updateDevConfig(selectedVisual, selectedElement, 'top', (elementConfig.top || 0) + deltaY);
    }
    if (hasBottom) {
      // Pour bottom, on diminue quand on va vers le bas
      updateDevConfig(selectedVisual, selectedElement, 'bottom', (elementConfig.bottom || 0) - deltaY);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Ajouter les listeners de souris
  useEffect(() => {
    if (editMode) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [editMode, isDragging, selectedElement, dragStart]);

  const handleTitleChange = useCallback((e) => {
    const value = e.target.value.slice(0, 25);
    setEventData(prev => ({ ...prev, title: value }));
  }, []);

  const handleArtistNameChange = useCallback((e) => {
    setEventData(prev => ({ ...prev, artistName: e.target.value.slice(0, 36) }));
  }, []);

  const handleDescriptionChange = useCallback((e) => {
    const value = e.target.value.slice(0, 222);
    setEventData(prev => ({ ...prev, description: value }));
  }, []);

  const handleOrganizerChange = useCallback((e) => {
    setEventData(prev => ({ ...prev, organizerNames: e.target.value.slice(0, 30) }));
  }, []);

  const handlePersonalMessageChange = useCallback((e) => {
    setEventData(prev => ({ ...prev, personalMessage: e.target.value.slice(0, 400) }));
  }, []);

  const handleEventUrlChange = useCallback((e) => {
    setEventData(prev => ({ ...prev, eventUrl: e.target.value }));
  }, []);

  const handleTimeChange = useCallback((e) => {
    setEventData(prev => ({ ...prev, time: e.target.value }));
  }, []);

  const handleChezHabitantChange = useCallback((e) => {
    setEventData(prev => ({ ...prev, chezHabitant: e.target.checked }));
  }, []);

  const handleConvivialiteChange = useCallback((value) => {
    setEventData(prev => ({ ...prev, convivialite: value }));
  }, []);

  const handleImagePositionXChange = useCallback((e) => {
    updateCurrentSettings({ positionX: Number(e.target.value) });
  }, [selectedVisual]);

  const handleImagePositionYChange = useCallback((e) => {
    updateCurrentSettings({ positionY: Number(e.target.value) });
  }, [selectedVisual]);

  const handleImageZoomChange = useCallback((e) => {
    updateCurrentSettings({ zoom: Number(e.target.value) });
  }, [selectedVisual]);

  const handleResetImagePosition = useCallback(() => {
    updateCurrentSettings({ positionX: 50, positionY: 50, zoom: 100 });
  }, [selectedVisual]);

  const handleHostLogoUpload = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setHostLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleArtistLogoUpload = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setArtistLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleHostLogoRemove = useCallback(() => {
    setHostLogo(null);
    if (hostLogoInputRef.current) hostLogoInputRef.current.value = '';
  }, []);

  const handleArtistLogoRemove = useCallback(() => {
    setArtistLogo(null);
    if (artistLogoInputRef.current) artistLogoInputRef.current.value = '';
  }, []);

  const getCurrentVisualType = () => {
    return visualTypes.find(v => v.id === selectedVisual) || visualTypes[0];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target.result);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const confirmImageCrop = () => {
    // Marquer l'image comme en cours de chargement
    setIsImageLoading(true);
    setUploadedImage(tempImage);
    setShowImageCrop(false);
    setTempImage(null);
    updateCurrentSettings({ positionX: 50, positionY: 50, zoom: 100 });

    // Précharger l'image pour s'assurer qu'elle est prête
    if (tempImage) {
      const img = new Image();
      img.onload = () => {
        setIsImageLoading(false);
        console.log('✅ Image chargée et prête');
      };
      img.onerror = () => {
        setIsImageLoading(false);
        console.warn('⚠️ Erreur de chargement image');
      };
      img.src = tempImage;
    } else {
      setIsImageLoading(false);
    }
  };

  // Dimensions de référence pour chaque type de visuel
  // Ces dimensions correspondent aux largeurs pour lesquelles les configs JSON ont été optimisées
  const REFERENCE_DIMENSIONS = {
    'affiche': { width: 350, height: 495 }, // Ratio A4 portrait
    'flyer-recto': { width: 350, height: 495 }, // Ratio A5 portrait
    'flyer-verso': { width: 350, height: 495 },
    'post-rs': { width: 400, height: 400 }, // Carré
    'post-rs-45': { width: 400, height: 500 }, // 4:5
    'storie': { width: 400, height: 711 }, // 9:16
    'communique': { width: 500, height: 354 } // Paysage A4
  };
  const handleDownload = async (format) => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const element = visualRef.current;
      if (!element) throw new Error("Aucun visuel");

      const finalDims = VISUAL_DIMENSIONS[selectedVisual] || VISUAL_DIMENSIONS['affiche'];
      const originalWidth = element.offsetWidth;
      const originalHeight = element.offsetHeight;
      const scaleFactor = finalDims.width / originalWidth;

      // Utiliser modern-screenshot pour TOUS les navigateurs (y compris Firefox)
      // html2canvas a trop de bugs de positionnement
      const useHtml2Canvas = false;

      const filename = `hormur-${selectedVisual}-${Date.now()}`;

      // Helper pour télécharger/partager le blob
      const processOutput = async (blob, filename, mimeType) => {
        if (!blob) {
          console.error('Blob is null');
          return;
        }

        const file = new File([blob], filename, { type: mimeType });
        const canShare = navigator.canShare && navigator.canShare({ files: [file] });

        // Sur mobile, privilégier le partage natif
        if (canShare) {
          try {
            await navigator.share({
              files: [file],
              title: filename,
            });
            return;
          } catch (error) {
            if (error.name !== 'AbortError') console.error('Erreur partage:', error);
          }
        }

        // Fallback : téléchargement classique
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      };

      // =======================================================================
      // FIREFOX GECKO : Utiliser html2canvas avec wrapper/clone (même approche que modern-screenshot)
      // =======================================================================
      if (useHtml2Canvas) {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
          // Firefox Gecko : capturer directement l'élément avec le scale de html2canvas
          // mais en corrigeant les transforms problématiques dans onclone
          const canvas = await html2canvas(element, {
            scale: scaleFactor,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: originalWidth,
            height: originalHeight,
            onclone: (_clonedDoc, clonedElement) => {
              // Retirer les styles qui causent des problèmes
              clonedElement.style.boxShadow = 'none';

              // Corriger les images avec translate(-50%, -50%) qui causent des décalages
              clonedElement.querySelectorAll('img').forEach(img => {
                const imgStyle = img.getAttribute('style') || '';
                if (imgStyle.includes('translate(-50%')) {
                  // Trouver l'image originale correspondante pour obtenir sa position réelle
                  const originalImg = element.querySelector(`img[src="${img.getAttribute('src')}"]`);
                  if (originalImg && originalImg.parentElement) {
                    const rect = originalImg.getBoundingClientRect();
                    const parentRect = originalImg.parentElement.getBoundingClientRect();

                    // Calculer la position réelle en pourcentages
                    const topPercent = ((rect.top - parentRect.top) / parentRect.height) * 100;
                    const leftPercent = ((rect.left - parentRect.left) / parentRect.width) * 100;

                    // Appliquer la position corrigée sans transform
                    img.style.transform = 'none';
                    img.style.top = `${topPercent}%`;
                    img.style.left = `${leftPercent}%`;
                  }
                }
              });

              // Retirer les box-shadows et outlines
              const qr = clonedElement.querySelector('[id="qrcode"] > div');
              if (qr) qr.style.boxShadow = 'none';
              clonedElement.querySelectorAll('[style*="outline"]').forEach(el => {
                el.style.outline = 'none';
              });
            }
          });

          if (format === 'png') {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await processOutput(blob, `${filename}.png`, 'image/png');
          } else if (format === 'jpeg') {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            await processOutput(blob, `${filename}.jpg`, 'image/jpeg');
          } else if (format === 'pdf') {
            const pdf = new jsPDF({
              orientation: finalDims.width > finalDims.height ? 'l' : 'p',
              unit: 'mm',
              format: [finalDims.pdf.width, finalDims.pdf.height]
            });
            pdf.addImage(
              canvas.toDataURL('image/jpeg', 0.95),
              'JPEG',
              0, 0,
              finalDims.pdf.width,
              finalDims.pdf.height
            );
            const pdfBlob = pdf.output('blob');
            await processOutput(pdfBlob, `${filename}.pdf`, 'application/pdf');
          }
        } finally {
          document.body.style.overflow = originalOverflow;
        }
      }
      // =======================================================================
      // AUTRES NAVIGATEURS : Utiliser modern-screenshot (qualité vectorielle)
      // =======================================================================
      // =======================================================================
      // AUTRES NAVIGATEURS & PATCH ANTIGRAVITÉ (FIREFOX)
      // =======================================================================
      else {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // 🦊 1. DÉTECTION FIREFOX
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        // 🧲 2. CONFIGURATION DE L'ANTIGRAVITÉ (Offsets en pixels)
        // Valeurs NÉGATIVES pour remonter l'élément (lutter contre la gravité)
        const firefoxFixes = {
          'affiche': {
            'title': -22,
            'artistName': 0,
            'date': -28,
            'time': -28,
            'city': -28,
            'department': -6,
            'organizer': -21,
            'chezHabitant': -28,
            'convivialite': -16
          },
          'flyer-recto': {
            'title': -22,
            'artistName': 0,
            'date': -30,
            'time': -29,
            'city': -24,
            'department': -3,
            'organizer': -20,
            'chezHabitant': -29,
            'convivialite': -15
          },
          'post-rs': {
            'title': 24,
            'artistName': 26,
            'date': 0,
            'time': 2,
            'city': 25,
            'department': 29,
            'organizer': 16,
            'chezHabitant': 0,
            'convivialite': 35
          },
          'post-rs-45': {
            'title': 8,
            'artistName': 37,
            'date': 2,
            'time': 2,
            'city': 42,
            'department': 46,
            'organizer': 33,
            'chezHabitant': 0,
            'convivialite': 54
          },
          'storie': {
            'title': 10,
            'artistName': 38,
            'date': 44,
            'time': 44,
            'city': { top: 8, left: 8 },
            'department': 8,
            'organizer': -4,
            'chezHabitant': -4,
            'convivialite': 58
          }
        };

        // ÉTAPE 1: Capturer les positions RÉELLES
        const elementPositions = new Map();
        const parentRect = element.getBoundingClientRect();

        element.querySelectorAll('[data-element-id]').forEach(el => {
          const rect = el.getBoundingClientRect();
          const id = el.getAttribute('data-element-id');

          // 1. Calcul de base (Idem pour tous)
          let computedTop = rect.top - parentRect.top;
          let computedLeft = rect.left - parentRect.left;

          // 2. Patch ANTIGRAVITÉ (Uniquement Firefox Desktop/Android)
          if (isFirefox) {
            const config = firefoxFixes[selectedVisual] ? firefoxFixes[selectedVisual][id] : undefined;
            if (config !== undefined) {
              if (typeof config === 'object') {
                computedTop += (config.top || 0);
                computedLeft += (config.left || 0);
                console.log(`🦊 Antigravity (XY) activé sur ${id}: Top ${config.top}px, Left ${config.left}px`);
              } else {
                computedTop += config;
                console.log(`🦊 Antigravity (Y) activé sur ${id}: ${config}px`);
              }
            }
          }

          elementPositions.set(id, {
            top: computedTop,
            left: computedLeft,
            width: rect.width,
            height: rect.height
          });
        });

        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = `${Math.ceil(finalDims.width)}px`;
        wrapper.style.height = `${Math.ceil(finalDims.height)}px`;
        wrapper.style.zIndex = '-9999';
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.overflow = 'hidden';
        document.body.appendChild(wrapper);

        const clone = element.cloneNode(true);
        clone.style.width = `${originalWidth}px`;
        clone.style.height = `${originalHeight}px`;
        clone.style.transform = `scale(${scaleFactor})`;
        clone.style.transformOrigin = 'top left';
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '0';
        clone.style.margin = '0';
        clone.style.boxShadow = 'none';


        // ÉTAPE 2: Appliquer les positions figées (et corrigées)
        if (isFirefox) {
          clone.querySelectorAll('[data-element-id]').forEach(clonedEl => {
            const id = clonedEl.getAttribute('data-element-id');
            const pos = elementPositions.get(id);
            if (pos) {
              clonedEl.style.top = `${pos.top}px`;
              clonedEl.style.left = `${pos.left}px`;
              clonedEl.style.bottom = 'auto';
              clonedEl.style.right = 'auto';
            }
          });
        }


        const qrCodeContainer = clone.querySelector('[id="qrcode"] > div');
        if (qrCodeContainer) qrCodeContainer.style.boxShadow = 'none';
        clone.querySelectorAll('[style*="outline"]').forEach(el => el.style.outline = 'none');

        wrapper.appendChild(clone);

        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 500));

        const options = {
          width: finalDims.width,
          height: finalDims.height,
          backgroundColor: '#ffffff',
          style: { transform: 'none' },
          filter: () => true
        };

        // Helper pour convertir DataURL en Blob
        const dataURLtoBlob = (dataurl) => {
          const arr = dataurl.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          return new Blob([u8arr], { type: mime });
        };

        try {
          if (format === 'png') {
            const dataUrl = await domToPng(wrapper, options);
            const blob = dataURLtoBlob(dataUrl);
            await processOutput(blob, `${filename}.png`, 'image/png');
          } else if (format === 'jpeg') {
            const dataUrl = await domToJpeg(wrapper, { ...options, quality: 0.95 });
            const blob = dataURLtoBlob(dataUrl);
            await processOutput(blob, `${filename}.jpg`, 'image/jpeg');
          } else if (format === 'pdf') {
            const canvas = await domToCanvas(wrapper, options);
            const pdf = new jsPDF({
              orientation: finalDims.width > finalDims.height ? 'l' : 'p',
              unit: 'mm',
              format: [finalDims.pdf.width, finalDims.pdf.height]
            });
            pdf.addImage(
              canvas.toDataURL('image/jpeg', 0.95),
              'JPEG',
              0, 0,
              finalDims.pdf.width,
              finalDims.pdf.height
            );
            const pdfBlob = pdf.output('blob');
            await processOutput(pdfBlob, `${filename}.pdf`, 'application/pdf');
          }
        } finally {
          document.body.removeChild(wrapper);
          document.body.style.overflow = originalOverflow;
        }
      }

    } catch (e) {
      console.error('Erreur téléchargement:', e);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    } finally {
      setIsDownloading(false);
      setShowDownloadModal(false);
    }
  };



  // ===================================
  // HELPER: CREATE RENDER TOKEN (NETLIFY BLOBS)
  // Replaces large payloads with a short token stored in Netlify Blobs
  // ===================================
  const createRenderToken = async () => {
    // Use Edge Function endpoint for better Blobs support
    const createTokenUrl = '/api/render-token';

    const colorIndex = hormurColors.findIndex(c => c.value === selectedColor);

    const payload = {
      type: selectedVisual,
      colorIndex: colorIndex !== -1 ? colorIndex : 0,
      uploadedImage: uploadedImage || null,
      eventData: eventData,
      settings: currentSettings
    };

    console.log('📤 createRenderToken payload:', {
      type: payload.type,
      colorIndex: payload.colorIndex,
      hasImage: !!payload.uploadedImage,
      eventData: payload.eventData
    });

    try {
      const response = await fetch(createTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur création token (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      if (!result.token) throw new Error("Aucun token reçu du serveur");

      return result.token;

    } catch (error) {
      console.error("Erreur createRenderToken:", error);
      // Fallback logic could go here if needed, but for now we propagate 
      throw new Error("Impossible de sécuriser les données du visuel.");
    }
  };

  // ===================================
  // FEATURE: GÉNÉRER LIEN COURT
  // ===================================
  const handleGenerateShortLink = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const token = await createRenderToken();
      const shortUrl = `${window.location.origin}/render?token=${token}`;

      await navigator.clipboard.writeText(shortUrl);
      alert(`Lien copié ! ${shortUrl}`);

    } catch (error) {
      console.error("Erreur Short Link:", error);
      alert(error.message || "Impossible de générer le lien court");
    } finally {
      setIsDownloading(false);
    }
  };

  // ===================================
  // TÉLÉCHARGEMENT VIA N8N/BROWSERLESS
  // ===================================
  const handleDownloadWithFormat = async (format) => {
    if (isDownloading) return;

    // Fermer le modal de sélection et afficher le modal de progression
    setShowDownloadModal(false);
    setIsDownloading(true);
    setDownloadFormat(format);
    setDownloadProgress(0);
    setShowProgressModal(true);

    // Animation de progression simulée (car n8n ne renvoie pas de progression en temps réel)
    // Durée moyenne: 4-6 secondes, on anime sur ~5 secondes
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        // Progression non-linéaire: rapide au début, ralentit vers la fin
        if (prev < 30) return prev + 6;      // 0-30% en ~1.5s
        if (prev < 60) return prev + 4;      // 30-60% en ~2s
        if (prev < 85) return prev + 2;      // 60-85% en ~3s
        if (prev < 95) return prev + 0.5;    // 85-95% très lent
        return prev; // Reste à 95% jusqu'à la fin réelle
      });
    }, 300);

    try {
      // 1. Créer le Token ("état" du visuel stocké via Netlify Functions)
      const token = await createRenderToken();

      // 2. Construire l'URL sécurisée
      const captureUrl = `${window.location.origin}/render?token=${token}`;

      // 3. Récupérer les dimensions de sortie pour le viewport de browserless
      const outputDims = VISUAL_DIMENSIONS[selectedVisual] || VISUAL_DIMENSIONS['affiche'];

      // 4. Préparer le payload pour N8N
      const payload = {
        captureUrl: captureUrl,
        filename: `Hormur_${selectedVisual}_${Date.now()}`,
        outputFormat: format, // pdf, jpeg, ou png selon le choix de l'utilisateur
        visualLayout: selectedVisual,
        viewport: {
          width: outputDims.width,
          height: outputDims.height
        }
      };

      // 5. Envoyer au Webhook de Capture via Netlify Function proxy
      const response = await fetch('/.netlify/functions/capture-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const responseData = await response.json().catch(() => ({}));
      const result = Array.isArray(responseData) ? responseData[0] : responseData;

      // Finaliser la progression à 100%
      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Petit délai pour montrer les 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      // Télécharger le fichier
      if (result.data && result.mimeType) {
        const link = document.createElement('a');
        link.href = `data:${result.mimeType};base64,${result.data}`;
        link.download = result.filename || `visual.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (result.downloadUrl) {
        // Télécharger le fichier directement via fetch pour éviter les blocages de pop-ups
        try {
          const fileResponse = await fetch(result.downloadUrl);
          const blob = await fileResponse.blob();
          const blobUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = result.filename || `visual.${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Libérer l'URL blob après un court délai
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (fetchError) {
          console.error('Erreur fetch downloadUrl:', fetchError);
          // Fallback: essayer d'ouvrir directement (peut être bloqué)
          window.location.href = result.downloadUrl;
        }
      } else {
        alert('Demande envoyée ! Le téléchargement devrait démarrer sous peu.');
      }
    } catch (e) {
      clearInterval(progressInterval);
      console.error('Erreur téléchargement:', e);
      alert(`Erreur : ${e.message}`);
    } finally {
      setIsDownloading(false);
      setShowProgressModal(false);
      setDownloadProgress(0);
      setDownloadFormat(null);
    }
  };

  // Labels pour l'affichage du format
  const formatLabels = {
    pdf: 'PDF (Impression)',
    jpeg: 'JPEG (Partage)',
    png: 'PNG (Web)'
  };

  const renderVisual = () => {
    const colorObj = getCurrentColor();
    const textColor = colorObj.text;
    const bgColor = colorObj.value;
    const visualType = getCurrentVisualType();
    const aspectRatio = visualType.canvas.width / visualType.canvas.height;
    const isNB = isBlackAndWhite();

    const visualStyle = {
      width: '100%',
      aspectRatio: aspectRatio.toFixed(4),
      backgroundColor: selectedVisual === 'communique' ? '#ffffff' : (isNB ? '#ffffff' : '#ffffff'),
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Acumin Pro ExtraCondensed', 'Arial Narrow', 'Impact', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    };

    const translateX = (currentSettings.positionX - 50);
    const translateY = (currentSettings.positionY - 50);
    const scale = currentSettings.zoom / 100;

    const imageStyle = {
      position: 'absolute',
      top: `${50 + translateY}%`,
      left: `${50 + translateX}%`,
      width: `${100 * scale}%`,
      height: `${100 * scale}%`,
      maxWidth: 'none',
      maxHeight: 'none',
      objectFit: 'contain',
      transform: 'translate(-50%, -50%)',
      transformOrigin: 'center'
    };


    // Ajouter les logos sur tous les autres visuels (couleur) - Masqués pour la v1
    const renderLogos = () => null;
    /* const renderLogos = () => (
      <>
          {hostLogo && (
            <div style={{
              position: 'absolute',
              [(selectedVisual === 'post-rs' || selectedVisual === 'post-rs-45' || selectedVisual === 'storie') ? 'bottom' : 'top']: '3%',
              left: '3%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 10
            }}>
              <img src={hostLogo} alt="Logo Hôte" style={{
                height: (selectedVisual === 'post-rs' || selectedVisual === 'post-rs-45' || selectedVisual === 'storie') ? '24px' : selectedVisual === 'affiche' ? '20px' : '16px',
                width: 'auto'
              }} />
            </div>
          )}
          {artistLogo && (
            <div style={{
              position: 'absolute',
              [(selectedVisual === 'post-rs' || selectedVisual === 'post-rs-45' || selectedVisual === 'storie') ? 'bottom' : 'top']: '3%',
              right: selectedVisual === 'affiche' || selectedVisual === 'flyer-recto' ? '3%' : artistLogo && hostLogo ? '3%' : 'auto',
              left: !artistLogo || !hostLogo ? 'auto' : 'auto',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 10
            }}>
              <img src={artistLogo} alt="Logo Artiste" style={{
                height: (selectedVisual === 'post-rs' || selectedVisual === 'post-rs-45' || selectedVisual === 'storie') ? '24px' : selectedVisual === 'affiche' ? '20px' : '16px',
                width: 'auto'
              }} />
            </div>
          )}
        </>
        ); */

    switch (selectedVisual) {
      case 'affiche':
      case 'flyer-recto':
        return (
          <div ref={visualRef} data-download-target="true" style={visualStyle}>
            {/* Logo Hormur */}
            <DraggableElement
              id="logo"
              isSelected={selectedElement === 'logo'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                top: `${getConfigValue('logo', 'top', 3)}%`,
                left: `${getConfigValue('logo', 'left', 3)}%`,
                zIndex: 3,
              }}
            >
              <img
                src={isNB ? "/logo-hormur-noir.png" : "/logo-hormur-blanc.png"}
                alt="Hormur"
                style={{
                  height: `${getConfigValue('logo', 'height', selectedVisual === 'affiche' ? 24 : 20)}px`,
                  width: 'auto',
                  filter: isNB ? 'none' : 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
                }}
              />
            </DraggableElement>

            {/* Image Container */}
            <div style={{
              position: 'absolute',
              top: `${getConfigValue('imageContainer', 'top', 13.5)}%`,
              left: `${getConfigValue('imageContainer', 'left', 6)}%`,
              width: `${getConfigValue('imageContainer', 'width', 88)}%`,
              height: `${getConfigValue('imageContainer', 'height', 71)}%`,
              zIndex: isNB ? 0 : 1,
              overflow: 'hidden'
            }}>
              <img
                src={uploadedImage}
                alt="Event"
                style={{
                  ...imageStyle,
                  filter: isNB ? 'grayscale(100%) contrast(1.1)' : imageStyle.filter,
                  opacity: isNB ? getConfigValue('image', 'opacity', 0.15) : 1
                }}
              />
            </div>

            {/* Template PNG - Afficher pour tous les visuels */}
            <img
              src={`/${selectedVisual === 'flyer-recto' ? colorObj.flyerTemplate : colorObj.afficheTemplate}`}
              alt="Template"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill', // Force fill to avoid gaps/artifacts
                zIndex: 2,
                pointerEvents: 'none'
              }}
              onError={(e) => {
                const templateName = selectedVisual === 'flyer-recto' ? colorObj.flyerTemplate : colorObj.afficheTemplate;
                console.error('❌ Template PNG manquant:', templateName);
                e.target.style.display = 'none';
              }}
            />

            {/* Nom de l'artiste - NOUVEAU ENCART */}
            {eventData.artistName && eventData.artistName.trim() && (
              <DraggableElement
                id="artistName"
                isSelected={selectedElement === 'artistName'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  bottom: `${getConfigValue('artistName', 'bottom', 17)}%`,
                  left: `${getConfigValue('artistName', 'left', 3)}%`,
                  right: `${getConfigValue('artistName', 'right', 3)}%`,
                  zIndex: 3,
                }}
              >
                <div style={{
                  backgroundColor: isNB ? 'transparent' : bgColor,
                  padding: `${getConfigValue('artistName', 'padding', selectedVisual === 'affiche' ? 8 : 6)}px`,
                  borderRadius: '4px',
                  display: 'inline-block',
                }}>
                  <p style={{
                    fontSize: `${getConfigValue('artistName', 'fontSize', selectedVisual === 'affiche' ? 12 : 10)}px`,
                    fontWeight: getConfigValue('artistName', 'fontWeight', 700),
                    color: textColor,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {eventData.artistName}
                  </p>
                </div>
              </DraggableElement>
            )}

            {/* Titre */}
            <DraggableElement
              id="title"
              isSelected={selectedElement === 'title'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('title', 'bottom', 83)}%`,
                left: `${getConfigValue('title', 'left', 7)}%`,
                right: `${getConfigValue('title', 'right', 3)}%`,
                zIndex: 3,
              }}
            >
              <h1 style={{
                fontSize: `${getConfigValue('title', 'fontSize', selectedVisual === 'affiche' ? 36 : 28)}px`,
                fontWeight: getConfigValue('title', 'fontWeight', 900),
                textTransform: 'uppercase',
                color: textColor,
                margin: 0,
                lineHeight: '1',
                letterSpacing: `${getConfigValue('title', 'letterSpacing', -0.5)}px`,
                textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                {eventData.title}
              </h1>
            </DraggableElement>

            {/* Date */}
            <DraggableElement
              id="date"
              isSelected={selectedElement === 'date'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('date', 'bottom', 18)}%`,
                left: `${getConfigValue('date', 'left', 3)}%`,
                right: `${getConfigValue('date', 'right', 3)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('date', 'fontSize', selectedVisual === 'affiche' ? 16 : 14)}px`,
                fontWeight: getConfigValue('date', 'fontWeight', 700),
                textTransform: 'uppercase',
                color: textColor,
                margin: 0,
                textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.4)'
              }}>
                {eventData.date}
              </p>
            </DraggableElement>

            {/* Heure - NOUVEAU */}
            <DraggableElement
              id="time"
              isSelected={selectedElement === 'time'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('time', 'bottom', 18)}%`,
                left: `${getConfigValue('time', 'left', 20)}%`,
                right: `${getConfigValue('time', 'right', 3)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('time', 'fontSize', selectedVisual === 'affiche' ? 16 : 14)}px`,
                fontWeight: getConfigValue('time', 'fontWeight', 700),
                textTransform: 'uppercase',
                color: textColor,
                margin: 0,
                textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.4)'
              }}>
                {eventData.time}
              </p>
            </DraggableElement>

            {/* Ville */}
            <DraggableElement
              id="city"
              isSelected={selectedElement === 'city'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('city', 'bottom', 18)}%`,
                right: `${getConfigValue('city', 'right', 5)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('city', 'fontSize', selectedVisual === 'affiche' ? 16 : 14)}px`,
                fontWeight: getConfigValue('city', 'fontWeight', 600),
                textTransform: 'uppercase',
                color: textColor,
                margin: 0,
                whiteSpace: 'nowrap',
                textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.3)'
              }}>
                {eventData.city}
              </p>
            </DraggableElement>

            {/* Département */}
            <DraggableElement
              id="department"
              isSelected={selectedElement === 'department'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('department', 'bottom', 5)}%`,
                left: `${getConfigValue('department', 'left', 5)}%`,
                right: `${getConfigValue('department', 'right', 5)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('department', 'fontSize', selectedVisual === 'affiche' ? 18 : 16)}px`,
                fontWeight: getConfigValue('department', 'fontWeight', 900),
                color: textColor,
                margin: 0,
                textShadow: isNB ? '1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.3)'
              }}>
                ({eventData.department})
              </p>
            </DraggableElement>

            {/* Organisateurs */}
            <DraggableElement
              id="organizer"
              isSelected={selectedElement === 'organizer'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('organizer', 'bottom', 5)}%`,
                left: `${getConfigValue('organizer', 'left', 5)}%`,
                right: `${getConfigValue('organizer', 'right', 5)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('organizer', 'fontSize', selectedVisual === 'affiche' ? 13 : 11)}px`,
                fontWeight: getConfigValue('organizer', 'fontWeight', 900),
                textTransform: 'uppercase',
                color: textColor,
                margin: 0,
                textShadow: isNB ? '1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.3)'
              }}>
                {eventData.organizerNames}
              </p>
            </DraggableElement>

            {/* Chez l'habitant - SANS EMOJI */}
            {eventData.chezHabitant && (
              <DraggableElement
                id="chezHabitant"
                isSelected={selectedElement === 'chezHabitant'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  top: `${getConfigValue('chezHabitant', 'top', 83)}%`,
                  left: `${getConfigValue('chezHabitant', 'left', 3)}%`,
                  right: `${getConfigValue('chezHabitant', 'right', 3)}%`,
                  zIndex: 3,
                }}
              >
                <p style={{
                  fontSize: `${getConfigValue('chezHabitant', 'fontSize', selectedVisual === 'affiche' ? 13 : 11)}px`,
                  fontWeight: getConfigValue('chezHabitant', 'fontWeight', 900),
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.8px',
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 3px rgba(0,0,0,0.3)'
                }}>
                  Chez l'habitant
                </p>
              </DraggableElement>
            )}

            {/* Convivialité - SANS EMOJI */}
            {eventData.convivialite !== 'none' && (
              <DraggableElement
                id="convivialite"
                isSelected={selectedElement === 'convivialite'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  bottom: `${getConfigValue('convivialite', 'bottom', 5)}%`,
                  left: `${getConfigValue('convivialite', 'left', 5)}%`,
                  right: `${getConfigValue('convivialite', 'right', 5)}%`,
                  zIndex: 3,
                }}
              >
                <p style={{
                  fontSize: `${getConfigValue('convivialite', 'fontSize', selectedVisual === 'affiche' ? 11 : 9)}px`,
                  fontWeight: getConfigValue('convivialite', 'fontWeight', 900),
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.5px',
                  textShadow: isNB ? '1px 1px 0 #ffffff' : '1px 1px 3px rgba(0,0,0,0.3)'
                }}>
                  {eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}
                </p>
              </DraggableElement>
            )}

            {/* QR Code */}
            <DraggableElement
              id="qrcode"
              isSelected={selectedElement === 'qrcode'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('qrcode', 'bottom', 5)}%`,
                right: `${getConfigValue('qrcode', 'right', 5)}%`,
                zIndex: 3,
              }}
            >
              <div style={{
                backgroundColor: 'white',
                padding: `${getConfigValue('qrcode', 'padding', 6)}px`,
                borderRadius: '6px',
                border: `2px solid ${textColor}`
              }}>
                <QRCodeSVG
                  value={eventData.eventUrl}
                  size={getConfigValue('qrcode', 'size', selectedVisual === 'affiche' ? 52 : 44)}
                  level="M"
                  includeMargin={false}
                  fgColor="#000000"
                />
              </div>
            </DraggableElement>

            {/* Logo Hôte - Masqués pour la v1
            {hostLogo && (
              <DraggableElement
                id="hostLogo"
                isSelected={selectedElement === 'hostLogo'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  bottom: `${getConfigValue('hostLogo', 'bottom', 3)}%`,
                  left: `${getConfigValue('hostLogo', 'left', 3)}%`,
                  zIndex: 4,
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}>
                  <img
                    src={hostLogo}
                    alt="Logo Hôte"
                    style={{
                      height: `${getConfigValue('hostLogo', 'height', selectedVisual === 'affiche' ? 20 : 16)}px`,
                      width: 'auto'
                    }}
                  />
                </div>
              </DraggableElement>
            )}

            {/* Logo Artiste - Masqués pour la v1
            {artistLogo && (
              <DraggableElement
                id="artistLogo"
                isSelected={selectedElement === 'artistLogo'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  bottom: `${getConfigValue('artistLogo', 'bottom', 3)}%`,
                  right: `${getConfigValue('artistLogo', 'right', 3)}%`,
                  zIndex: 4,
                }}
              >
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}>
                  <img
                    src={artistLogo}
                    alt="Logo Artiste"
                    style={{
                      height: `${getConfigValue('artistLogo', 'height', selectedVisual === 'affiche' ? 20 : 16)}px`,
                      width: 'auto'
                    }}
                  />
                </div>
              </DraggableElement>
            )}
            */}
          </div>
        );

      case 'flyer-verso':
        return (
          <div ref={visualRef} data-download-target="true" style={visualStyle}>
            <div style={{
              padding: '20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: textColor,
              backgroundColor: bgColor
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{
                    fontSize: `${getConfigValue('aboutTitle', 'fontSize', 20)}px`,
                    fontWeight: getConfigValue('aboutTitle', 'fontWeight', 900),
                    textTransform: 'uppercase',
                    margin: '0 0 6px 0'
                  }}>
                    À propos
                  </h2>
                  <div style={{
                    width: '50px',
                    height: '3px',
                    backgroundColor: textColor,
                    margin: '0 auto'
                  }}></div>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: `${getConfigValue('description', 'padding', 12)}px`,
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <p style={{
                    fontSize: `${getConfigValue('description', 'fontSize', 11)}px`,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {eventData.description}
                  </p>
                </div>

                {eventData.personalMessage && (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    padding: `${getConfigValue('personalMessage', 'padding', 12)}px`,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${textColor}`,
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      fontSize: `${getConfigValue('personalMessageLabel', 'fontSize', 9)}px`,
                      fontWeight: getConfigValue('personalMessageLabel', 'fontWeight', 700),
                      textTransform: 'uppercase',
                      margin: '0 0 6px 0',
                      opacity: 0.9
                    }}>
                      Message de {eventData.organizerNames}
                    </p>
                    <p style={{
                      fontSize: `${getConfigValue('personalMessage', 'fontSize', 10)}px`,
                      fontStyle: 'italic',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      "{eventData.personalMessage}"
                    </p>
                  </div>
                )}

                {eventData.chezHabitant && (
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <p style={{
                      fontSize: `${getConfigValue('chezHabitant', 'fontSize', 11)}px`,
                      fontWeight: getConfigValue('chezHabitant', 'fontWeight', 900),
                      textTransform: 'uppercase',
                      color: textColor,
                      margin: 0,
                      letterSpacing: '0.8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span>Chez l'habitant</span>
                    </p>
                  </div>
                )}

                {eventData.convivialite !== 'none' && (
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <p style={{
                      fontSize: `${getConfigValue('convivialite', 'fontSize', 10)}px`,
                      fontWeight: getConfigValue('convivialite', 'fontWeight', 900),
                      textTransform: 'uppercase',
                      color: textColor,
                      margin: 0,
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <span>{eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}</span>
                    </p>
                  </div>
                )}
              </div>

              <div style={{ flex: '0 0 auto' }}>
                <div style={{
                  borderTop: `2px solid ${textColor}40`,
                  paddingTop: '12px',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    fontSize: `${getConfigValue('hormurInfo', 'fontSize', 10)}px`,
                    fontWeight: getConfigValue('hormurInfo', 'fontWeight', 700),
                    textTransform: 'uppercase',
                    margin: '0 0 6px 0'
                  }}>
                    Qu'est-ce qu'Hormur ?
                  </h4>
                  <p style={{
                    fontSize: `${getConfigValue('hormurDescription', 'fontSize', 9)}px`,
                    lineHeight: '1.4',
                    margin: 0,
                    opacity: 0.9
                  }}>
                    Hormur relie artistes avec des lieux non conventionnels pour soutenir et protéger la création d'expériences culturelles destinée à toutes et à tous. L'art où on ne l'attend pas !
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: `${getConfigValue('qrcode', 'padding', 5)}px`,
                    borderRadius: '4px',
                    border: `2px solid ${textColor}`
                  }}>
                    <QRCodeSVG
                      value={eventData.eventUrl}
                      size={getConfigValue('qrcode', 'size', 36)}
                      level="M"
                      includeMargin={false}
                      fgColor="#000000"
                    />
                  </div>
                  <img
                    src="/logo-hormur-blanc.png"
                    alt="Hormur"
                    style={{
                      height: `${getConfigValue('logo', 'height', 20)}px`,
                      width: 'auto'
                    }}
                  />
                </div>
              </div>

              {renderLogos()}
            </div>
          </div>
        );

      case 'communique':
        return (
          <div ref={visualRef} data-download-target="true" style={{
            ...visualStyle,
            position: 'relative',
            backgroundColor: '#ffffff'
          }}>
            <img
              src="/communique-template.png"
              alt="Template"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 1
              }}
              onError={() => console.error('❌ Template manquant')}
            />

            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2
            }}>
              <div style={{
                position: 'absolute',
                left: `${getConfigValue('image', 'left', 46.5)}%`,
                top: `${getConfigValue('image', 'top', 9)}%`,
                width: `${getConfigValue('image', 'width', 45)}%`,
                paddingBottom: `${getConfigValue('image', 'paddingBottom', 45)}%`,
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={uploadedImage}
                  alt="Event"
                  style={imageStyle}
                />
              </div>

              <div style={{
                position: 'absolute',
                left: `${getConfigValue('dateBox', 'left', 9.5)}%`,
                top: `${getConfigValue('dateBox', 'top', 42.5)}%`,
                width: `${getConfigValue('dateBox', 'width', 36.5)}%`,
                height: `${getConfigValue('dateBox', 'height', 3.5)}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: `${getConfigValue('dateBox', 'fontSize', 10)}px`,
                  fontWeight: getConfigValue('dateBox', 'fontWeight', 700),
                  color: 'white',
                  margin: 0,
                  letterSpacing: '0.8px'
                }}>
                  Le {eventData.date}
                </p>
              </div>

              <div style={{
                position: 'absolute',
                left: `${getConfigValue('title', 'left', 8)}%`,
                top: `${getConfigValue('title', 'top', 47)}%`,
                width: `${getConfigValue('title', 'width', 36.5)}%`
              }}>
                <h2 style={{
                  fontFamily: "'Open Sans', Arial, sans-serif",
                  fontSize: `${getConfigValue('title', 'fontSize', 8)}px`,
                  fontWeight: getConfigValue('title', 'fontWeight', 800),
                  color: '#1a1a1a',
                  margin: 0,
                  lineHeight: '1.15',
                  textAlign: 'center'
                }}>
                  {eventData.title}
                </h2>
              </div>

              <div style={{
                position: 'absolute',
                left: `${getConfigValue('organizer', 'left', 9.5)}%`,
                top: `${getConfigValue('organizer', 'top', 49)}%`,
                width: `${getConfigValue('organizer', 'width', 36.5)}%`
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: `${getConfigValue('organizer', 'fontSize', 5)}px`,
                  fontStyle: 'italic',
                  color: '#666',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  Appartement de {eventData.organizerNames}
                </p>
              </div>

              <div style={{
                position: 'absolute',
                left: `${getConfigValue('qrcode', 'left', 28)}%`,
                top: `${getConfigValue('qrcode', 'top', 51)}%`,
                width: `${getConfigValue('qrcode', 'width', 11)}%`,
                height: `${getConfigValue('qrcode', 'height', 11)}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <QRCodeSVG
                  value={eventData.eventUrl}
                  size={getConfigValue('qrcode', 'size', 70)}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div style={{
                position: 'absolute',
                left: `${getConfigValue('cityInfo', 'left', 12.5)}%`,
                top: `${getConfigValue('cityInfo', 'top', 56)}%`,
                width: `${getConfigValue('cityInfo', 'width', 18)}%`
              }}>
                <p style={{
                  fontFamily: "'Open Sans', Arial, sans-serif",
                  fontSize: `${getConfigValue('cityInfo', 'fontSize', 4)}px`,
                  color: '#1a1a1a',
                  margin: '0 0 4px 0',
                  fontWeight: getConfigValue('cityInfo', 'fontWeight', 700),
                  lineHeight: '1.3',
                  whiteSpace: 'nowrap'
                }}>
                  {eventData.city} ({eventData.department})
                </p>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: `${getConfigValue('timeInfo', 'fontSize', 4.5)}px`,
                  fontStyle: 'italic',
                  color: '#666',
                  margin: 0,
                  lineHeight: '1.3'
                }}>
                  {eventData.time ? `le ${eventData.date} à ${eventData.time}` : `le ${eventData.date}`}
                </p>
              </div>

              <div style={{
                position: 'absolute',
                left: `${getConfigValue('description', 'left', 47.3)}%`,
                top: `${getConfigValue('description', 'top', 64)}%`,
                width: `${getConfigValue('description', 'width', 41)}%`
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: `${getConfigValue('description', 'fontSize', 7)}px`,
                  fontWeight: getConfigValue('description', 'fontWeight', 700),
                  lineHeight: '1',
                  color: '#1a1a1a',
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {eventData.description.length > 300 ? eventData.description.slice(0, 300) + '...' : eventData.description}
                </p>
              </div>
            </div>

            {renderLogos()}
          </div>
        );

      case 'post-rs':
      case 'post-rs-45':
      case 'storie':
        return (
          <div ref={visualRef} data-download-target="true" style={visualStyle}>
            {/* Logo Hormur */}
            <img
              src={selectedVisual === 'post-rs' ? "/logo-hormur-blanc.png" : (isNB ? "/logo-hormur-noir.png" : "/logo-hormur-blanc.png")}
              alt="Hormur"
              style={{
                position: 'absolute',
                top: `${getConfigValue('logo', 'top', 3)}%`,
                right: `${getConfigValue('logo', 'right', 3)}%`,
                height: `${getConfigValue('logo', 'height', 28)}px`,
                width: 'auto',
                zIndex: 3,
                filter: selectedVisual === 'post-rs' || !isNB ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
              }}
            />

            {/* Image de l'événement */}
            {uploadedImage && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: isNB ? 0 : 1,
                overflow: 'hidden'
              }}>
                <img
                  src={uploadedImage}
                  alt="Event"
                  style={{
                    ...imageStyle,
                    filter: isNB ? 'grayscale(100%) contrast(1.1)' : imageStyle.filter,
                    opacity: isNB ? getConfigValue('image', 'opacity', 0.2) : 1
                  }}
                />
              </div>
            )}

            {/* Template PNG - Afficher pour post-rs-45 et storie uniquement (post-rs est hors template) */}
            {selectedVisual !== 'post-rs' && (
              <img
                key={selectedVisual === 'post-rs-45' ? colorObj.rs45Template : colorObj.storieTemplate}
                src={`/${selectedVisual === 'post-rs-45' ? colorObj.rs45Template : colorObj.storieTemplate}`}
                alt="Template"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 2,
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease-in-out',
                  opacity: 1
                }}
                onError={(e) => {
                  const templateName = selectedVisual === 'post-rs-45' ? colorObj.rs45Template : colorObj.storieTemplate;
                  console.error('❌ Template PNG manquant:', templateName);
                  e.target.style.display = 'none';
                }}
              />
            )}

            {/* Organisateur si chez l'habitant */}
            {eventData.chezHabitant && (
              <DraggableElement
                id="organizer"
                isSelected={selectedElement === 'organizer'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  top: `${getConfigValue('organizer', 'top', 3)}%`,
                  left: `${getConfigValue('organizer', 'left', 3)}%`,
                  right: `${getConfigValue('organizer', 'right', 3)}%`,
                  zIndex: 4,
                }}
              >
                <p style={{
                  fontSize: `${getConfigValue('organizer', 'fontSize', 12)}px`,
                  fontWeight: getConfigValue('organizer', 'fontWeight', 900),
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.8px',
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '0 2px 6px rgba(0,0,0,0.4)',
                  transition: 'color 0.3s ease-in-out'
                }}>
                  {eventData.organizerNames}
                </p>
              </DraggableElement>
            )}

            {/* Titre - Déplaçable */}
            <DraggableElement
              id="title"
              isSelected={selectedElement === 'title'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('title', 'bottom', 30)}%`,
                left: `${getConfigValue('title', 'left', 6)}%`,
                right: `${getConfigValue('title', 'right', 6)}%`,
                zIndex: 3,
              }}
            >
              <h2 style={{
                fontSize: `${getConfigValue('title', 'fontSize', 36)}px`,
                fontWeight: getConfigValue('title', 'fontWeight', 900),
                textTransform: 'uppercase',
                lineHeight: '0.95',
                margin: `${getConfigValue('title', 'marginBottom', -25)}px 0 12px 0`,
                letterSpacing: `${getConfigValue('title', 'letterSpacing', -1)}px`,
                textShadow: isNB ? '3px 3px 0 #ffffff, -3px -3px 0 #ffffff, 3px -3px 0 #ffffff, -3px 3px 0 #ffffff' : '0 2px 8px rgba(0,0,0,0.3)',
                color: textColor,
                transition: 'color 0.3s ease-in-out'
              }}>
                {eventData.title}
              </h2>
            </DraggableElement>

            {/* Nom de l'artiste avec fond couleur - NOUVEAU */}
            {eventData.artistName && eventData.artistName.trim() && (
              <DraggableElement
                id="artistName"
                isSelected={selectedElement === 'artistName'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  bottom: `${getConfigValue('artistName', 'bottom', 40)}%`,
                  left: `${getConfigValue('artistName', 'left', 6)}%`,
                  right: `${getConfigValue('artistName', 'right', 6)}%`,
                  zIndex: 3,
                }}
              >
                <div style={{
                  backgroundColor: isNB ? 'transparent' : bgColor,
                  padding: `${getConfigValue('artistName', 'padding', 8)}px`,
                  borderRadius: '4px',
                  display: 'inline-block',
                }}>
                  <p style={{
                    fontSize: `${getConfigValue('artistName', 'fontSize', 18)}px`,
                    fontWeight: getConfigValue('artistName', 'fontWeight', 700),
                    color: textColor,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {eventData.artistName}
                  </p>
                </div>
              </DraggableElement>
            )}

            {/* Date - Déplaçable */}
            <DraggableElement
              id="date"
              isSelected={selectedElement === 'date'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('date', 'bottom', 25)}%`,
                left: `${getConfigValue('date', 'left', 6)}%`,
                right: `${getConfigValue('date', 'right', 6)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('date', 'fontSize', 18)}px`,
                fontWeight: getConfigValue('date', 'fontWeight', 700),
                textTransform: 'uppercase',
                margin: '0 0 4px 0',
                textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)',
                color: textColor
              }}>
                {eventData.date}
              </p>
            </DraggableElement>

            {/* Heure - NOUVEAU - Déplaçable */}
            <DraggableElement
              id="time"
              isSelected={selectedElement === 'time'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('time', 'bottom', 25)}%`,
                left: `${getConfigValue('time', 'left', 30)}%`,
                right: `${getConfigValue('time', 'right', 6)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('time', 'fontSize', 16)}px`,
                fontWeight: getConfigValue('time', 'fontWeight', 700),
                textTransform: 'uppercase',
                margin: 0,
                textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)',
                color: textColor
              }}>
                {eventData.time}
              </p>
            </DraggableElement>

            {/* Ville - Déplaçable */}
            <DraggableElement
              id="city"
              isSelected={selectedElement === 'city'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('city', 'bottom', 20)}%`,
                left: `${getConfigValue('city', 'left', 6)}%`,
                right: `${getConfigValue('city', 'right', 6)}%`,
                zIndex: 3,
              }}
            >
              <p style={{
                fontSize: `${getConfigValue('city', 'fontSize', 15)}px`,
                fontWeight: getConfigValue('city', 'fontWeight', 600),
                textTransform: 'uppercase',
                margin: '0 0 16px 0',
                whiteSpace: 'nowrap',
                textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)',
                color: textColor
              }}>
                {eventData.city}
              </p>
            </DraggableElement>

            {/* Département - Déplaçable */}
            <DraggableElement
              id="department"
              isSelected={selectedElement === 'department'}
              onSelect={setSelectedElement}
              onDragStart={handleDragStart}
              editMode={editMode}
              style={{
                position: 'absolute',
                bottom: `${getConfigValue('department', 'bottom', 15)}%`,
                left: `${getConfigValue('department', 'left', 3)}%`,
                right: `${getConfigValue('department', 'right', 3)}%`,
                zIndex: 3,
              }}
            >
              <span style={{
                fontSize: `${getConfigValue('department', 'fontSize', 20)}px`,
                fontWeight: getConfigValue('department', 'fontWeight', 900),
                color: textColor,
                textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                ({eventData.department})
              </span>
            </DraggableElement>

            {/* Convivialité - Déplaçable */}
            {eventData.convivialite !== 'none' && (
              <DraggableElement
                id="convivialite"
                isSelected={selectedElement === 'convivialite'}
                onSelect={setSelectedElement}
                onDragStart={handleDragStart}
                editMode={editMode}
                style={{
                  position: 'absolute',
                  bottom: `${getConfigValue('convivialite', 'bottom', 15)}%`,
                  left: `${getConfigValue('convivialite', 'left', 20)}%`,
                  right: `${getConfigValue('convivialite', 'right', 3)}%`,
                  zIndex: 3,
                }}
              >
                <p style={{
                  fontSize: `${getConfigValue('convivialite', 'fontSize', 11)}px`,
                  fontWeight: getConfigValue('convivialite', 'fontWeight', 900),
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.5px',
                  textShadow: isNB ? '1px 1px 0 #ffffff' : '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  {eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}
                </p>
              </DraggableElement>
            )}

            {renderLogos()}
          </div>
        );

      default:
        return null;
    }
  };

  // Page d'attente temporaire (activée via UNDER_MAINTENANCE en haut du fichier)
  if (UNDER_MAINTENANCE) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <a
                href={getAdminUrl(eventData.eventUrl)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline text-sm">Retour</span>
              </a>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">Mes visuels</h1>
              <div className="w-6"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 sm:p-12">
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
                  <Palette size={40} className="text-orange-500" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Outil en cours de fignolage
              </h2>

              <p className="text-gray-600 mb-6 text-lg">
                Notre équipe peaufine les derniers détails pour vous offrir la meilleure expérience possible.
              </p>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg text-left mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ImagePlus size={20} className="text-orange-500" />
                  À quoi va servir cet outil ?
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-1">•</span>
                    <span><strong>Créez vos visuels personnalisés</strong> pour promouvoir votre évènement Hormur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-1">•</span>
                    <span><strong>Affiches, flyers, posts réseaux sociaux</strong> aux couleurs de votre évènement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-1">•</span>
                    <span><strong>Téléchargez et partagez</strong> en quelques clics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold mt-1">•</span>
                    <span><strong>Design professionnel</strong> sans compétences graphiques requises</span>
                  </li>
                </ul>
              </div>

              <p className="text-gray-500 text-sm">
                L'outil sera bientôt disponible. Merci de votre patience !
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 touch-manipulation">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a
              href={getAdminUrl(eventData.eventUrl)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline text-sm">Retour</span>
            </a>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Mes visuels</h1>
            <div className="flex items-center gap-2">
              {isDev && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${editMode
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  <Move size={16} />
                  {editMode ? 'Mode Édition' : 'Éditer'}
                </button>
              )}
              {/* Icône d'abonnement masquée pour la v1
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="text-orange-600 hover:text-orange-700"
              >
                <CreditCard size={20} />
              </button>
              */}
            </div>
          </div>
        </div>
      </div>

      {showImageCrop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Valider l'image</h3>
              <button onClick={() => setShowImageCrop(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ maxHeight: '60vh' }}>
              <img src={tempImage} alt="Preview" className="w-full h-auto object-contain" />
            </div>
            <p className="text-xs text-gray-600 mb-4">💡 {selectedVisual === 'communique' ? 'Image verticale recommandée' : 'Vous pourrez ajuster la position et le zoom après validation'}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowImageCrop(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                Annuler
              </button>
              <button onClick={confirmImageCrop} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <DownloadModal
          onClose={() => setShowDownloadModal(false)}
          onDownload={handleDownloadWithFormat}
        />
      )}

      {showProgressModal && (
        <DownloadProgressModal
          visualPreview={{
            element: visualRef.current,
            aspectRatio: getCurrentVisualType()?.canvas ?
              `${getCurrentVisualType().canvas.width}/${getCurrentVisualType().canvas.height}` : '1/1'
          }}
          formatLabel={formatLabels[downloadFormat] || downloadFormat}
          progress={downloadProgress}
        />
      )}
      {showSendModal && (
        <SendModal
          onClose={() => setShowSendModal(false)}
          onConfirmSend={handleSendConfirm}
          onShowSubscription={handleShowSubscriptionFromSend}
        />
      )}
      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          userEmail={getUrlParams().email}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 lg:pb-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={`${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
            {isDev && (
              <div className="mb-4">
                <DevConfigPanel
                  visualId={selectedVisual}
                  config={getCurrentDevConfig()}
                  onUpdate={updateDevConfig}
                  onExport={exportDevConfig}
                  onImport={importDevConfig}
                />
              </div>
            )}

            <EditPanel
              visualTypes={visualTypes}
              selectedVisual={selectedVisual}
              setSelectedVisual={setSelectedVisual}
              eventData={eventData}
              onTitleChange={handleTitleChange}
              onArtistNameChange={handleArtistNameChange}
              onDescriptionChange={handleDescriptionChange}
              onOrganizerChange={handleOrganizerChange}
              onChezHabitantChange={handleChezHabitantChange}
              onPersonalMessageChange={handlePersonalMessageChange}
              onEventUrlChange={handleEventUrlChange}
              onTimeChange={handleTimeChange}
              convivialiteOptions={convivialiteOptions}
              onConvivialiteChange={handleConvivialiteChange}
              dragActive={dragActive}
              onDrag={handleDrag}
              onDrop={handleDrop}
              uploadedImage={uploadedImage}
              fileInputRef={fileInputRef}
              onImageUpload={handleImageUpload}
              hormurColors={hormurColors}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              imagePositionX={currentSettings.positionX}
              imagePositionY={currentSettings.positionY}
              imageZoom={currentSettings.zoom}
              onImagePositionXChange={handleImagePositionXChange}
              onImagePositionYChange={handleImagePositionYChange}
              onImageZoomChange={handleImageZoomChange}
              onResetImagePosition={handleResetImagePosition}
              isBlackAndWhite={isBlackAndWhite()}
              hostLogo={hostLogo}
              artistLogo={artistLogo}
              onHostLogoUpload={handleHostLogoUpload}
              onArtistLogoUpload={handleArtistLogoUpload}
              onHostLogoRemove={handleHostLogoRemove}
              onArtistLogoRemove={handleArtistLogoRemove}
              hostLogoInputRef={hostLogoInputRef}
              artistLogoInputRef={artistLogoInputRef}
              isMobileView={mobileView === 'preview'}
              isReformulating={isReformulating}
            />
          </div>

          <div className={`lg:sticky lg:top-24 h-fit ${mobileView === 'edit' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-base">Aperçu</h2>
                <div className="flex gap-2">
                  {ENABLE_SEND_BUTTON && (
                    <button
                      onClick={() => setShowSendModal(true)}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Mail size={16} />
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    disabled={isDownloading || isImageLoading}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    title={isImageLoading ? "Chargement de l'image en cours..." : ""}
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">{isImageLoading ? 'Chargement...' : 'Télécharger'}</span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                {mobileView === 'preview' && (
                  <div className="bg-white rounded-lg p-3 mb-4 space-y-3 lg:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Move size={14} className="text-orange-500" />
                        Position & Zoom
                      </h3>
                      <button
                        onClick={handleResetImagePosition}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Réinitialiser
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        ↔️ Horizontal : {currentSettings.positionX}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentSettings.positionX}
                        onChange={handleImagePositionXChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        ↕️ Vertical : {currentSettings.positionY}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentSettings.positionY}
                        onChange={handleImagePositionYChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                        <ZoomIn size={12} /> Zoom : {currentSettings.zoom}%
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="400"
                        value={currentSettings.zoom}
                        onChange={handleImageZoomChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>
                )}

                <ScalablePreview
                  selectedVisual={selectedVisual}
                  visualDimensions={VISUAL_DIMENSIONS}
                >
                  {renderVisual()}
                </ScalablePreview>
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                ✨ Modifications en temps réel
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-2xl">
        <div className="flex">
          <button
            onClick={() => setMobileView('edit')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mobileView === 'edit'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600'
              }`}
          >
            <Edit3 size={18} />
            Éditer
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${mobileView === 'preview'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600'
              }`}
          >
            <Eye size={18} />
            Aperçu
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
