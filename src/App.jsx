import { useState, useRef } from 'react';
import { ArrowLeft, Download, ImagePlus, Palette, Type, FileText, X, Eye, Edit3, Home, UtensilsCrossed, Wine } from 'lucide-react';

const App = () => {
  const [eventData, setEventData] = useState({
    title: "Trio de contrebasses",
    artistName: "La Valse des Hippos",
    date: "16 NOV 2025",
    time: "17h",
    city: "JOUÉ-LÈS-TOURS",
    department: "37",
    hostName: "Sophie",
    description: "Découvrez un concert intimiste de jazz manouche dans un cadre chaleureux et convivial. Une soirée unique où la musique rencontre l'hospitalité.",
    hostMessage: "Hâte de vous accueillir chez moi pour cette soirée musicale unique !",
    convivialite: "repas" // "repas", "apero", "none"
  });

  const [selectedColor, setSelectedColor] = useState('#E86F3F');
  const [selectedVisual, setSelectedVisual] = useState('affiche');
  const [uploadedImage, setUploadedImage] = useState('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800');
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [mobileView, setMobileView] = useState('edit'); // 'edit' or 'preview'
  const fileInputRef = useRef(null);

  const hormurColors = [
    { name: 'Orange Hormur', value: '#E86F3F' },
    { name: 'Corail Vif', value: '#FF6B6B' },
    { name: 'Violet Profond', value: '#9B59B6' },
    { name: 'Bleu Électrique', value: '#3498DB' },
    { name: 'Vert Émeraude', value: '#2ECC71' },
    { name: 'Jaune Soleil', value: '#F39C12' },
    { name: 'Rose Fuchsia', value: '#E91E63' },
    { name: 'Turquoise', value: '#1ABC9C' }
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

  const renderVisual = () => {
    const textColor = '#FFFFFF';

    switch(selectedVisual) {
      case 'affiche':
      case 'flyer-recto':
        return (
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg shadow-2xl" style={{ backgroundColor: selectedColor }}>
            {/* Image en médaillon centré */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-64 h-64 rounded-full overflow-hidden border-8 border-white shadow-xl">
              <img src={uploadedImage} alt="Event" className="w-full h-full object-cover" />
            </div>
            
            {/* Département en cercle */}
            <div className="absolute top-8 right-8 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg">
              <span className="text-4xl font-black" style={{ color: selectedColor }}>
                {eventData.department}
              </span>
            </div>

            {/* Contenu texte */}
            <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
              <h1 className="font-black text-5xl leading-none uppercase tracking-tight text-center" style={{ color: textColor }}>
                {eventData.title}
              </h1>
              
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold uppercase" style={{ color: textColor }}>
                  {eventData.date}
                </p>
                <p className="text-xl font-semibold uppercase" style={{ color: textColor }}>
                  {eventData.city}
                </p>
              </div>

              {/* Chez l'hôte */}
              <div className="text-center pt-4 border-t-2 border-white/30">
                <p className="text-lg font-medium opacity-90" style={{ color: textColor }}>
                  CHEZ
                </p>
                <p className="text-3xl font-black uppercase" style={{ color: textColor }}>
                  {eventData.hostName}
                </p>
              </div>

              {/* Convivialité */}
              {eventData.convivialite !== 'none' && (
                <div className="text-center pt-3">
                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <p className="text-sm font-bold uppercase" style={{ color: textColor }}>
                      {eventData.convivialite === 'repas' ? '🍽️ Repas partagé' : '🥂 Apéro participatif'}
                    </p>
                  </div>
                </div>
              )}

              {/* QR Code placeholder */}
              <div className="flex justify-center pt-4">
                <div className="bg-white p-2 rounded">
                  <div className="w-16 h-16 bg-black"></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'flyer-verso':
        return (
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg shadow-2xl p-8" style={{ backgroundColor: selectedColor }}>
            <div className="h-full flex flex-col justify-between text-white">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="font-black text-3xl uppercase mb-2">À propos</h2>
                  <div className="w-20 h-1 bg-white mx-auto"></div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{eventData.description}</p>
                </div>

                {eventData.hostMessage && (
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                    <p className="text-xs font-bold uppercase mb-2 opacity-75">Message de {eventData.hostName}</p>
                    <p className="text-sm italic leading-relaxed">"{eventData.hostMessage}"</p>
                  </div>
                )}

                {eventData.convivialite !== 'none' && (
                  <div className="text-center py-3">
                    <div className="inline-block bg-white/20 px-4 py-2 rounded-full">
                      <p className="text-sm font-bold uppercase">
                        {eventData.convivialite === 'repas' ? '🍽️ Repas partagé par l\'hôte' : '🥂 Apéro participatif'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border-t border-white/30 pt-4">
                  <h4 className="font-bold text-sm mb-2 uppercase">Qu'est-ce qu'Hormur ?</h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    Hormur connecte des artistes avec des lieux non conventionnels pour créer des expériences culturelles uniques et intimistes. L'art où on ne l'attend pas !
                  </p>
                </div>
                <div className="flex justify-between items-end">
                  <div className="bg-white p-2 rounded">
                    <div className="w-12 h-12 bg-black"></div>
                  </div>
                  <p className="text-xs opacity-75 font-medium">hormur.com</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'communique':
        return (
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg shadow-2xl bg-white p-8">
            <div className="h-full flex flex-col text-gray-800">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-black uppercase mb-2 text-gray-900">{eventData.title}</h1>
                <p className="text-sm text-gray-600 font-medium">Communiqué de Presse</p>
              </div>
              
              <div className="relative mb-6 rounded-lg overflow-hidden">
                <img src={uploadedImage} alt="Event" className="w-full h-48 object-cover" />
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{eventData.department}</span>
                </div>
              </div>

              <div className="space-y-4 text-sm flex-1">
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    Le {eventData.date}, <strong>{eventData.artistName}</strong> se produira à <strong>{eventData.city}</strong> dans le cadre d'un événement artistique intimiste chez l'habitant.
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                  <p className="text-xs font-bold uppercase mb-1 text-orange-700">Chez {eventData.hostName}</p>
                  <p className="text-xs italic text-gray-700">"{eventData.hostMessage}"</p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2">À propos de l'événement</p>
                  <p className="text-gray-700 leading-relaxed text-xs">{eventData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="font-semibold text-xs text-gray-600 mb-1">Date & Heure</p>
                    <p className="text-gray-900 text-sm">{eventData.date} - {eventData.time}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-gray-600 mb-1">Lieu</p>
                    <p className="text-gray-900 text-sm">{eventData.city}</p>
                  </div>
                </div>

                {eventData.convivialite !== 'none' && (
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-xs font-semibold text-gray-700">
                      {eventData.convivialite === 'repas' ? '🍽️ Repas partagé par l\'hôte' : '🥂 Apéro participatif'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t mt-auto">
                <p className="font-semibold text-xs mb-2 text-gray-900">À propos d'Hormur</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Hormur tisse un lien entre artistes, lieux non conventionnels et publics. Partout en France, des milliers d'artistes, lieux et spectateurs font parties des rencontres artistiques et intimistes. L'art où on ne l'attend pas !
                </p>
                <div className="flex justify-between items-center mt-3">
                  <div className="bg-gray-900 p-2 rounded">
                    <div className="w-10 h-10 bg-gray-300"></div>
                  </div>
                  <p className="text-xs text-gray-600">Contact: contact@hormur.com</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'post-rs':
        return (
          <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-2xl" style={{ backgroundColor: selectedColor }}>
            <div className="absolute inset-0">
              <img src={uploadedImage} alt="Event" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
            </div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-between text-white">
              <div className="flex justify-between items-start">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <p className="text-xs font-bold">CHEZ {eventData.hostName.toUpperCase()}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                  <span className="text-2xl font-black" style={{ color: selectedColor }}>
                    {eventData.department}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="font-black text-4xl mb-3 leading-none uppercase">{eventData.title}</h2>
                <div className="space-y-2">
                  <p className="text-lg font-bold uppercase">{eventData.date}</p>
                  <p className="text-base font-semibold uppercase">{eventData.city}</p>
                </div>
                {eventData.convivialite !== 'none' && (
                  <div className="mt-3 inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <p className="text-xs font-bold">
                      {eventData.convivialite === 'repas' ? '🍽️ Repas partagé' : '🥂 Apéro participatif'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Buttons */}
      <div className="lg:hidden sticky top-[57px] z-10 bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setMobileView('edit')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              mobileView === 'edit' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            <Edit3 size={18} />
            Éditer
          </button>
          <button
            onClick={() => setMobileView('preview')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              mobileView === 'preview' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-50 text-gray-600'
            }`}
          >
            <Eye size={18} />
            Aperçu
          </button>
        </div>
      </div>

      {/* Image Crop Modal */}
      {showImageCrop && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Recadrer l'image</h3>
              <button onClick={() => setShowImageCrop(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <img src={tempImage} alt="Crop preview" className="w-full h-96 object-cover rounded-lg mb-4" />
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
                <button className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  <Download size={16} />
                  <span className="hidden sm:inline">Télécharger</span>
                </button>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                {renderVisual()}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Modifications en temps réel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
