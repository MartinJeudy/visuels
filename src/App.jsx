import { useState, useRef } from 'react';
import { ArrowLeft, Download, ImagePlus, Palette, Type, FileText, X, Eye, Edit3, Home, UtensilsCrossed, Wine, Mail, CreditCard, Check } from 'lucide-react';
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
  
  const fileInputRef = useRef(null);
  const visualRef = useRef(null);

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
    { id: 'affiche', name: 'Affiche A4', icon: '📄', aspect: 297/210 },
    { id: 'flyer-recto', name: 'Flyer A5 Recto', icon: '📋', aspect: 210/148 },
    { id: 'flyer-verso', name: 'Flyer A5 Verso', icon: '📋', aspect: 210/148 },
    { id: 'communique', name: 'Communiqué', icon: '📰', aspect: 297/210 },
    { id: 'post-rs', name: 'Post RS', icon: '📱', aspect: 1 }
  ];

  const convivialiteOptions = [
    { value: 'none', label: 'Aucun' },
    { value: 'repas', label: 'Repas partagé' },
    { value: 'apero', label: 'Apéro participatif' }
  ];

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
      const filename = `hormur-${selectedVisual}-${eventData.title.replace(/\s+/g, '-')}`;

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        let pdfWidth, pdfHeight;
        if (selectedVisual === 'affiche' || selectedVisual === 'communique') {
          pdfWidth = 210;
          pdfHeight = 297;
        } else if (selectedVisual === 'flyer-recto' || selectedVisual === 'flyer-verso') {
          pdfWidth = 148;
          pdfHeight = 210;
        } else {
          pdfWidth = 210;
          pdfHeight = 210;
        }

        const pdf = new jsPDF({
          orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
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

    const visualStyle = {
      width: '100%',
      aspectRatio: visualType.aspect,
      backgroundColor: selectedVisual === 'communique' ? '#ffffff' : bgColor,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
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
              padding: '24px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: textColor
            }}>
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    margin: '0 0 8px 0'
                  }}>
                    À propos
                  </h2>
                  <div style={{
                    width: '60px',
                    height: '3px',
                    backgroundColor: textColor,
                    margin: '0 auto'
                  }}></div>
                </div>
                
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <p style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {eventData.description}
                  </p>
                </div>

                {eventData.personalMessage && (
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    padding: '16px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${textColor}`,
                    marginBottom: '16px'
                  }}>
                    <p style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      margin: '0 0 8px 0',
                      opacity: 0.9
                    }}>
                      Message de {eventData.organizerNames}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      fontStyle: 'italic',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      "{eventData.personalMessage}"
                    </p>
                  </div>
                )}

                {eventData.chezHabitant && (
                  <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      padding: '8px 16px',
                      borderRadius: '20px'
                    }}>
                      <p style={{
                        fontSize: '10px',
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

              <div>
                <div style={{
                  borderTop: `2px solid ${textColor}40`,
                  paddingTop: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    margin: '0 0 8px 0'
                  }}>
                    Qu'est-ce qu'Hormur ?
                  </h4>
                  <p style={{
                    fontSize: '10px',
                    lineHeight: '1.5',
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
                    padding: '6px',
                    borderRadius: '4px'
                  }}>
                    <QRCodeSVG 
                      value={eventData.eventUrl}
                      size={44}
                      level="M"
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      margin: '0 0 2px 0',
                      letterSpacing: '1px',
                      opacity: 0.8
                    }}>
                      HORMUR
                    </p>
                    <p style={{
                      fontSize: '9px',
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
          <div ref={visualRef} style={visualStyle}>
            <div style={{
              padding: '32px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              color: '#1a1a1a'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  margin: '0 0 4px 0',
                  color: '#1a1a1a'
                }}>
                  {eventData.title}
                </h1>
                <p style={{
                  fontSize: '11px',
                  color: '#666',
                  fontWeight: '600',
                  margin: '0 0 8px 0'
                }}>
                  Communiqué de Presse
                </p>
                {eventData.chezHabitant && (
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: '#fff3e0',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    marginTop: '8px'
                  }}>
                    <p style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#e65100',
                      margin: 0
                    }}>
                      🏠 Chez l'habitant
                    </p>
                  </div>
                )}
              </div>
              
              {/* Image carrée - 35% */}
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '40%',
                marginBottom: '20px',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img 
                  src={uploadedImage} 
                  alt="Event"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ff6b35',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    color: 'white'
                  }}>
                    {eventData.department}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, fontSize: '11px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 12px 0', color: '#333' }}>
                  Le <strong>{eventData.date}</strong>, <strong>{eventData.artistName}</strong> se produira à <strong>{eventData.city}</strong> dans le cadre d'un événement artistique intimiste chez l'habitant.
                </p>

                {eventData.personalMessage && (
                  <div style={{
                    backgroundColor: '#fff3e0',
                    padding: '12px',
                    borderRadius: '6px',
                    borderLeft: '4px solid #ff6b35',
                    marginBottom: '12px'
                  }}>
                    <p style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: '#e65100',
                      margin: '0 0 4px 0'
                    }}>
                      {eventData.organizerNames}
                    </p>
                    <p style={{
                      fontSize: '10px',
                      fontStyle: 'italic',
                      color: '#333',
                      margin: 0
                    }}>
                      "{eventData.personalMessage}"
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#1a1a1a',
                    margin: '0 0 4px 0'
                  }}>
                    À propos de l'événement
                  </p>
                  <p style={{ margin: 0, color: '#333' }}>
                    {eventData.description}
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e0e0e0',
                  marginBottom: '12px'
                }}>
                  <div>
                    <p style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#666',
                      margin: '0 0 2px 0'
                    }}>
                      Date & Heure
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: '#1a1a1a',
                      margin: 0
                    }}>
                      {eventData.date} - {eventData.time}
                    </p>
                  </div>
                  <div>
                    <p style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#666',
                      margin: '0 0 2px 0'
                    }}>
                      Lieu
                    </p>
                    <p style={{
                      fontSize: '11px',
                      color: '#1a1a1a',
                      margin: 0
                    }}>
                      {eventData.city}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                paddingTop: '16px',
                borderTop: '2px solid #e0e0e0'
              }}>
                <p style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#1a1a1a',
                  margin: '0 0 6px 0'
                }}>
                  À propos d'Hormur
                </p>
                <p style={{
                  fontSize: '9px',
                  lineHeight: '1.5',
                  color: '#666',
                  margin: '0 0 12px 0'
                }}>
                  Hormur tisse un lien entre artistes, lieux non conventionnels et publics. L'art où on ne l'attend pas !
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '4px',
                    borderRadius: '4px'
                  }}>
                    <QRCodeSVG 
                      value={eventData.eventUrl}
                      size={36}
                      level="M"
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: '#1a1a1a',
                      margin: '0 0 2px 0',
                      letterSpacing: '1px'
                    }}>
                      HORMUR
                    </p>
                    <p style={{
                      fontSize: '9px',
                      color: '#666',
                      margin: 0
                    }}>
                      contact@hormur.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'post-rs':
        return (
          <div ref={visualRef} style={visualStyle}>
            {/* Image carrée - 70% */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '70%',
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
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)'
              }}></div>
            </div>
            
            <div style={{
              position: 'absolute',
              inset: 0,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              color: textColor
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
                    borderRadius: '20px'
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
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  <span style={{
                    fontSize: '24px',
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
                  fontSize: '32px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                  margin: '0 0 12px 0',
                  letterSpacing: '-0.5px'
                }}>
                  {eventData.title}
                </h2>
                <p style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  margin: '0 0 4px 0'
                }}>
                  {eventData.date}
                </p>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  margin: '0 0 12px 0'
                }}>
                  {eventData.city}
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '6px',
                    borderRadius: '4px'
                  }}>
                    <QRCodeSVG 
                      value={eventData.eventUrl}
                      size={48}
                      level="M"
                    />
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    opacity: 0.9
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

  const DownloadModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Télécharger le visuel</h3>
          <button onClick={() => setShowDownloadModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">Choisissez le format :</p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? '⏳ Génération...' : '📄 PDF (Impression)'}
          </button>
          <button
            onClick={() => handleDownload('jpeg')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? '⏳ Génération...' : '🖼️ JPEG (Partage)'}
          </button>
          <button
            onClick={() => handleDownload('png')}
            disabled={isDownloading}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? '⏳ Génération...' : '🎨 PNG (Web)'}
          </button>
        </div>
      </div>
    </div>
  );

  const SendModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Envoyer les visuels</h3>
          <button onClick={() => setShowSendModal(false)} className="text-gray-500 hover:text-gray-700">
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
            onClick={() => setShowSendModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Annuler
          </button>
          <button 
            onClick={() => {
              alert('✅ Envoi réussi !\n\nLes visuels ont été envoyés aux organisateurs par email.');
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
          className="w-full mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Voir l'abonnement Premium →
        </button>
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
            <input
              type="text"
              value={eventData.organizerNames}
              onChange={(e) => setEventData({...eventData, organizerNames: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Sophie & Martin"
            />
            <p className="text-xs text-gray-500 mt-1">Ex: "Sophie & Martin" ou "Sophie"</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="chezHabitant"
              checked={eventData.chezHabitant}
              onChange={(e) => setEventData({...eventData, chezHabitant: e.target.checked})}
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
              <textarea
                value={eventData.personalMessage}
                onChange={(e) => setEventData({...eventData, personalMessage: e.target.value.slice(0, 120)})}
                rows={2}
                maxLength={120}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Hâte de vous accueillir..."
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
                  onClick={() => setEventData({...eventData, convivialite: option.value})}
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
          Image (format carré recommandé)
        </h2>
        <div className="space-y-2">
          <div 
            className={`relative h-40 rounded-lg overflow-hidden border-2 border-dashed transition-colors ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
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
            onChange={handleImageUpload}
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
  );

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

      {showDownloadModal && <DownloadModal />}
      {showSendModal && <SendModal />}
      {showSubscriptionModal && <SubscriptionModal />}

      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 lg:pb-4">
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Panel d'édition */}
          <div className={`${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>
            <EditPanel />
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
