import { useState, useRef, memo, useCallback, useEffect } from 'react';
import { ArrowLeft, Download, ImagePlus, Palette, Type, FileText, X, Eye, Edit3, Home, Mail, CreditCard, Check, Move, ZoomIn } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const hormurColors = [
  { 
    name: 'Bleu Océan', 
    value: '#1380c7', 
    text: '#feb7db',
    postTemplate: 'PostPRO_CONCERT_1_bleu.png',
    afficheTemplate: 'Affiche_CONCERT_Bleu.png'
  },
  { 
    name: 'Vert Émeraude', 
    value: '#00b179', 
    text: '#d7f879',
    postTemplate: 'PostPRO_CONCERT_5_Vert.png',
    afficheTemplate: 'Affiche_CONCERT_Vert.png'
  },
  { 
    name: 'Vert Pomme', 
    value: '#d7f879', 
    text: '#00b17e',
    postTemplate: 'PostPRO_CONCERT_6_VertCitron.png',
    afficheTemplate: 'Affiche_CONCERT_Citron.png'
  },
  { 
    name: 'Jaune Citron', 
    value: '#f7ce64', 
    text: '#f75b40',
    postTemplate: 'PostPRO_CONCERT_3_Jaune.png',
    afficheTemplate: 'Affiche_CONCERT_Jaune.png'
  },
  { 
    name: 'Orange Hormur', 
    value: '#fb593d', 
    text: '#f7ce64',
    postTemplate: 'PostPRO_CONCERT_4_Orange.png',
    afficheTemplate: 'Affiche_CONCERT_Orange.png'
  },
  { 
    name: 'Rose Saumon', 
    value: '#fd94ac', 
    text: '#157fcd',
    postTemplate: 'PostPRO_CONCERT_7_RoseRouge.png',
    afficheTemplate: 'Affiche_CONCERT_RoseR.png'
  },
  { 
    name: 'Rose Bonbon', 
    value: '#fca0ba', 
    text: '#fc4735',
    postTemplate: 'PostPRO_CONCERT_2_Rose.png',
    afficheTemplate: 'Affiche_CONCERT_Rose.png'
  },
  { 
    name: 'Rouge Vif', 
    value: '#fc4735', 
    text: '#feb7db',
    postTemplate: 'PostPRO_CONCERT_8_Rouge.png',
    afficheTemplate: 'Affiche_CONCERT_RougeR.png'
  },
  { 
    name: 'Noir & Blanc', 
    value: '#ffffff', 
    text: '#000000',
    isBlackAndWhite: true,
    displayName: 'Noir & Blanc'
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
    name: 'Post RS',
    icon: '📱',
    canvas: { width: 1080, height: 1080 },
    pdf: { width: 210, height: 210 }
  }
];

const convivialiteOptions = [
  { value: 'none', label: 'Aucun' },
  { value: 'repas', label: 'Repas partagé' },
  { value: 'apero', label: 'Apéro participatif' }
];

const TitleInput = memo(({ value, onChange }) => (
  <input
    type="text"
    maxLength={40}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
));

const ArtistNameInput = memo(({ value, onChange }) => (
  <input
    type="text"
    maxLength={40}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="La Valse des Hippos"
  />
));

const DescriptionInput = memo(({ value, onChange }) => (
  <textarea
    value={value}
    onChange={onChange}
    rows={3}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  />
));

