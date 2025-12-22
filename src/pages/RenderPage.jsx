import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { loadVisualConfig } from '../utils/configUtils';

// === CONSTANTS & CONFIG (Mirrored from App.jsx) ===

// IMPORTANT: Les noms de fichiers utilisent "carre" (sans accent) comme dans /public
const hormurColors = [
    { name: 'Bleu Océan', value: '#1380c7', text: '#feb7db', afficheTemplate: 'Affiche Bleue.png', flyerTemplate: 'Flyer Bleu.png', rsTemplate: 'Cadre RS carre bleu.png', rs45Template: 'Cadre bleu RS.png', storieTemplate: 'Storie Bleue.png', isBlackAndWhite: false },
    { name: 'Vert Émeraude', value: '#00b179', text: '#d7f879', afficheTemplate: 'Affiche Verte.png', flyerTemplate: 'Flyer Vert.png', rsTemplate: 'Cadre RS carre vert.png', rs45Template: 'Cadre vert RS.png', storieTemplate: 'Storie Verte.png' },
    { name: 'Vert Pomme', value: '#d7f879', text: '#00b17e', afficheTemplate: 'Affiche Citron.png', flyerTemplate: 'Flyer Citron.png', rsTemplate: 'Cadre RS carre citron.png', rs45Template: 'Cadre citron RS.png', storieTemplate: 'Storie Citron.png' },
    { name: 'Jaune Citron', value: '#f7ce64', text: '#f75b40', afficheTemplate: 'Affiche Jaune.png', flyerTemplate: 'Flyer Jaune.png', rsTemplate: 'Cadre RS carre jaune.png', rs45Template: 'Cadre jaune RS.png', storieTemplate: 'Storie Jaune.png' },
    { name: 'Orange Hormur', value: '#fb593d', text: '#f7ce64', afficheTemplate: 'Affiche Orange.png', flyerTemplate: 'Flyer Orange.png', rsTemplate: 'Cadre RS carre orange.png', rs45Template: 'Cadre orange RS.png', storieTemplate: 'Storie Orange.png' },
    { name: 'Rose Saumon', value: '#fd94ac', text: '#157fcd', afficheTemplate: 'Affiche Rose bleue.png', flyerTemplate: 'Flyer Rose bleu.png', rsTemplate: 'Cadre RS carre rose bleu.png', rs45Template: 'Cadre rose bleu RS.png', storieTemplate: 'Storie Rose bleue.png' },
    { name: 'Rose Bonbon', value: '#feb2dc', text: '#fc4735', afficheTemplate: 'Affiche Rose Rouge.png', flyerTemplate: 'Flyer Rose Rouge.png', rsTemplate: 'Cadre RS carre rose rouge.png', rs45Template: 'Cadre rose rouge RS.png', storieTemplate: 'Storie Rose Rouge.png' },
    { name: 'Rouge Vif', value: '#fc4735', text: '#feb7db', afficheTemplate: 'Affiche Rouge Rose.png', flyerTemplate: 'Flyer Rouge Rose.png', rsTemplate: 'Cadre RS carre rouge.png', rs45Template: 'Cadre rouge RS.png', storieTemplate: 'Storie Rouge Rose.png' },
    { name: 'Noir & Blanc', value: '#ffffff', text: '#000000', afficheTemplate: 'Affiche blanche.png', flyerTemplate: 'Flyer blanc.png', rsTemplate: 'Cadre RS carre blanc.png', rs45Template: 'Cadre blanc RS.png', storieTemplate: 'Storie blanche.png', isBlackAndWhite: true }
];

// Output pixel dimensions (same as before)
const PIXEL_DIMS = {
    'affiche': { w: 2480, h: 3508 },
    'flyer-recto': { w: 1748, h: 2480 },
    'flyer-verso': { w: 1748, h: 2480 },
    'communique': { w: 2480, h: 3508 },  // Portrait A4 comme l'affiche
    'post-rs': { w: 1080, h: 1080 },
    'post-rs-45': { w: 1080, h: 1350 },
    'storie': { w: 1080, h: 1920 }
};

