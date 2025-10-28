import { useState, useRef, memo, useCallback } from 'react';
import { ArrowLeft, Download, ImagePlus, Palette, Type, FileText, X, Eye, Edit3, Home, Mail, CreditCard, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const hormurColors = [
  { name: 'Orange Hormur', value: '#fb593d', text: '#ffffff' },
  { name: 'Rouge Vif', value: '#fc4735', text: '#ffffff' },
  { name: 'Rose Bonbon', value: '#fca0ba', text: '#1a1a1a' },
  { name: 'Rose Saumon', value: '#fd94ac', text: '#1a1a1a' },
  { name: 'Jaune Citron', value: '#f7ce64', text: '#1a1a1a' },
  { name: 'Vert Pomme', value: '#d7f879', text: '#1a1a1a' },
  { name: 'Vert Émeraude', value: '#00b179', text: '#ffffff' },
  { name: 'Bleu Océan', value: '#1380c7', text: '#ffffff' }
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

// Composants mémorisés pour éviter la perte de focus
const TitleInput = memo(({ value, onChange }) => (
  <input
    type="text"
    maxLength={40}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

const DownloadModal = ({ onClose, onDownload, isDownloading }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Télécharger le visuel</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">Choisissez le format :</p>

      <div className="space-y-3">
        <button
          onClick={() => onDownload('pdf')}
          disabled={isDownloading}
          className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDownloading ? '⏳ Génération...' : '📄 PDF (Impression)'}
        </button>
        <button
          onClick={() => onDownload('jpeg')}
          disabled={isDownloading}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDownloading ? '⏳ Génération...' : '🖼️ JPEG (Partage)'}
        </button>
        <button
          onClick={() => onDownload('png')}
          disabled={isDownloading}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDownloading ? '⏳ Génération...' : '🎨 PNG (Web)'}
        </button>
      </div>
    </div>
  </div>
);

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
        {/* Gratuit */}
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

        {/* Premium */}
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
  setSelectedColor
}) => (
  <div className="space-y-4">
    {/* Type de visuel */}
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

    {/* Contenu */}
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

    {/* Organisateurs */}
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

        <div className="flex items together gap-2">
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

    {/* Image */}
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="font-bold text-base mb-3 flex items-center gap-2">
        <ImagePlus size={18} className="text-orange-500" />
        Image (format carré recommandé)
      </h2>
      <div className="space-y-2">
        <div
          className={`relative h-40 rounded-lg overflow-hidden border-2 border-dashed transition-colors ${
            dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
        >
          <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
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
        <p className="text-xs text-gray-500 text-center">💡 Utilisez une image carrée pour un meilleur rendu</p>
      </div>
    </div>

    {/* Couleur */}
    {selectedVisual !== 'communique' && (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
          <Palette size={18} className="text-orange-500" />
          Couleur
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {hormurColors.map(color => (
            <button
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              className={`aspect-square rounded-lg transition-all ${
                selectedColor === color.value
                  ? 'ring-4 ring-gray-900 ring-offset-2 scale-105'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    )}
  </div>
));