const OrganizerInput = memo(({ value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="Sophie & Martin"
  />
));

const PersonalMessageInput = memo(({ value, onChange }) => (
  <textarea
    value={value}
    onChange={onChange}
    rows={2}
    maxLength={120}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="Hâte de vous accueillir..."
  />
));

const EventUrlInput = memo(({ value, onChange }) => (
  <input
    type="url"
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    placeholder="https://hormur.com/event/..."
  />
));

const DownloadModal = ({ onClose, onDownload, isDownloading }) => {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Télécharger le visuel</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isDownloading}>
            <X size={24} />
          </button>
        </div>

        {isMobile && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
            <p className="text-xs text-blue-900">
              💡 <strong>Astuce:</strong> Passez en mode <strong>Aperçu</strong> avant de télécharger pour de meilleurs résultats.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">Choisissez le format :</p>

        <div className="space-y-3">
          <button
            onClick={() => onDownload('pdf')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? '⏳ Génération...' : '📄 PDF (Impression)'}
          </button>
          <button
            onClick={() => onDownload('jpeg')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? '⏳ Génération...' : '🖼️ JPEG (Partage)'}
          </button>
          <button
            onClick={() => onDownload('png')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? '⏳ Génération...' : '🎨 PNG (Web)'}
          </button>
        </div>

        {isDownloading && (
          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-900 text-center">
              ⏳ Génération en cours, merci de patienter...
            </p>
          </div>
        )}
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
          <strong>📧 Envoi automatique</strong><br/>
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

const SubscriptionModal = ({ onClose }) => (
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
          </div>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span><strong>Envois illimités</strong> email/SMS</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span>Téléchargements illimités HD</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span>10+ templates exclusifs</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span><strong>Suggestions IA</strong> (titres)</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <span>Support prioritaire</span>
            </li>
          </ul>
          <button className="w-full py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600">
            Essayer 7 jours gratuits
          </button>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          💡 L'abonnement Premium est idéal si vous organisez plus de 2 événements par mois.
        </p>
      </div>
    </div>
  </div>
);

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
  isBlackAndWhite
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
            className={`p-2 rounded-lg border-2 transition-all ${
              selectedVisual === type.id
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
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre <span className="text-gray-400">(max 40 car.)</span>
          </label>
          <TitleInput
            value={eventData.title}
            onChange={onTitleChange}
          />
          <div className="text-xs text-gray-500 mt-1">{eventData.title.length}/40</div>
        </div>

        {isBlackAndWhite && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'artiste <span className="text-gray-400">(max 40 car.)</span>
            </label>
            <ArtistNameInput
              value={eventData.artistName}
              onChange={onArtistNameChange}
            />
            <div className="text-xs text-gray-500 mt-1">{eventData.artistName.length}/40</div>
          </div>
        )}

        {(selectedVisual === 'flyer-verso' || selectedVisual === 'communique') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <DescriptionInput
              value={eventData.description}
              onChange={onDescriptionChange}
            />
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
            Prénoms (hôte & artiste)
          </label>
          <OrganizerInput
            value={eventData.organizerNames}
            onChange={onOrganizerChange}
          />
          <p className="text-xs text-gray-500 mt-1">Ex: "Sophie & Martin" ou "Sophie"</p>
        </div>

        {selectedVisual !== 'post-rs' && (
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

        {(selectedVisual === 'flyer-verso' || selectedVisual === 'communique') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message personnel <span className="text-gray-400">(max 120 car.)</span>
            </label>
            <PersonalMessageInput
              value={eventData.personalMessage}
              onChange={onPersonalMessageChange}
            />
            <div className="text-xs text-gray-500 mt-1">{eventData.personalMessage.length}/120</div>
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
                  className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                    eventData.convivialite === option.value
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de l'événement
          </label>
          <EventUrlInput
            value={eventData.eventUrl}
            onChange={onEventUrlChange}
          />
          <p className="text-xs text-gray-500 mt-1">Pour le QR code</p>
        </div>
      </div>
    </div>

    {!isBlackAndWhite && (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
          <ImagePlus size={18} className="text-orange-500" />
          Image {selectedVisual !== 'communique' && '(format carré recommandé)'}
        </h2>
        <div className="space-y-3">
          <div
            className={`relative h-40 rounded-lg overflow-hidden border-2 border-dashed transition-colors ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
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
                max="200"
                value={imageZoom}
                onChange={onImageZoomChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>

          {selectedVisual !== 'communique' && (
            <p className="text-xs text-gray-500 text-center">💡 Ajustez la position et le zoom pour un cadrage parfait</p>
          )}
        </div>
      </div>
    )}

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
              className={`aspect-square rounded-lg transition-all flex items-center justify-center text-xs font-bold ${
                selectedColor === color.value
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

const App = () => {
  const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      eventName: params.get('eventName') || '',
      eventDescription: params.get('eventDescription') || '',
      eventDate: params.get('eventDate') || '',
      eventURL: params.get('eventURL') || '',
      eventImage: params.get('eventImage') || ''
    };
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

  const [eventData, setEventData] = useState(() => {
    const urlParams = getUrlParams();
    const savedData = localStorage.getItem('hormur_event_data');
    
    if (urlParams.eventName || urlParams.eventURL) {
      const initialData = {
        title: urlParams.eventName || "Trio de contrebasses",
        artistName: "La Valse des Hippos",
        date: formatDate(urlParams.eventDate) || "16 NOV 2025",
        time: "17h",
        city: extractCityFromURL(urlParams.eventURL) || "JOUÉ-LÈS-TOURS",
        department: "37",
        organizerNames: "Sophie & Martin",
        eventUrl: urlParams.eventURL || "https://hormur.com/event/01994344-f113-7096-a7-6f6e28d480",
        description: urlParams.eventDescription || "Découvrez un concert intimiste dans un cadre chaleureux et convivial.",
        personalMessage: "Hâte de vous accueillir pour cette soirée unique !",
        convivialite: "repas",
        chezHabitant: true
      };
      localStorage.setItem('hormur_event_data', JSON.stringify(initialData));
      return initialData;
    }
    
    if (savedData) {
      return JSON.parse(savedData);
    }
    
    return {
      title: "Trio de contrebasses",
      artistName: "La Valse des Hippos",
      date: "16 NOV 2025",
      time: "17h",
      city: "JOUÉ-LÈS-TOURS",
      department: "37",
      organizerNames: "Sophie & Martin",
      eventUrl: "https://hormur.com/event/01994344-f113-7096-a7-6f6e28d480",
      description: "Découvrez un concert intimiste dans un cadre chaleureux et convivial.",
      personalMessage: "Hâte de vous accueillir pour cette soirée unique !",
      convivialite: "repas",
      chezHabitant: true
    };
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

  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [mobileView, setMobileView] = useState('edit');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [imageSettings, setImageSettings] = useState(() => {
    const saved = localStorage.getItem('hormur_image_settings');
    return saved ? JSON.parse(saved) : {
      affiche: { positionX: 50, positionY: 50, zoom: 100 },
      flyerRecto: { positionX: 50, positionY: 50, zoom: 100 },
      flyerVerso: { positionX: 50, positionY: 50, zoom: 100 },
      communique: { positionX: 50, positionY: 50, zoom: 100 },
      postRS: { positionX: 50, positionY: 50, zoom: 100 }
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
    localStorage.setItem('hormur_uploaded_image', uploadedImage);
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
      'post-rs': 'postRS'
    };
    return mapping[visualId] || 'affiche';
  };

  const getCurrentSettings = () => {
    const key = getSettingsKey(selectedVisual);
    return imageSettings[key];
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

  const handleSendConfirm = useCallback(() => {
    alert('✅ Envoi réussi !\n\nLes visuels ont été envoyés aux organisateurs par email.');
    setShowSendModal(false);
  }, []);

  const handleShowSubscriptionFromSend = useCallback(() => {
    setShowSendModal(false);
    setShowSubscriptionModal(true);
  }, []);

  const fileInputRef = useRef(null);
  const visualRef = useRef(null);

  const handleTitleChange = useCallback((e) => {
    setEventData(prev => ({...prev, title: e.target.value}));
  }, []);

  const handleArtistNameChange = useCallback((e) => {
    setEventData(prev => ({...prev, artistName: e.target.value.slice(0, 40)}));
  }, []);

  const handleDescriptionChange = useCallback((e) => {
    setEventData(prev => ({...prev, description: e.target.value}));
  }, []);

  const handleOrganizerChange = useCallback((e) => {
    setEventData(prev => ({...prev, organizerNames: e.target.value}));
  }, []);

  const handlePersonalMessageChange = useCallback((e) => {
    setEventData(prev => ({...prev, personalMessage: e.target.value.slice(0, 120)}));
  }, []);

  const handleEventUrlChange = useCallback((e) => {
    setEventData(prev => ({...prev, eventUrl: e.target.value}));
  }, []);

  const handleChezHabitantChange = useCallback((e) => {
    setEventData(prev => ({...prev, chezHabitant: e.target.checked}));
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

  const getCurrentColor = () => {
    return hormurColors.find(c => c.value === selectedColor) || hormurColors[0];
  };

  const getCurrentVisualType = () => {
    return visualTypes.find(v => v.id === selectedVisual) || visualTypes[0];
  };

  const isBlackAndWhite = () => {
    const color = getCurrentColor();
    return color.isBlackAndWhite === true;
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
    setUploadedImage(tempImage);
    setShowImageCrop(false);
    setTempImage(null);
    updateCurrentSettings({ positionX: 50, positionY: 50, zoom: 100 });
  };

  const handleDownload = async (format) => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const element = visualRef.current;
      if (!element) throw new Error("Aucun visuel à capturer");

      const parent = element.parentElement;
      const original = {
        display: parent.style.display,
        visibility: parent.style.visibility,
        position: parent.style.position,
        zIndex: parent.style.zIndex
      };
      parent.style.display = 'block';
      parent.style.visibility = 'visible';
      parent.style.position = 'relative';
      parent.style.zIndex = '9999';
      await new Promise(r => setTimeout(r, 200));

      if (document.fonts) await document.fonts.ready;

      const imgEls = element.querySelectorAll('img');

      const convertToBase64 = (img) =>
        fetch(img.src, { mode: 'cors' })
          .then(res => res.blob())
          .then(blob => new Promise((resolve) => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.readAsDataURL(blob);
          }))
          .catch(() => img.src);

      await Promise.all(
        Array.from(imgEls).map(async (img) => {
          const dataUrl = await convertToBase64(img);
          img.setAttribute('data-original-src', img.src);
          img.src = dataUrl;
        })
      );

      await new Promise(r => setTimeout(r, 400));

      const scale = 3;

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        logging: false
      });

      imgEls.forEach(img => {
        const originalSrc = img.getAttribute('data-original-src');
        if (originalSrc) img.src = originalSrc;
      });
      Object.assign(parent.style, original);

      const filename = `hormur-${selectedVisual}-${Date.now()}`;

      if (format === "pdf") {
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [210, 297]
        });
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
        pdf.save(`${filename}.pdf`);
      } else {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${filename}.${format === "jpeg" ? "jpg" : "png"}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, format === "jpeg" ? "image/jpeg" : "image/png", 1);
      }

    } catch (e) {
      alert("Erreur lors de la génération.");
      console.error("❌ ERREUR EXPORT :", e);
    } finally {
      setIsDownloading(false);
      setShowDownloadModal(false);
    }
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
      top: '50%',
      left: '50%',
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      transform: `translate(calc(-50% + ${translateX}%), calc(-50% + ${translateY}%)) scale(${scale})`,
      transformOrigin: 'center'
    };

    if (isNB && (selectedVisual === 'affiche' || selectedVisual === 'flyer-recto')) {
      const isAffiche = selectedVisual === 'affiche';
      return (
        <div ref={visualRef} data-download-target="true" style={visualStyle}>
          <img
            src="/logo-hormur-couleur.png"
            alt="Hormur"
            style={{
              position: 'absolute',
              top: '3%',
              left: '3%',
              height: isAffiche ? '24px' : '20px',
              width: 'auto',
              zIndex: 3
            }}
          />

          <div style={{
            position: 'absolute',
            top: '13.5%',
            left: '6%',
            width: '88%',
            height: '71%',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '3px solid #000000',
              borderRadius: '16px',
              padding: isAffiche ? '16px 24px' : '12px 18px',
              display: 'inline-block',
              maxWidth: '90%'
            }}>
              <p style={{
                fontSize: isAffiche ? '28px' : '22px',
                fontWeight: '900',
                textTransform: 'uppercase',
                color: '#000000',
                margin: 0,
                lineHeight: '1.1',
                textAlign: 'center',
                letterSpacing: '-0.5px'
              }}>
                {eventData.artistName}
              </p>
            </div>
          </div>

          {eventData.chezHabitant && (
            <div style={{
              position: 'absolute',
              top: '83%',
              left: '3%',
              zIndex: 3
            }}>
              <p style={{
                fontSize: isAffiche ? '13px' : '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                color: '#000000',
                margin: 0,
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: isAffiche ? '16px' : '14px' }}>🏠</span>
                <span>Chez l'habitant</span>
              </p>
            </div>
          )}

          <div style={{
            position: 'absolute',
            bottom: '83.5%',
            left: '7%',
            right: '3%',
            textAlign: 'left',
            zIndex: 3
          }}>
            <h1 style={{
              fontSize: isAffiche ? '36px' : '28px',
              fontWeight: '900',
              textTransform: 'uppercase',
              color: '#000000',
              margin: 0,
              lineHeight: '1',
              letterSpacing: '-0.5px'
            }}>
              {eventData.title}
            </h1>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '18%',
            left: '3%',
            right: '5%',
            display: 'flex',
            justifyContent: 'flex-start',
            gap: '16px',
            zIndex: 3
          }}>
            <p style={{
              fontSize: isAffiche ? '16px' : '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              color: '#000000',
              margin: 0
            }}>
              {eventData.date}
            </p>
            <p style={{
              fontSize: isAffiche ? '16px' : '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#000000',
              margin: 0
            }}>
              {eventData.city}
            </p>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '5%',
            left: '3%',
            right: '3%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            zIndex: 3
          }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: isAffiche ? '18px' : '16px',
                fontWeight: '900',
                color: '#000000',
                margin: '0 0 4px 0'
              }}>
                ({eventData.department})
              </p>
              <p style={{
                fontSize: isAffiche ? '13px' : '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                color: '#000000',
                margin: 0
              }}>
                {eventData.organizerNames}
              </p>
              
              {eventData.convivialite !== 'none' && (
                <p style={{
                  fontSize: isAffiche ? '11px' : '9px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  color: '#000000',
                  margin: '6px 0 0 0',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: isAffiche ? '14px' : '12px' }}>
                    {eventData.convivialite === 'repas' ? '🍽️' : '🥂'}
                  </span>
                  <span>{eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}</span>
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: isAffiche ? '10px' : '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#000000',
                margin: '0 0 2px 0'
              }}>
                Nous contacter
              </p>
              <p style={{
                fontSize: isAffiche ? '10px' : '8px',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 8px 0'
              }}>
                contact@hormur.com
              </p>
              <p style={{
                fontSize: isAffiche ? '10px' : '8px',
                fontWeight: '700',
                textTransform: 'uppercase',
                color: '#000000',
                margin: '0 0 2px 0'
              }}>
                Réservation sur
              </p>
              <p style={{
                fontSize: isAffiche ? '10px' : '8px',
                fontWeight: '600',
                color: '#000000',
                margin: 0
              }}>
                Hormur.com
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '4px',
              borderRadius: '6px',
              border: `2px solid #000000`,
              marginLeft: '12px'
            }}>
              <QRCodeSVG
                value={eventData.eventUrl}
                size={isAffiche ? 52 : 44}
                level="M"
                includeMargin={false}
                fgColor="#000000"
              />
            </div>
          </div>
        </div>
      );
    }

    if (isNB && selectedVisual === 'post-rs') {
      return (
        <div ref={visualRef} data-download-target="true" style={visualStyle}>
          <img
            src="/logo-hormur-couleur.png"
            alt="Hormur"
            style={{
              position: 'absolute',
              top: '3%',
              right: '3%',
              height: '28px',
              width: 'auto',
              zIndex: 3
            }}
          />

          <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              border: '4px solid #000000',
              borderRadius: '20px',
              padding: '24px 32px',
              display: 'inline-block',
              maxWidth: '85%'
            }}>
              <p style={{
                fontSize: '48px',
                fontWeight: '900',
                textTransform: 'uppercase',
                color: '#000000',
                margin: 0,
                lineHeight: '1.1',
                textAlign: 'center',
                letterSpacing: '-1px'
              }}>
                {eventData.artistName}
              </p>
            </div>
          </div>

          {eventData.chezHabitant && (
            <div style={{
              position: 'absolute',
              top: '3%',
              left: '3%',
              zIndex: 4
            }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '900',
                textTransform: 'uppercase',
                color: '#000000',
                margin: 0,
                letterSpacing: '0.8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ fontSize: '14px' }}>🏠</span>
                <span>{eventData.organizerNames}</span>
              </p>
            </div>
          )}

          <div style={{
            position: 'absolute',
            inset: 0,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: '#000000',
            zIndex: 2
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'start'
            }}>
            </div>

            <div>
              <h2 style={{
                fontSize: '36px',
                fontWeight: '900',
                textTransform: 'uppercase',
                lineHeight: '0.95',
                margin: '-25px 0 12px 0',
                letterSpacing: '-1px',
                color: '#000000'
              }}>
                {eventData.title}
              </h2>
              
              <p style={{
                fontSize: '18px',
                fontWeight: '700',
                textTransform: 'uppercase',
                margin: '0 0 4px 0',
                color: '#000000'
              }}>
                {eventData.date}
              </p>
              
              <p style={{
                fontSize: '15px',
                fontWeight: '600',
                textTransform: 'uppercase',
                margin: '0 0 16px 0',
                color: '#000000'
              }}>
                {eventData.city}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: `2px solid #000000`
              }}>
                <div style={{ textAlign: 'left' }}>
                  <p style={{
                    fontSize: '20px',
                    fontWeight: '900',
                    color: '#000000',
                    margin: '0 0 8px 0'
                  }}>
                    ({eventData.department})
                  </p>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: '#000000',
                    margin: '0 0 2px 0'
                  }}>
                    Nous contacter
                  </p>
                  <p style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#000000',
                    margin: '0 0 8px 0'
                  }}>
                    contact@hormur.com
                  </p>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: '#000000',
                    margin: '0 0 2px 0'
                  }}>
                    Réservation sur
                  </p>
                  <p style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: '#000000',
                    margin: 0
                  }}>
                    Hormur.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch(selectedVisual) {
      case 'affiche':
      case 'flyer-recto':
        return (
          <div ref={visualRef} data-download-target="true" style={visualStyle}>
            <img
              src="/logo-hormur-blanc.png"
              alt="Hormur"
              style={{
                position: 'absolute',
                top: '3%',
                left: '3%',
                height: selectedVisual === 'affiche' ? '24px' : '20px',
                width: 'auto',
                zIndex: 3,
                filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
              }}
            />

            <div style={{
              position: 'absolute',
              top: '13.5%',
              left: '6%',
              width: '88%',
              height: '71%',
              zIndex: 1,
              overflow: 'hidden'
            }}>
              <img
                src={uploadedImage}
                alt="Event"
                style={imageStyle}
              />
            </div>

            <img
              src={`/${colorObj.afficheTemplate}`}
              alt="Template"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 2,
                pointerEvents: 'none'
              }}
              onError={(e) => {
                console.error('❌ Template PNG manquant:', colorObj.afficheTemplate);
                e.target.style.display = 'none';
              }}
            />

            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3
            }}>
              {eventData.chezHabitant && (
                <div style={{
                  position: 'absolute',
                  top: '83%',
                  left: '3%'
                }}>
                  <p style={{
                    fontSize: selectedVisual === 'affiche' ? '13px' : '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0,
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
                  }}>
                    <span style={{ fontSize: selectedVisual === 'affiche' ? '16px' : '14px' }}>🏠</span>
                    <span>Chez l'habitant</span>
                  </p>
                </div>
              )}

              <div style={{
                position: 'absolute',
                bottom: '83.5%',
                left: '7%',
                right: '3%',
                textAlign: 'left'
              }}>
                <h1 style={{
                  fontSize: selectedVisual === 'affiche' ? '36px' : '28px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  lineHeight: '1',
                  letterSpacing: '-0.5px',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {eventData.title}
                </h1>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '18%',
                left: '3%',
                right: '5%',
                display: 'flex',
                justifyContent: 'flex-start',
                gap: '16px'
              }}>
                <p style={{
                  fontSize: selectedVisual === 'affiche' ? '16px' : '14px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.4)'
                }}>
                  {eventData.date}
                </p>
                <p style={{
                  fontSize: selectedVisual === 'affiche' ? '16px' : '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {eventData.city}
                </p>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '5%',
                left: '5%',
                right: '5%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: selectedVisual === 'affiche' ? '18px' : '16px',
                    fontWeight: '900',
                    color: textColor,
                    margin: '0 0 4px 0',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    ({eventData.department})
                  </p>
                  <p style={{
                    fontSize: selectedVisual === 'affiche' ? '13px' : '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {eventData.organizerNames}
                  </p>
                  
                  {eventData.convivialite !== 'none' && (
                    <p style={{
                      fontSize: selectedVisual === 'affiche' ? '11px' : '9px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: textColor,
                      margin: '6px 0 0 0',
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      <span style={{ fontSize: selectedVisual === 'affiche' ? '14px' : '12px' }}>
                        {eventData.convivialite === 'repas' ? '🍽️' : '🥂'}
                      </span>
                      <span>{eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}</span>
                    </p>
                  )}
                </div>

                <div style={{
                  backgroundColor: 'white',
                  padding: '6px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: `2px solid ${textColor}`
                }}>
                  <QRCodeSVG
                    value={eventData.eventUrl}
                    size={selectedVisual === 'affiche' ? 52 : 44}
                    level="M"
                    includeMargin={false}
                    fgColor="#000000"
                  />
                </div>
              </div>
            </div>
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
                    fontSize: '20px',
                    fontWeight: '900',
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
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <p style={{
                    fontSize: '11px',
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {eventData.description}
                  </p>
                </div>

                {eventData.personalMessage && (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    padding: '12px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${textColor}`,
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      margin: '0 0 6px 0',
                      opacity: 0.9
                    }}>
                      Message de {eventData.organizerNames}
                    </p>
                    <p style={{
                      fontSize: '10px',
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
                      fontSize: '11px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: textColor,
                      margin: 0,
                      letterSpacing: '0.8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '14px' }}>🏠</span>
                      <span>Chez l'habitant</span>
                    </p>
                  </div>
                )}

                {eventData.convivialite !== 'none' && (
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: textColor,
                      margin: 0,
                      letterSpacing: '0.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '13px' }}>
                        {eventData.convivialite === 'repas' ? '🍽️' : '🥂'}
                      </span>
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
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    margin: '0 0 6px 0'
                  }}>
                    Qu'est-ce qu'Hormur ?
                  </h4>
                  <p style={{
                    fontSize: '9px',
                    lineHeight: '1.4',
                    margin: 0,
                    opacity: 0.9
                  }}>
                    Hormur connecte des artistes avec des lieux non conventionnels pour créer des expériences culturelles uniques. L'art où on ne l'attend pas !
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '5px',
                    borderRadius: '4px',
                    border: `2px solid ${textColor}`
                  }}>
                    <QRCodeSVG
                      value={eventData.eventUrl}
                      size={36}
                      level="M"
                      includeMargin={false}
                      fgColor="#000000"
                    />
                  </div>
                  <img
                    src="/logo-hormur-blanc.png"
                    alt="Hormur"
                    style={{
                      height: '20px',
                      width: 'auto'
                    }}
                  />
                </div>
              </div>
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
                left: '46.5%',
                top: '9%',
                width: '45%',
                paddingBottom: '45%',
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
                left: '9.5%',
                top: '42.5%',
                width: '36.5%',
                height: '3.5%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: '10px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  letterSpacing: '0.8px'
                }}>
                  Le {eventData.date}
                </p>
              </div>

              <div style={{
                position: 'absolute',
                left: '8%',
                top: '47%',
                width: '36.5%'
              }}>
                <h2 style={{
                  fontFamily: "'Open Sans', Arial, sans-serif",
                  fontSize: '8px',
                  fontWeight: '800',
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
                left: '9.5%',
                top: '49%',
                width: '36.5%'
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: '5px',
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
                left: '28%',
                top: '51%',
                width: '11%',
                height: '11%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <QRCodeSVG
                  value={eventData.eventUrl}
                  size={70}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div style={{
                position: 'absolute',
                left: '12.5%',
                top: '56%',
                width: '18%'
              }}>
                <p style={{
                  fontFamily: "'Open Sans', Arial, sans-serif",
                  fontSize: '4px',
                  color: '#1a1a1a',
                  margin: '0 0 4px 0',
                  fontWeight: '700',
                  lineHeight: '1.3'
                }}>
                  {eventData.city} ({eventData.department})
                </p>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: '4.5px',
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
                left: '47.3%',
                top: '64%',
                width: '41%'
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: '7px',
                  fontWeight: '700',
                  lineHeight: '1',
                  color: '#1a1a1a',
                  margin: 0,
                  textAlign: 'justify'
                }}>
                  {eventData.description}
                </p>
              </div>
            </div>
          </div>
        );

      case 'post-rs':
        return (
          <div ref={visualRef} data-download-target="true" style={visualStyle}>
            <img
              src="/logo-hormur-blanc.png"
              alt="Hormur"
              style={{
                position: 'absolute',
                top: '3%',
                right: '3%',
                height: '28px',
                width: 'auto',
                zIndex: 3,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}
            />

            <div style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              zIndex: 1,
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <img
                src={uploadedImage}
                alt="Event"
                style={imageStyle}
              />
            </div>

            <img
              src={`/${colorObj.postTemplate}`}
              alt="Template"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 2,
                pointerEvents: 'none'
              }}
              onError={(e) => {
                console.error('❌ Template PNG manquant:', colorObj.postTemplate);
                e.target.style.display = 'none';
              }}
            />

            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: textColor,
              zIndex: 3
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}>
                {eventData.chezHabitant && (
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0,
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}>
                    <span style={{ fontSize: '16px' }}>🏠</span>
                    <span>{eventData.organizerNames}</span>
                  </p>
                )}
              </div>

              <div>
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  lineHeight: '0.95',
                  margin: '-25px 0 12px 0',
                  letterSpacing: '-1px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}>
                  {eventData.title}
                </h2>
                
                <p style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  margin: '0 0 4px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {eventData.date}
                </p>
                
                <p style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  margin: '0 0 16px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {eventData.city}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: `2px solid ${textColor}60`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '900',
                      color: textColor,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      ({eventData.department})
                    </span>

                    {eventData.convivialite !== 'none' && (
                      <p style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        color: textColor,
                        margin: 0,
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textShadow: '0 2px 6px rgba(0,0,0,0.4)'
                      }}>
                        <span style={{ fontSize: '14px' }}>
                          {eventData.convivialite === 'repas' ? '🍽️' : '🥂'}
                        </span>
                        <span>{eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 touch-manipulation">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline text-sm">Retour</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">Mes visuels</h1>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="text-orange-600 hover:text-orange-700"
            >
              <CreditCard size={20} />
            </button>
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
          onClose={() => !isDownloading && setShowDownloadModal(false)}
          onDownload={handleDownload}
          isDownloading={isDownloading}
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
        <SubscriptionModal onClose={() => setShowSubscriptionModal(false)} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 lg:pb-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <div className={`${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
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
            />
          </div>

          <div className={`lg:sticky lg:top-24 h-fit ${mobileView === 'edit' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-base">Aperçu</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Mail size={16} />
                    <span className="hidden sm:inline">Envoyer</span>
                  </button>
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    disabled={isDownloading}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Télécharger</span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <div style={{
                  width: '100%',
                  maxWidth: selectedVisual === 'post-rs' ? '400px' : '350px',
                  margin: '0 auto'
                }}>
                  {renderVisual()}
                </div>
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
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              mobileView === 'edit'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            <Edit3 size={18} />
            Éditer
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              mobileView === 'preview'
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