// Ratios from App.jsx visualTypes (canvas dimensions)
// These define the aspect ratio for each visual type
const VISUAL_RATIOS = {
    'affiche': { width: 210, height: 297 },      // A4 portrait
    'flyer-recto': { width: 148, height: 210 },  // A5 portrait
    'flyer-verso': { width: 148, height: 210 },  // A5 portrait
    'communique': { width: 210, height: 297 },   // A4 portrait (comme l'affiche!)
    'post-rs': { width: 1080, height: 1080 },    // 1:1 square
    'post-rs-45': { width: 1080, height: 1350 }, // 4:5 portrait
    'storie': { width: 1080, height: 1920 }      // 9:16 portrait
};

// Reference dimensions for rendering (maintains correct aspect ratio)
// These are used for CSS layout before scaling to output pixels
const REFERENCE_DIMENSIONS = {
    'affiche': { width: 350, height: 495 },      // ratio 0.707
    'flyer-recto': { width: 350, height: 497 },  // ratio 0.704
    'flyer-verso': { width: 350, height: 497 },  // ratio 0.704
    'communique': { width: 350, height: 495 },   // ratio 0.707 (PORTRAIT!)
    'post-rs': { width: 400, height: 400 },      // ratio 1.0
    'post-rs-45': { width: 400, height: 500 },   // ratio 0.8
    'storie': { width: 400, height: 711 }        // ratio 0.5625
};

