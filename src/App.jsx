import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, ImagePlus, Palette, Type, FileText, X, Eye, Edit3, Home, UtensilsCrossed, Wine, Mail, MessageSquare, CreditCard, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App = () => {
  const [eventData, setEventData] = useState({
    title: "Trio de contrebasses",
    artistName: "La Valse des Hippos",
    date: "16 NOV 2025",
    time: "17h",
    city: "JOUÉ-LÈS-TOURS",
    department: "37",
    hostName: "Sophie",
    eventUrl: "https://hormur.com/event/01994344-f113-7096-a7-6f6e28d480",
    description: "Découvrez un concert intimiste dans un cadre chaleureux et convivial. Une soirée unique où la musique rencontre l'hospitalité.",
    hostMessage: "Hâte de vous accueillir chez moi pour cette soirée musicale unique !",
    convivialite: "repas"
  });

  const [selectedColor, setSelectedColor] = useState('#fb593d');
  const [selectedVisual, setSelectedVisual] = useState('affiche');
  const [uploadedImage, setUploadedImage] = useState('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800');
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [mobileView, setMobileView] = useState('edit');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageCrop, setImageCrop] = useState({ x: 0, y: 0, scale: 1 });
  
  const fileInputRef = useRef(null);
  const visualRef = useRef(null);

  const hormurColors = [
    { name: 'Orange Hormur', value: '#fb593d', text: '#ffffff' },
    { name: 'Rouge Vif', value: '#fc4735', text: '#ffffff' },
    { name: 'Rose Bonbon', value: '#fca0ba', text: '#2C3E50' },
    { name: 'Rose Saumon', value: '#fd94ac', text: '#2C3E50' },
    { name: 'Jaune Citron', value: '#f7ce64', text: '#2C3E50' },
    { name: 'Vert Pomme', value: '#d7f879', text: '#2C3E50' },
    { name: 'Vert Émeraude', value: '#00b179', text: '#ffffff' },
    { name: 'Bleu Océan', value: '#1380c7', text: '#ffffff' }
  ];

  const visualTypes = [
    { id: 'affiche', name: 'Affiche', icon: '📄' },
    { id: 'flyer-recto', name: 'Flyer Recto', icon: '📋' },
    { id: 'flyer-verso', name: 'Flyer Verso', icon: '📋' },
    { id: 'communique', name: 'Communiqué', icon: '📰' },
    { id: 'post-rs', name: 'Post RS', icon: '📱' }
  ];

  const convivialiteOptions = [
    { value: 'none', label: 'Aucun', icon: null },
    { value: 'repas', label: 'Repas partagé', icon: <UtensilsCrossed size={16} /> },
    { value: 'apero', label: 'Apéro participatif', icon: <Wine size={16} /> }
  ];

  const getCurrentColor = () => {
    return hormurColors.find(c => c.value === selectedColor) || hormurColors[0];
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempImage(e.target.result);
        setShowImageCrop(true);
      };
      reader.readAsDataURL(file);
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

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: null
      });

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: selectedVisual === 'post-rs' ? 'portrait' : 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`hormur-${selectedVisual}-${eventData.title}.pdf`);
      } else if (format === 'jpeg') {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hormur-${selectedVisual}-${eventData.title}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.95);
      } else if (format === 'png') {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hormur-${selectedVisual}-${eventData.title}.png`;
          a.click();
          URL.revokeObjectURL(url);
        });
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

    switch(selectedVisual) {
      case 'affiche':
      case 'flyer-recto':
        return (
          <div ref={visualRef} className="relative w-full aspect-[3/4] overflow-hidden" style={{ backgroundColor: bgColor }}>
            {/* Image principale - 75% de l'espace */}
            <div className="absolute inset-0 h-[75%]">
              <img 
                src={uploadedImage} 
                alt="Event" 
                className="w-full h-full object-cover"
                style={{
                  transform: `scale(${imageCrop.scale}) translate(${imageCrop.x}px, ${imageCrop.y}px)`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
            </div>
            
            {/* Badge "Chez l'habitant" */}
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: bgColor }}>
                🏠 Chez l'habitant
              </p>
            </div>

            {/* Département */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl">
              <span className="text-4xl font-black" style={{ color: bgColor }}>
                {eventData.department}
              </span>
            </div>

            {/* Contenu bas - 25% */}
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3" style={{ height: '25%' }}>
              <h1 className="font-black text-4xl leading-none uppercase tracking-tight" style={{ color: textColor }}>
                {eventData.title}
              </h1>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-bold uppercase" style={{ color: textColor }}>
                    {eventData.date}
                  </p>
                  <p className="text-base font-semibold uppercase" style={{ color: textColor }}>
                    {eventData.city}
                  </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-2 rounded shadow-lg">
                  <QRCodeSVG 
                    value={eventData.eventUrl}
                    size={64}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Chez + Convivialité */}
              <div className="flex items-center justify-between pt-2 border-t-2 border-white/30">
                <p className="text-sm font-black uppercase" style={{ color: textColor }}>
                  CHEZ {eventData.hostName.toUpperCase()}
                </p>
                {eventData.convivialite !== 'none' && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-xs font-bold uppercase" style={{ color: textColor }}>
                      {eventData.convivialite === 'repas' ? '🍽️ Repas' : '🥂 Apéro'}
                    </p>
                  </div>
                )}
              </div>

              {/* Logo Hormur */}
              <div className="absolute bottom-2 right-2">
                <div className="text-xs font-black uppercase tracking-widest" style={{ color: textColor, opacity: 0.8 }}>
                  HORMUR
                </div>
              </div>
            </div>
          </div>
        );

      case 'flyer-verso':
        return (
          <div ref={visualRef} className="relative w-full aspect-[3/4] overflow-hidden p-6" style={{ backgroundColor: bgColor }}>
            <div className="h-full flex flex-col justify-between" style={{ color: textColor }}>
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="font-black text-2xl uppercase mb-2">À propos</h2>
                  <div className="w-16 h-1 bg-white mx-auto"></div>
                </div>
                
                <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{eventData.description}</p>
                </div>

                {eventData.hostMessage && (
                  <div className="bg-white/15 backdrop-blur-sm p-4 rounded-lg border-l-4 border-white">
                    <p className="text-xs font-bold uppercase mb-2 opacity-90">Message de {eventData.hostName}</p>
                    <p className="text-sm italic leading-relaxed">"{eventData.hostMessage}"</p>
                  </div>
                )}

                <div className="text-center py-2">
                  <div className="inline-block bg-white/95 px-4 py-2 rounded-full">
                    <p className="text-xs font-black uppercase tracking-wide" style={{ color: bgColor }}>
                      🏠 Chez l'habitant
                    </p>
                  </div>
                </div>

                {eventData.convivialite !== 'none' && (
                  <div className="text-center">
                    <div className="inline-block bg-white/20 px-4 py-2 rounded-full">
                      <p className="text-sm font-bold uppercase">
                        {eventData.convivialite === 'repas' ? '🍽️ Repas partagé' : '🥂 Apéro participatif'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-auto">
                <div className="border-t border-white/30 pt-4">
                  <h4 className="font-bold text-sm mb-2 uppercase">Qu'est-ce qu'Hormur ?</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    Hormur connecte des artistes avec des lieux non conventionnels pour créer des expériences culturelles uniques et intimistes. L'art où on ne l'attend pas !
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <div className="bg-white p-2 rounded">
                    <QRCodeSVG 
                      value={eventData.eventUrl}
                      size={48}
                      level="M"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest opacity-75">HORMUR</p>
                    <p className="text-xs opacity-75">hormur.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'communique':
        return (
          <div ref={visualRef} className="relative w-full aspect-[3/4] overflow-hidden bg-white p-6">
            <div className="h-full flex flex-col text-gray-800">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-black uppercase mb-1 text-gray-900">{eventData.title}</h1>
                <p className="text-xs text-gray-600 font-medium">Communiqué de Presse</p>
                <div className="inline-block mt-2 bg-orange-100 px-3 py-1 rounded-full">
                  <p className="text-xs font-bold text-orange-700">🏠 Chez l'habitant</p>
                </div>
              </div>
              
              {/* Image 70% */}
              <div className="relative mb-4 rounded-lg overflow-hidden" style={{ height: '35%' }}>
                <img src={uploadedImage} alt="Event" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                  <span className="text-xl font-black text-white">{eventData.department}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs flex-1">
                <p className="text-gray-700 leading-relaxed">
                  Le <strong>{eventData.date}</strong>, <strong>{eventData.artistName}</strong> se produira à <strong>{eventData.city}</strong> dans le cadre d'un événement artistique intimiste chez l'habitant.
                </p>

                <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">
                  <p className="text-xs font-bold uppercase mb-1 text-orange-700">Chez {eventData.hostName}</p>
                  <p className="text-xs italic text-gray-700">"{eventData.hostMessage}"</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-1">À propos de l'événement</p>
                  <p className="text-gray-700 leading-relaxed">{eventData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="font-semibold text-xs text-gray-600 mb-1">Date & Heure</p>
                    <p className="text-gray-900 text-xs">{eventData.date} - {eventData.time}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-gray-600 mb-1">Lieu</p>
                    <p className="text-gray-900 text-xs">{eventData.city}</p>
                  </div>
                </div>

                {eventData.convivialite !== 'none' && (
                  <div className="bg-gray-50 p-2 rounded text-center">
                    <p className="text-xs font-semibold text-gray-700">
                      {eventData.convivialite === 'repas' ? '🍽️ Repas partagé' : '🥂 Apéro participatif'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t mt-auto">
                <p className="font-semibold text-xs mb-1 text-gray-900">À propos d'Hormur</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  Hormur tisse un lien entre artistes, lieux non conventionnels et publics. L'art où on ne l'attend pas !
                </p>
                <div className="flex justify-between items-center">
                  <div className="bg-gray-900 p-1.5 rounded">
                    <QRCodeSVG 
                      value={eventData.eventUrl}
                      size={40}
                      level="M"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-900">HORMUR</p>
                    <p className="text-xs text-gray-600">contact@hormur.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'post-rs':
        return (
          <div ref={visualRef} className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: bgColor }}>
            {/* Image 80% */}
            <div className="absolute inset-0 h-[80%]">
              <img src={uploadedImage} alt="Event" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70"></div>
            </div>
            
            <div className="absolute inset-0 p-6 flex flex-col justify-between" style={{ color: textColor }}>
              <div className="flex justify-between items-start">
                <div className="bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full">
                  <p className="text-xs font-black uppercase" style={{ color: bgColor }}>
                    🏠 Chez {eventData.hostName}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-black" style={{ color: bgColor }}>
                    {eventData.department}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-black text-3xl leading-none uppercase">{eventData.title}</h2>
                <p className="text-base font-bold uppercase">{eventData.date}</p>
                <p className="text-sm font-semibold uppercase">{eventData.city}</p>
                {eventData.convivialite !== 'none' && (
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-xs font-bold">
                      {eventData.convivialite === 'repas' ? '🍽️ Repas' : '🥂 Apéro'}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="bg-white p-1.5 rounded">
                    <QRCodeSVG 
                      value={eventData.eventUrl}
                      size={48}
                      level="M"
                    />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest opacity-90">HORMUR</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const DownloadModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Télécharger le visuel</h3>
          <button onClick={() => setShowDownloadModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">Choisissez le format de téléchargement :</p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? 'Téléchargement...' : '📄 PDF (Haute qualité)'}
          </button>
          <button
            onClick={() => handleDownload('jpeg')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? 'Téléchargement...' : '🖼️ JPEG (Léger)'}
          </button>
          <button
            onClick={() => handleDownload('png')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? 'Téléchargement...' : '🎨 PNG (Transparent)'}
          </button>
        </div>
      </div>
    </div>
  );

  const SendModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Envoyer le visuel</h3>
          <button onClick={() => setShowSendModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email destinataire</label>
            <input
              type="email"
              placeholder="artiste@exemple.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone (SMS)</label>
            <input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>🎁 Premier envoi gratuit !</strong><br/>
              Les envois suivants nécessitent un abonnement.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setShowSendModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button 
              onClick={() => {
                alert('Envoi réussi ! Email et SMS envoyés.');
                setShowSendModal(false);
              }}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
            >
              Envoyer
            </button>
          </div>

          <button
            onClick={() => {
              setShowSendModal(false);
              setShowSubscriptionModal(true);
            }}
            className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Voir les formules d'abonnement →
          </button>
        </div>
      </div>
    </div>
  );

  const SubscriptionModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-2xl">Formules d'abonnement</h3>
          <button onClick={() => setShowSubscriptionModal(false)} className="text-gray-500 hover:text-gray-700">
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
                <span>5 visuels différents</span>
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
                <span>Téléchargements illimités</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <span>Tous les formats HD</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <span>10+ templates exclusifs</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <span><strong>Suggestions IA</strong> (titres et descriptions)</span>
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
            💡 <strong>Astuce :</strong> L'abonnement Premium est idéal si vous organisez plus de 2 événements par mois.
          </p>
        </div>
      </div>
    </div>
  );

  const EditPanel = () => (
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
            <input
              type="text"
              maxLength={40}
              value={eventData.title}
              onChange={(e) => setEventData({...eventData, title: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <div className="text-xs text-gray-500 mt-1">{eventData.title.length}/40</div>
          </div>

          {(selectedVisual === 'flyer-verso' || selectedVisual === 'communique') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={eventData.description}
                onChange={(e) => setEventData({...eventData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Hôte */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
          <Home size={18} className="text-orange-500" />
          Informations hôte
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prénom de l'hôte
            </label>
            <input
              type="text"
              value={eventData.hostName}
              onChange={(e) => setEventData({...eventData, hostName: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Sophie"
            />
          </div>

          {(selectedVisual === 'flyer-verso' || selectedVisual === 'communique') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message personnel (optionnel)
              </label>
              <textarea
                value={eventData.hostMessage}
                onChange={(e) => setEventData({...eventData, hostMessage: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Hâte de vous accueillir..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Convivialité (optionnel)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {convivialiteOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setEventData({...eventData, convivialite: option.value})}
                  className={`p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                    eventData.convivialite === option.value
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de l'événement
            </label>
            <input
              type="url"
              value={eventData.eventUrl}
              onChange={(e) => setEventData({...eventData, eventUrl: e.target.value})}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="https://hormur.com/event/..."
            />
            <p className="text-xs text-gray-500 mt-1">Pour le QR code</p>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="font-bold text-base mb-3 flex items-center gap-2">
          <ImagePlus size={18} className="text-orange-500" />
          Image
        </h2>
        <div className="space-y-2">
          <div className="relative h-40 rounded-lg overflow-hidden">
            <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-gray-700 font-medium"
          >
            Changer l'image
          </button>
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
                    ? 'ring-4 ring-gray-900 ring-offset-2'
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h3 className="font-bold text-lg">Recadrer l'image</h3>
              <button onClick={() => setShowImageCrop(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img src={tempImage} alt="Crop preview" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs text-gray-600 mb-4">💡 Astuce : L'image sera automatiquement optimisée pour le visuel</p>
            <div className="flex gap-3">
              <button onClick={() => setShowImageCrop(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={confirmImageCrop} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && <DownloadModal />}
      {showSendModal && <SendModal />}
      {showSubscriptionModal && <SubscriptionModal />}

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Panel d'édition */}
          <div className={`${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
            <EditPanel />
          </div>

          {/* Aperçu */}
          <div className={`lg:sticky lg:top-24 h-fit ${mobileView === 'edit' ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold text-base">Aperçu en direct</h2>
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
              <div className="bg-gray-100 p-3 rounded-lg">
                {renderVisual()}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                ✨ Modifications en temps réel
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Toggle - EN BAS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t shadow-lg">
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

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-16"></div>
    </div>
  );
};

export default App;