const App = () => {
  const [eventData, setEventData] = useState({
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
  });

  const [selectedColor, setSelectedColor] = useState('#fb593d');
  const [selectedVisual, setSelectedVisual] = useState('affiche');
  const [uploadedImage, setUploadedImage] = useState('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop');
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [mobileView, setMobileView] = useState('edit');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleSendConfirm = useCallback(() => {
    alert('✅ Envoi réussi !\n\nLes visuels ont été envoyés aux organisateurs par email.');
    setShowSendModal(false);
  }, [setShowSendModal]);

  const handleShowSubscriptionFromSend = useCallback(() => {
    setShowSendModal(false);
    setShowSubscriptionModal(true);
  }, [setShowSendModal, setShowSubscriptionModal]);

  const fileInputRef = useRef(null);
  const visualRef = useRef(null);

  // Handlers stabilisés avec useCallback
  const handleTitleChange = useCallback((e) => {
    setEventData(prev => ({...prev, title: e.target.value}));
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
  }, [setEventData]);

  const getCurrentColor = () => {
    return hormurColors.find(c => c.value === selectedColor) || hormurColors[0];
  };

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
    setUploadedImage(tempImage);
    setShowImageCrop(false);
    setTempImage(null);
  };

  const handleDownload = async (format) => {
    setIsDownloading(true);

    try {
      const element = visualRef.current;
      if (!element) return;

      const scale = 4;
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight
      });

      const visualType = getCurrentVisualType();
      const sanitize = (value) =>
        value
          .toString()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-zA-Z0-9-_]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase();

      const filename = `hormur-${selectedVisual}-${sanitize(eventData.title || selectedVisual)}`;

      const pdfSize = visualType?.pdf || { width: 210, height: 297 };
      const pdfWidth = pdfSize.width || 210;
      const pdfHeight = pdfSize.height || 297;

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        const pdf = new jsPDF({
          orientation: pdfHeight >= pdfWidth ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [pdfWidth, pdfHeight]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(`${filename}.pdf`);
      } else {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const quality = format === 'jpeg' ? 0.95 : 1.0;

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, mimeType, quality);
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
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
    const aspectRatio = visualType?.canvas?.width && visualType?.canvas?.height
      ? visualType.canvas.width / visualType.canvas.height
      : 1;
    const aspectRatioValue = Number.isFinite(aspectRatio) && aspectRatio > 0
      ? Number(aspectRatio.toFixed(4))
      : 1;

    const visualStyle = {
      width: '100%',
      aspectRatio: aspectRatioValue,
      backgroundColor: selectedVisual === 'communique' ? '#ffffff' : bgColor,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Bebas Neue', 'Arial Narrow', 'Impact', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    };

    switch(selectedVisual) {
      case 'affiche':
      case 'flyer-recto':
        return (
          <div ref={visualRef} style={visualStyle}>
            {/* Image carrée - 60% hauteur */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '60%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={uploadedImage}
                alt="Event"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))'
              }}></div>
            </div>

            {/* Badges top */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              {eventData.chezHabitant && (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: selectedVisual === 'affiche' ? '11px' : '9px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  color: bgColor,
                  letterSpacing: '0.5px'
                }}>
                  🏠 Chez l'habitant
                </div>
              )}
              <div style={{
                width: selectedVisual === 'affiche' ? '56px' : '48px',
                height: selectedVisual === 'affiche' ? '56px' : '48px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <span style={{
                  fontSize: selectedVisual === 'affiche' ? '22px' : '18px',
                  fontWeight: '900',
                  color: bgColor
                }}>
                  {eventData.department}
                </span>
              </div>
            </div>

            {/* Contenu bas - 40% */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              padding: selectedVisual === 'affiche' ? '24px' : '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h1 style={{
                  fontSize: selectedVisual === 'affiche' ? '36px' : '28px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  lineHeight: '1',
                  letterSpacing: '-0.5px',
                  marginBottom: '12px'
                }}>
                  {eventData.title}
                </h1>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <p style={{
                    fontSize: selectedVisual === 'affiche' ? '16px' : '14px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0
                  }}>
                    {eventData.date}
                  </p>
                  <p style={{
                    fontSize: selectedVisual === 'affiche' ? '16px' : '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0
                  }}>
                    {eventData.city}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: '12px',
                borderTop: `2px solid ${textColor}40`
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: selectedVisual === 'affiche' ? '13px' : '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0,
                    opacity: 0.9
                  }}>
                    {eventData.organizerNames}
                  </p>
                  {eventData.convivialite !== 'none' && (
                    <p style={{
                      fontSize: selectedVisual === 'affiche' ? '11px' : '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: textColor,
                      margin: '4px 0 0 0',
                      opacity: 0.8
                    }}>
                      {eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '6px',
                    borderRadius: '4px'
                  }}>
                    <QRCodeSVG
                      value={eventData.eventUrl}
                      size={selectedVisual === 'affiche' ? 56 : 48}
                      level="M"
                    />
                  </div>
                  <div style={{
                    fontSize: selectedVisual === 'affiche' ? '16px' : '14px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    color: textColor,
                    letterSpacing: '1px',
                    opacity: 0.8
                  }}>
                    HORMUR
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'flyer-verso':
        return (
          <div ref={visualRef} style={visualStyle}>
            <div style={{
              padding: '20px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: textColor
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
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      padding: '6px 14px',
                      borderRadius: '20px'
                    }}>
                      <p style={{
                        fontSize: '9px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        color: bgColor,
                        margin: 0,
                        letterSpacing: '0.5px'
                      }}>
                        🏠 Chez l'habitant
                      </p>
                    </div>
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
                    borderRadius: '4px'
                  }}>
                    <QRCodeSVG
                      value={eventData.eventUrl}
                      size={40}
                      level="M"
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      margin: '0 0 2px 0',
                      letterSpacing: '1px',
                      opacity: 0.8
                    }}>
                      HORMUR
                    </p>
                    <p style={{
                      fontSize: '8px',
                      margin: 0,
                      opacity: 0.7
                    }}>
                      hormur.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'communique':
        return (
          <div ref={visualRef} style={{
            ...visualStyle,
            position: 'relative',
            backgroundColor: '#ffffff'
          }}>
            {/* Template de base - zIndex:1 */}
            <img
              src="/communique-template.png"
              alt="Template communiqué"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                zIndex: 1
              }}
            />

            {/* Calque de contenu - zIndex:2 */}
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2
            }}>
              {/* Image principale - 59.5%, 13%, 8%, 20% */}
              <div style={{
                position: 'absolute',
                left: '59.5%',
                top: '13%',
                width: '8%',
                height: '20%',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={uploadedImage}
                  alt="Event"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Bandeau date - 9.5%, 45%, 36%, 4% */}
              <div style={{
                position: 'absolute',
                left: '9.5%',
                top: '45%',
                width: '36%',
                height: '4%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'white',
                  margin: 0,
                  letterSpacing: '0.5px'
                }}>
                  Le {eventData.date}
                </p>
              </div>

              {/* Titre - 9.5%, 51%, 36% */}
              <div style={{
                position: 'absolute',
                left: '9.5%',
                top: '51%',
                width: '36%'
              }}>
                <h2 style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#1a1a1a',
                  margin: 0,
                  lineHeight: '1.1',
                  textAlign: 'center'
                }}>
                  {eventData.title}
                </h2>
              </div>

              {/* Sous-titre - 9.5%, 53%, 36% */}
              <div style={{
                position: 'absolute',
                left: '9.5%',
                top: '53%',
                width: '36%'
              }}>
                <p style={{
                  fontFamily: "Georgia, serif",
                  fontSize: '9px',
                  fontStyle: 'italic',
                  color: '#666',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  Appartement de {eventData.organizerNames}
                </p>
              </div>

              {/* QR code - 31%, 58%, 12%, 10% */}
              <div style={{
                position: 'absolute',
                left: '31%',
                top: '58%',
                width: '12%',
                height: '10%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <QRCodeSVG
                  value={eventData.eventUrl}
                  size={65}
                  level="M"
                />
              </div>

              {/* Lieu + heure - 12%, 59%, 18% */}
              <div style={{
                position: 'absolute',
                left: '12%',
                top: '59%',
                width: '18%'
              }}>
                <p style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: '9px',
                  color: '#1a1a1a',
                  margin: '0 0 2px 0',
                  fontWeight: '700',
                  lineHeight: '1.2'
                }}>
                  {eventData.city} ({eventData.department})
                </p>
                <p style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: '8px',
                  fontStyle: 'italic',
                  color: '#666',
                  margin: 0,
                  lineHeight: '1.2'
                }}>
                  {eventData.time ? `le ${eventData.date} à ${eventData.time}` : `le ${eventData.date}`}
                </p>
              </div>

              {/* Texte institutionnel Hormur - 56%, 42%, 38% */}
              <div style={{
                position: 'absolute',
                left: '56%',
                top: '42%',
                width: '38%'
              }}>
                <p style={{
                  fontFamily: "Georgia, serif",
                  fontSize: '8.5px',
                  lineHeight: '1.4',
                  color: '#1a1a1a',
                  margin: 0,
                  textAlign: 'justify'
                }}>
                  Hormur connecte artistes et hôtes dans la co-création d'évènements artistiques intimistes dans des lieux non conventionnels, accessibles au public via une billetterie en ligne. Lauréate de l'AMI "Solutions de billetterie innovantes" du Ministère de la Culture, la plateforme rassemble depuis 2021 des milliers d'artistes et de lieux pour faire vivre l'art autrement partout en France.
                </p>
              </div>

              {/* Description événement - 56%, 60%, 38% */}
              <div style={{
                position: 'absolute',
                left: '56%',
                top: '60%',
                width: '38%'
              }}>
                <p style={{
                  fontFamily: "Georgia, serif",
                  fontSize: '8.5px',
                  lineHeight: '1.4',
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
          <div ref={visualRef} style={visualStyle}>
            {/* Image carrée - 65% de l'espace */}
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              paddingBottom: '80%',
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              <img
                src={uploadedImage}
                alt="Event"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>

            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: textColor,
              zIndex: 10
            }}>
              {/* Top badges */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}>
                {eventData.chezHabitant && (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: bgColor,
                      margin: 0,
                      letterSpacing: '0.5px'
                    }}>
                      🏠 {eventData.organizerNames}
                    </p>
                  </div>
                )}
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: '900',
                    color: bgColor
                  }}>
                    {eventData.department}
                  </span>
                </div>
              </div>

              {/* Bottom content */}
              <div>
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  lineHeight: '0.95',
                  margin: '0 0 12px 0',
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
                  <div style={{
                    backgroundColor: 'white',
                    padding: '6px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <QRCodeSVG
                      value={eventData.eventUrl}
                      size={48}
                      level="M"
                    />
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    opacity: 0.95,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    HORMUR
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
      {/* Header */}
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

      {/* Modals */}
      {showImageCrop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Valider l'image</h3>
              <button onClick={() => setShowImageCrop(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ paddingBottom: '100%' }}>
              <img src={tempImage} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
            </div>
            <p className="text-xs text-gray-600 mb-4">💡 Pour un meilleur rendu, utilisez une image carrée</p>
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
          {/* Panel d'édition */}
          <div className={`${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
            <EditPanel
              visualTypes={visualTypes}
              selectedVisual={selectedVisual}
              setSelectedVisual={setSelectedVisual}
              eventData={eventData}
              onTitleChange={handleTitleChange}
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
            />
          </div>

          {/* Aperçu */}
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
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Télécharger</span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg" style={{ maxHeight: 'none' }}>
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

      {/* Mobile Toggle - EN BAS */}
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