const RenderPage = () => {
    const [searchParams] = useSearchParams();

    const [visualData, setVisualData] = useState(null);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        const loadVisualFromToken = async () => {
            // Priority 1: Check for data injected by Puppeteer
            const injected = window.HORMUR_INJECTED_DATA;
            if (injected) {
                setVisualData({
                    type: injected.type || 'affiche',
                    colorIndex: injected.colorIndex || 0,
                    uploadedImage: injected.uploadedImage,
                    eventData: injected.eventData || {},
                    settings: injected.settings || { zoom: 100, positionX: 50, positionY: 50 }
                });
                return;
            }

            // Priority 2: Check for Token in URL
            const urlToken = searchParams.get('token');
            if (urlToken) {
                try {
                    console.log('Chargement du visuel depuis le token:', urlToken);
                    const tokenApiUrl = '/.netlify/functions/render-token';

                    const response = await fetch(
                      `${tokenApiUrl}?token=${encodeURIComponent(urlToken)}`
                    );

                    if (!response.ok) {
                      console.error(`Erreur HTTP: ${response.status}`);
                      setLoadError(`Erreur chargement: ${response.status}`);
                      return;
                    }

                    let data;
                    try {
                      data = await response.json();
                    } catch (e) {
                      console.error('JSON PARSE ERROR', e);
                      setLoadError('JSON invalide ou vide');
                      return;
                    }

                    console.log('✅ Visuel chargé avec succès depuis le token');

                    setVisualData({
                        type: data.type || 'affiche',
                        colorIndex: data.colorIndex !== undefined ? data.colorIndex : 0,
                        uploadedImage: data.uploadedImage || null,
                        eventData: data.eventData || {},
                        settings: data.settings || { zoom: 100, positionX: 50, positionY: 50 }
                    });

                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('❌ Erreur critique loading token:', error);
                        setLoadError(error.message || "Erreur inconnue");
                        loadFromUrlParams();
                    }
                }
                return;
            }

            loadFromUrlParams();
        };

        function loadFromUrlParams() {
            const type = searchParams.get('type') || 'affiche';
            const color = parseInt(searchParams.get('color') || '0', 10);
            const image = searchParams.get('image');

            let eData = {};
            try { eData = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}')); } catch (e) { }

            let sett = { zoom: 100, positionX: 50, positionY: 50 };
            try {
                const s = JSON.parse(decodeURIComponent(searchParams.get('settings') || '{}'));
                sett = { ...sett, ...s };
            } catch (e) { }

            setVisualData({
                type,
                colorIndex: color,
                uploadedImage: image,
                eventData: eData,
                settings: sett
            });
        }

        loadVisualFromToken();
    }, [searchParams]);

    // === SIGNAL READY - MUST BE BEFORE EARLY RETURNS ===
    const signalReady = () => {
        document.fonts.ready.then(() => {
            const allImagesLoaded = Array.from(document.images).every(
              img => img.complete || img.naturalWidth === 0
            );
            if (allImagesLoaded) {
                window.renderReady = true;
                document.body.classList.add('render-complete');
            }
        });
    };

    useEffect(() => {
        signalReady();
        const handleImageLoad = () => signalReady();
        const allImages = Array.from(document.images);
        allImages.forEach(img => {
            img.addEventListener('load', handleImageLoad);
            img.addEventListener('error', handleImageLoad);
        });
        return () => {
            allImages.forEach(img => {
                img.removeEventListener('load', handleImageLoad);
                img.removeEventListener('error', handleImageLoad);
            });
        };
    }, [visualData?.uploadedImage]);

    if (loadError) {
        return <div id="render-error" style={{ color: 'red', padding: 20 }}>{loadError}</div>;
    }

    if (!visualData) {
      return (
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          background: 'white'
        }}>
          Chargement du visuel…
        </div>
      );
    }

    const { type, colorIndex, uploadedImage, eventData, settings } = visualData;

    const currentColor = hormurColors[colorIndex] || hormurColors[0];
    const isNB = currentColor.isBlackAndWhite;
    const textColor = currentColor.text;
    const bgColor = currentColor.value;

    const config = loadVisualConfig(type) || {};
    const getConfigValue = (el, prop, def) => config[el]?.[prop] ?? def;

    const logical = REFERENCE_DIMENSIONS[type] || REFERENCE_DIMENSIONS['affiche'];
    const output = PIXEL_DIMS[type] || PIXEL_DIMS['affiche'];
    const scale = output.w / logical.width;

    // Image positioning (same as App.jsx)
    const zoom = settings?.zoom || 100;
    const posX = settings?.positionX ?? 50;
    const posY = settings?.positionY ?? 50;
    const imgScale = zoom / 100;
    const translateX = (posX - 50);
    const translateY = (posY - 50);

    const imageStyle = {
      position: 'absolute',
      top: `${50 + translateY}%`,
      left: `${50 + translateX}%`,
      width: `${100 * imgScale}%`,
      height: `${100 * imgScale}%`,
      maxWidth: 'none',
      maxHeight: 'none',
      objectFit: type === 'communique' ? 'contain' : 'cover',
      transform: 'translate(-50%, -50%)',
      transformOrigin: 'center'
    };

    // === RENDER CONTENT ===
    const renderContent = () => {

      // --- AFFICHE / FLYER-RECTO ---
      if (type === 'affiche' || type === 'flyer-recto') {
        const isAffiche = type === 'affiche';
        const templateSrc = `/${isAffiche ? currentColor.afficheTemplate : currentColor.flyerTemplate}`;

        return (
          <div style={{
            width: logical.width,
            height: logical.height,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: bgColor
          }}>
            {/* Logo Hormur */}
            <img
              src={isNB ? "/logo-hormur-noir.png" : "/logo-hormur-blanc.png"}
              alt="Hormur"
              style={{
                position: 'absolute',
                top: `${getConfigValue('logo', 'top', 3)}%`,
                left: `${getConfigValue('logo', 'left', 3)}%`,
                height: `${getConfigValue('logo', 'height', isAffiche ? 24 : 20)}px`,
                width: 'auto',
                zIndex: 3,
                filter: isNB ? 'none' : 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
              }}
            />

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
              {uploadedImage && (
                <img
                  src={uploadedImage}
                  alt="Event"
                  style={{
                    ...imageStyle,
                    filter: isNB ? 'grayscale(100%) contrast(1.1)' : 'none',
                    opacity: 1
                  }}
                />
              )}
            </div>

            {/* Template PNG */}
            <img
              src={templateSrc}
              alt="Template"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                zIndex: 2,
                pointerEvents: 'none'
              }}
            />

            {/* Nom de l'artiste avec fond */}
            {eventData.artistName && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('artistName', 'bottom', 17)}%`,
                left: `${getConfigValue('artistName', 'left', 3)}%`,
                right: `${getConfigValue('artistName', 'right', 3)}%`,
                zIndex: 3
              }}>
                <div style={{
                  backgroundColor: isNB ? 'transparent' : bgColor,
                  padding: `${getConfigValue('artistName', 'padding', isAffiche ? 8 : 6)}px`,
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  <p style={{
                    fontSize: `${getConfigValue('artistName', 'fontSize', isAffiche ? 12 : 10)}px`,
                    fontWeight: 700,
                    color: textColor,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {eventData.artistName}
                  </p>
                </div>
              </div>
            )}

            {/* Titre */}
            {eventData.title && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('title', 'bottom', 83)}%`,
                left: `${getConfigValue('title', 'left', 7)}%`,
                right: `${getConfigValue('title', 'right', 3)}%`,
                zIndex: 3
              }}>
                <h1 style={{
                  fontSize: `${getConfigValue('title', 'fontSize', isAffiche ? 36 : 28)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  lineHeight: '1',
                  letterSpacing: `${getConfigValue('title', 'letterSpacing', -0.5)}px`,
                  textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {eventData.title}
                </h1>
              </div>
            )}

            {/* Date */}
            {eventData.date && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('date', 'bottom', 18)}%`,
                left: `${getConfigValue('date', 'left', 3)}%`,
                right: `${getConfigValue('date', 'right', 3)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('date', 'fontSize', isAffiche ? 16 : 14)}px`,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.4)'
                }}>
                  {eventData.date}
                </p>
              </div>
            )}

            {/* Heure */}
            {eventData.time && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('time', 'bottom', 18)}%`,
                left: `${getConfigValue('time', 'left', 20)}%`,
                right: `${getConfigValue('time', 'right', 3)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('time', 'fontSize', isAffiche ? 16 : 14)}px`,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.4)'
                }}>
                  {eventData.time}
                </p>
              </div>
            )}

            {/* Ville */}
            {eventData.city && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('city', 'bottom', 18)}%`,
                right: `${getConfigValue('city', 'right', 5)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('city', 'fontSize', isAffiche ? 16 : 14)}px`,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {eventData.city}
                </p>
              </div>
            )}

            {/* Département */}
            {eventData.department && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('department', 'bottom', 5)}%`,
                left: `${getConfigValue('department', 'left', 5)}%`,
                right: `${getConfigValue('department', 'right', 5)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('department', 'fontSize', isAffiche ? 18 : 16)}px`,
                  fontWeight: 900,
                  color: textColor,
                  margin: 0,
                  textShadow: isNB ? '1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  ({eventData.department})
                </p>
              </div>
            )}

            {/* Organisateurs */}
            {eventData.organizerNames && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('organizer', 'bottom', 5)}%`,
                left: `${getConfigValue('organizer', 'left', 5)}%`,
                right: `${getConfigValue('organizer', 'right', 5)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('organizer', 'fontSize', isAffiche ? 13 : 11)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  textShadow: isNB ? '1px 1px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {eventData.organizerNames}
                </p>
              </div>
            )}

            {/* Chez l'habitant */}
            {eventData.chezHabitant && (
              <div style={{
                position: 'absolute',
                top: `${getConfigValue('chezHabitant', 'top', 83)}%`,
                left: `${getConfigValue('chezHabitant', 'left', 3)}%`,
                right: `${getConfigValue('chezHabitant', 'right', 3)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('chezHabitant', 'fontSize', isAffiche ? 13 : 11)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.8px',
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '1px 1px 3px rgba(0,0,0,0.3)'
                }}>
                  Chez l'habitant
                </p>
              </div>
            )}

            {/* Convivialité */}
            {eventData.convivialite && eventData.convivialite !== 'none' && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('convivialite', 'bottom', 5)}%`,
                left: `${getConfigValue('convivialite', 'left', 5)}%`,
                right: `${getConfigValue('convivialite', 'right', 5)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('convivialite', 'fontSize', isAffiche ? 11 : 9)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.5px',
                  textShadow: isNB ? '1px 1px 0 #ffffff' : '1px 1px 3px rgba(0,0,0,0.3)'
                }}>
                  {eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}
                </p>
              </div>
            )}

            {/* QR Code */}
            {eventData.eventUrl && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('qrcode', 'bottom', 5)}%`,
                right: `${getConfigValue('qrcode', 'right', 5)}%`,
                zIndex: 3
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: `${getConfigValue('qrcode', 'padding', 6)}px`,
                  borderRadius: '6px',
                  border: `2px solid ${textColor}`
                }}>
                  <QRCodeSVG
                    value={eventData.eventUrl}
                    size={getConfigValue('qrcode', 'size', isAffiche ? 52 : 44)}
                    level="M"
                    includeMargin={false}
                    fgColor="#000000"
                  />
                </div>
              </div>
            )}
          </div>
        );
      }

      // --- FLYER VERSO ---
      if (type === 'flyer-verso') {
        return (
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
              {/* À propos */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <h2 style={{
                  fontSize: `${getConfigValue('aboutTitle', 'fontSize', 20)}px`,
                  fontWeight: 900,
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
                }} />
              </div>

              {/* Description */}
              {eventData.description && (
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
              )}

              {/* Message personnel */}
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
                    fontWeight: 700,
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

              {/* Chez l'habitant */}
              {eventData.chezHabitant && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <p style={{
                    fontSize: `${getConfigValue('chezHabitant', 'fontSize', 11)}px`,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0,
                    letterSpacing: '0.8px'
                  }}>
                    Chez l'habitant
                  </p>
                </div>
              )}

              {/* Convivialité */}
              {eventData.convivialite && eventData.convivialite !== 'none' && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <p style={{
                    fontSize: `${getConfigValue('convivialite', 'fontSize', 10)}px`,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    color: textColor,
                    margin: 0,
                    letterSpacing: '0.5px'
                  }}>
                    {eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{
                borderTop: `2px solid ${textColor}40`,
                paddingTop: '12px',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  fontSize: `${getConfigValue('hormurInfo', 'fontSize', 10)}px`,
                  fontWeight: 700,
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
                  Hormur connecte des artistes avec des lieux non conventionnels pour créer des expériences culturelles uniques. L'art où on ne l'attend pas !
                </p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                {eventData.eventUrl && (
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
                )}
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
          </div>
        );
      }

      // --- COMMUNIQUE ---
      if (type === 'communique') {
        return (
          <div style={{
            width: '100%',
            height: '100%',
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
            />

            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2
            }}>
              {/* Image */}
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
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Event"
                    style={imageStyle}
                  />
                )}
              </div>

              {/* Date */}
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
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                  letterSpacing: '0.8px'
                }}>
                  Le {eventData.date}
                </p>
              </div>

              {/* Titre */}
              <div style={{
                position: 'absolute',
                left: `${getConfigValue('title', 'left', 8)}%`,
                top: `${getConfigValue('title', 'top', 47)}%`,
                width: `${getConfigValue('title', 'width', 36.5)}%`
              }}>
                <h2 style={{
                  fontFamily: "'Open Sans', Arial, sans-serif",
                  fontSize: `${getConfigValue('title', 'fontSize', 8)}px`,
                  fontWeight: 800,
                  color: '#1a1a1a',
                  margin: 0,
                  lineHeight: '1.15',
                  textAlign: 'center'
                }}>
                  {eventData.title}
                </h2>
              </div>

              {/* Organisateur */}
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

              {/* QR Code */}
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
                {eventData.eventUrl && (
                  <QRCodeSVG
                    value={eventData.eventUrl}
                    size={getConfigValue('qrcode', 'size', 70)}
                    level="M"
                    includeMargin={false}
                  />
                )}
              </div>

              {/* Ville + Heure */}
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
                  fontWeight: 700,
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

              {/* Description */}
              <div style={{
                position: 'absolute',
                left: `${getConfigValue('description', 'left', 47.3)}%`,
                top: `${getConfigValue('description', 'top', 64)}%`,
                width: `${getConfigValue('description', 'width', 41)}%`
              }}>
                <p style={{
                  fontFamily: "'Buenard', Georgia, serif",
                  fontSize: `${getConfigValue('description', 'fontSize', 7)}px`,
                  fontWeight: 700,
                  lineHeight: '1',
                  color: '#1a1a1a',
                  margin: 0,
                  textAlign: 'left'
                }}>
                  {eventData.description && eventData.description.length > 300
                    ? eventData.description.slice(0, 300) + '...'
                    : eventData.description}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // --- POST-RS / POST-RS-45 / STORIE ---
      if (type === 'post-rs' || type === 'post-rs-45' || type === 'storie') {
        const templateSrc = (() => {
          if (type === 'post-rs') return `/${currentColor.rsTemplate}`;
          if (type === 'post-rs-45') return `/${currentColor.rs45Template}`;
          return `/${currentColor.storieTemplate}`;
        })();

        return (
          <div style={{
            width: logical.width,
            height: logical.height,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: bgColor
          }}>
            {/* Logo Hormur */}
            <img
              src={type === 'post-rs' ? "/logo-hormur-blanc.png" : (isNB ? "/logo-hormur-noir.png" : "/logo-hormur-blanc.png")}
              alt="Hormur"
              style={{
                position: 'absolute',
                top: `${getConfigValue('logo', 'top', 3)}%`,
                right: `${getConfigValue('logo', 'right', 3)}%`,
                height: `${getConfigValue('logo', 'height', 28)}px`,
                width: 'auto',
                zIndex: 3,
                filter: type === 'post-rs' || !isNB ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
              }}
            />

            {/* Image de l'événement */}
            {uploadedImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
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
                    filter: isNB ? 'grayscale(100%) contrast(1.1)' : 'none',
                    opacity: 1
                  }}
                />
              </div>
            )}

            {/* Template PNG - Afficher uniquement pour post-rs-45 et storie (post-rs est hors template) */}
            {type !== 'post-rs' && (
              <img
                src={templateSrc}
                alt="Template"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 2,
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Organisateur si chez l'habitant */}
            {eventData.chezHabitant && eventData.organizerNames && (
              <div style={{
                position: 'absolute',
                top: `${getConfigValue('organizer', 'top', 3)}%`,
                left: `${getConfigValue('organizer', 'left', 3)}%`,
                right: `${getConfigValue('organizer', 'right', 3)}%`,
                zIndex: 4
              }}>
                <p style={{
                  fontSize: `${getConfigValue('organizer', 'fontSize', 12)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.8px',
                  textShadow: isNB ? '1px 1px 0 #ffffff, -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff' : '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  {eventData.organizerNames}
                </p>
              </div>
            )}

            {/* Titre */}
            {eventData.title && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('title', 'bottom', 30)}%`,
                left: `${getConfigValue('title', 'left', 6)}%`,
                right: `${getConfigValue('title', 'right', 6)}%`,
                zIndex: 3
              }}>
                <h2 style={{
                  fontSize: `${getConfigValue('title', 'fontSize', 36)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  lineHeight: '0.95',
                  margin: `${getConfigValue('title', 'marginBottom', -25)}px 0 12px 0`,
                  letterSpacing: `${getConfigValue('title', 'letterSpacing', -1)}px`,
                  textShadow: isNB ? '3px 3px 0 #ffffff, -3px -3px 0 #ffffff, 3px -3px 0 #ffffff, -3px 3px 0 #ffffff' : '0 2px 8px rgba(0,0,0,0.3)',
                  color: textColor
                }}>
                  {eventData.title}
                </h2>
              </div>
            )}

            {/* Nom de l'artiste avec fond */}
            {eventData.artistName && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('artistName', 'bottom', 40)}%`,
                left: `${getConfigValue('artistName', 'left', 6)}%`,
                right: `${getConfigValue('artistName', 'right', 6)}%`,
                zIndex: 3
              }}>
                <div style={{
                  backgroundColor: isNB ? 'transparent' : bgColor,
                  padding: `${getConfigValue('artistName', 'padding', 8)}px`,
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  <p style={{
                    fontSize: `${getConfigValue('artistName', 'fontSize', 18)}px`,
                    fontWeight: 700,
                    color: textColor,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '1px 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {eventData.artistName}
                  </p>
                </div>
              </div>
            )}

            {/* Date */}
            {eventData.date && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('date', 'bottom', 25)}%`,
                left: `${getConfigValue('date', 'left', 6)}%`,
                right: `${getConfigValue('date', 'right', 6)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('date', 'fontSize', 18)}px`,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  margin: '0 0 4px 0',
                  textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)',
                  color: textColor
                }}>
                  {eventData.date}
                </p>
              </div>
            )}

            {/* Heure */}
            {eventData.time && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('time', 'bottom', 25)}%`,
                left: `${getConfigValue('time', 'left', 30)}%`,
                right: `${getConfigValue('time', 'right', 6)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('time', 'fontSize', 16)}px`,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  margin: 0,
                  textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)',
                  color: textColor
                }}>
                  {eventData.time}
                </p>
              </div>
            )}

            {/* Ville */}
            {eventData.city && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('city', 'bottom', 20)}%`,
                left: `${getConfigValue('city', 'left', 6)}%`,
                right: `${getConfigValue('city', 'right', 6)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('city', 'fontSize', 15)}px`,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  margin: '0 0 16px 0',
                  whiteSpace: 'nowrap',
                  textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)',
                  color: textColor
                }}>
                  {eventData.city}
                </p>
              </div>
            )}

            {/* Département */}
            {eventData.department && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('department', 'bottom', 15)}%`,
                left: `${getConfigValue('department', 'left', 3)}%`,
                right: `${getConfigValue('department', 'right', 3)}%`,
                zIndex: 3
              }}>
                <span style={{
                  fontSize: `${getConfigValue('department', 'fontSize', 20)}px`,
                  fontWeight: 900,
                  color: textColor,
                  textShadow: isNB ? '2px 2px 0 #ffffff, -2px -2px 0 #ffffff, 2px -2px 0 #ffffff, -2px 2px 0 #ffffff' : '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  ({eventData.department})
                </span>
              </div>
            )}

            {/* Convivialité */}
            {eventData.convivialite && eventData.convivialite !== 'none' && (
              <div style={{
                position: 'absolute',
                bottom: `${getConfigValue('convivialite', 'bottom', 15)}%`,
                left: `${getConfigValue('convivialite', 'left', 20)}%`,
                right: `${getConfigValue('convivialite', 'right', 3)}%`,
                zIndex: 3
              }}>
                <p style={{
                  fontSize: `${getConfigValue('convivialite', 'fontSize', 11)}px`,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: textColor,
                  margin: 0,
                  letterSpacing: '0.5px',
                  textShadow: isNB ? '1px 1px 0 #ffffff' : '0 2px 6px rgba(0,0,0,0.4)'
                }}>
                  {eventData.convivialite === 'repas' ? 'Repas partagé' : 'Apéro participatif'}
                </p>
              </div>
            )}
          </div>
        );
      }

      return null;
    };

    return (
      <div style={{ width: output.w, height: output.h, overflow: 'hidden', background: 'white' }}>
        <div
          style={{
            width: logical.width,
            height: logical.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            fontFamily: "'Acumin Pro ExtraCondensed', 'Arial Narrow', 'Impact', sans-serif"
          }}
        >
          {renderContent()}
        </div>
      </div>
    );
};

export default RenderPage;
