import React, { useState, useEffect } from 'react';
import { MapContainer, GeoJSON, CircleMarker, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { useBankComparison, CompareButton, ComparisonModal } from './BankComparison';
import TooltipInfo from './TooltipInfo';
import DynamicCityLabels from './DynamicCityLabels'; // Import our new component
import './bankMapStyles.css'; // Import only the main CSS file

// Define constants
const germanyCenter = [51.1657, 10.4515];

// Helper functions for marker styling (unchanged)
const getAchievementColor = (achievement) => {
  if (achievement < 40) return '#ff3b30'; // Rot
  if (achievement < 70) return '#ff9500'; // Orange
  if (achievement < 90) return '#ffcc00'; // Gelb
  return '#34c759'; // Grün
};

// Get marker style based on achievement and selection state (unchanged)
const getMarkerStyle = (achievement, isSelected, isHovered = false) => {
  return {
    fillColor: getAchievementColor(achievement),
    fillOpacity: isHovered ? 0.9 : 0.7,
    weight: isSelected ? 3 : isHovered ? 2 : 1,
    color: isSelected ? '#fff' : isHovered ? '#fff' : '#000',
    opacity: isSelected || isHovered ? 1 : 0.5,
    // Add a subtle pulsing effect for selected markers
    className: isSelected ? 'pulse-marker' : ''
  };
};

// Helper component to set min/max zoom based on device type and update map class for styling
const ZoomController = () => {
  const map = useMap();
  
  useEffect(() => {
    // Check if the device is mobile
    const isMobile = window.innerWidth <= 768;
    
    // Set minimum zoom level based on device type
    map.setMinZoom(isMobile ? 5 : 6);
    
    // Add zoom level class to map container for CSS targeting
    const updateZoomClass = () => {
      const mapContainer = map.getContainer();
      const currentZoom = map.getZoom();
      
      // Remove existing zoom classes
      for (let i = 5; i <= 15; i++) {
        mapContainer.classList.remove(`zoom-level-${i}`);
      }
      
      // Add current zoom class
      mapContainer.classList.add(`zoom-level-${currentZoom}`);
    };
    
    // Initial class setting
    updateZoomClass();
    
    // Update class on zoom
    map.on('zoomend', updateZoomClass);
    
    // Create panes with proper z-index
    if (!map.getPane('mapPane')) {
      map.createPane('mapPane');
      map.getPane('mapPane').style.zIndex = 200;
    }
    
    if (!map.getPane('labelsPane')) {
      map.createPane('labelsPane');
      map.getPane('labelsPane').style.zIndex = 400;
    }
    
    if (!map.getPane('markersPane')) {
      map.createPane('markersPane');
      map.getPane('markersPane').style.zIndex = 600;
    }
    
    // Add listener for window resize to adjust min zoom level
    const handleResize = () => {
      const isMobileNow = window.innerWidth <= 768;
      map.setMinZoom(isMobileNow ? 5 : 6);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      map.off('zoomend', updateZoomClass);
    };
  }, [map]);
  
  return null;
};

// Main component (mostly unchanged, but with city labels added)
const BankMap = () => {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [hoveredBank, setHoveredBank] = useState(null);
  const [tooltipLocked, setTooltipLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [clusteringEnabled, setClusteringEnabled] = useState(true);
  const [geoData, setGeoData] = useState(null);
  
  // Bank comparison functionality (unchanged)
  const {
    selectedBanks,
    showComparisonModal,
    toggleBankSelection,
    removeSelectedBank,
    openComparisonModal,
    closeComparisonModal
  } = useBankComparison();

  // Load GeoJSON data (unchanged)
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/map.geojson`);
        if (!response.ok) {
          throw new Error('Fehler beim Laden der GeoJSON-Datei');
        }
        const data = await response.json();
        setGeoData(data);
      } catch (err) {
        console.error('Fehler beim Laden der GeoJSON-Datei:', err);
      }
    };
    fetchGeoData();
  }, []);

  // Load bank data (unchanged)
  useEffect(() => {
    // Existing code for loading bank data...
    const loadBankData = async () => {
      try {
        setLoading(true);
        
        const csvPath = `${process.env.PUBLIC_URL}/bank_data.csv`;
        
        const response = await fetch(csvPath);
        const csvText = await response.text();
        
        const rows = csvText.split('\n');
        if (rows.length < 2) {
          throw new Error('Keine Daten in der CSV-Datei gefunden');
        }
        
        const headers = rows[0].split(';');
        const data = rows.slice(1)
          .filter(row => row.trim() !== '')
          .map(row => {
            const values = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let i = 0; i < row.length; i++) {
              const char = row[i];
              
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ';' && !inQuotes) {
                values.push(currentValue);
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            
            values.push(currentValue);
            
            const result = {};
            headers.forEach((header, i) => {
              result[header] = values[i] || '';
              
              if (result[header].startsWith('"') && result[header].endsWith('"')) {
                result[header] = result[header].slice(1, -1);
              }
            });
            
            return result;
          });

        const formattedData = data.map((row, index) => {
          const street = row['addr:street'] || '';
          const zipCode = row['addr:postcode'] || '';
          const housenumber = row['addr:housenumber'] || '';
          const city = row['addr:city'] || '';
          
          const achievement = parseFloat(row.achievement) || 0;
          const employees = parseInt(row.employees, 10) || 0;
          const foundingYear = parseInt(row.foundingYear, 10) || 0;
          
          return {
            id: row.osm_id || `bank-${index}`,
            name: row.name || 'Santander',
            coordinates: [parseFloat(row.Y), parseFloat(row.X)],
            address: {
              street: street + (housenumber ? ' ' + housenumber : ''),
              zipCode: zipCode,
              city: city
            },
            branchManager: row.branchManager || '',
            insuranceContact: row.insuranceContact || '',
            achievement: achievement,
            employees: employees,
            foundingYear: foundingYear,
            atm: row.atm === 'yes',
            wheelchair: row.wheelchair || 'no',
            phone: row.phone || '',
            openingHours: row.opening_hours || ''
          };
        }).filter(bank => 
          !isNaN(bank.coordinates[0]) && !isNaN(bank.coordinates[1])
        );
        
        setBanks(formattedData);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der CSV-Datei:', err);
        setError(`Fehler beim Laden der Daten: ${err.message}. Stellen Sie sicher, dass die Datei "bank_data.csv" im öffentlichen Ordner vorhanden ist und korrekt formatiert wurde.`);
      } finally {
        setLoading(false);
      }
    };
    
    loadBankData();
  }, []);

  // Marker click handlers (unchanged)
  const handleMarkerClick = (bank) => {
    if (selectedBank && selectedBank.id === bank.id) {
      if (tooltipLocked) {
        setTooltipLocked(false);
        setSelectedBank(null);
      } else {
        setTooltipLocked(true);
      }
    } else {
      setSelectedBank(bank);
      setTooltipLocked(true);
    }
  };

  const closeTooltip = () => {
    setSelectedBank(null);
    setTooltipLocked(false);
  };
  
  const handleMarkerMouseEnter = (bank) => {
    setHoveredBank(bank);
    if (!tooltipLocked) {
      setSelectedBank(bank);
    }
  };
  
  const handleMarkerMouseLeave = () => {
    setHoveredBank(null);
    if (!tooltipLocked) {
      setSelectedBank(null);
    }
  };

  // Bank comparison functions (unchanged)
  const selectBankForComparison = (bank) => {
    toggleBankSelection(bank);
  };

  const handleOpenComparisonModal = () => {
    setSelectedBank(null);
    openComparisonModal();
  };

  const isBankSelected = (bankId) => {
    return selectedBanks.some(bank => bank.id === bankId);
  };

  // Loading and error states (unchanged)
  if (loading) {
    return <div className="loading-container">Bankdaten werden geladen...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Fehler</h3>
        <p>{error}</p>
        <p>Bitte stellen Sie sicher, dass die Datei "bank_data.csv" im öffentlichen Ordner vorhanden ist.</p>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer 
        center={germanyCenter} 
        zoom={6} 
        maxZoom={12}
        minZoom={5}           
        maxBounds={[
          [47.0, 5.5],  // Südwestecke von Deutschland (ca.)
          [55.5, 15.5]  // Nordostecke von Deutschland (ca.)
        ]}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
        zoomControl={false}
      >
        {/* Custom zoom controller component */}
        <ZoomController />
        
        {/* Add custom positioned zoom control */}
        <ZoomControl position="bottomright" />
        
        {/* Region boundaries with GeoJSON */}
        {geoData && (
          <>
            <GeoJSON
              data={geoData}
              style={{
                weight: 1,
                color: 'gray',
                fillColor: 'lightgray',
                fillOpacity: 0.5
              }}
              pane="mapPane"
            />
            
            {/* Add our new DynamicCityLabels component */}
            <DynamicCityLabels 
              geoData={geoData} 
              banks={banks} 
              clusteringEnabled={clusteringEnabled} 
            />
          </>
        )}
        
        {/* Bank markers with or without clustering (unchanged) */}
        {clusteringEnabled ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={(cluster) => {
              // Existing cluster code...
              const markers = cluster.getAllChildMarkers();
              const totalAchievement = markers.reduce((sum, marker) => sum + marker.options.achievement, 0);
              const avgAchievement = totalAchievement / markers.length;
              
              const achievementGroups = {
                excellent: 0,
                good: 0,
                average: 0,
                poor: 0
              };
              
              markers.forEach(marker => {
                const achievement = marker.options.achievement;
                if (achievement >= 90) achievementGroups.excellent++;
                else if (achievement >= 70) achievementGroups.good++;
                else if (achievement >= 40) achievementGroups.average++;
                else achievementGroups.poor++;
              });
              
              const clusterColor = getAchievementColor(avgAchievement);
              
              const total = markers.length;
              const pieSegments = [];
              
              const createPieChart = total >= 3;
              
              if (createPieChart) {
                let cumulativePercent = 0;
                
                if (achievementGroups.excellent > 0) {
                  const percent = (achievementGroups.excellent / total) * 100;
                  pieSegments.push(`#34c759 ${cumulativePercent}% ${cumulativePercent + percent}%`);
                  cumulativePercent += percent;
                }
                
                if (achievementGroups.good > 0) {
                  const percent = (achievementGroups.good / total) * 100;
                  pieSegments.push(`#ffcc00 ${cumulativePercent}% ${cumulativePercent + percent}%`);
                  cumulativePercent += percent;
                }
                
                if (achievementGroups.average > 0) {
                  const percent = (achievementGroups.average / total) * 100;
                  pieSegments.push(`#ff9500 ${cumulativePercent}% ${cumulativePercent + percent}%`);
                  cumulativePercent += percent;
                }
                
                if (achievementGroups.poor > 0) {
                  const percent = (achievementGroups.poor / total) * 100;
                  pieSegments.push(`#ff3b30 ${cumulativePercent}% ${cumulativePercent + percent}%`);
                }
              }
              
              const backgroundStyle = createPieChart
                ? `conic-gradient(${pieSegments.join(', ')})`
                : clusterColor;
              
              const size = Math.min(40 + Math.log(markers.length) * 10, 70);
              
              return L.divIcon({
                html: `<div class="cluster-marker" style="background: ${backgroundStyle}">
                        <span>${markers.length}</span>
                      </div>`,
                className: 'custom-cluster-icon',
                iconSize: L.point(size, size)
              });
            }}
            spiderfyOnMaxZoom={true}
            disableClusteringAtZoom={14}
            maxClusterRadius={60}
          >
          
          {banks.map((bank) => {
            const isSelected = isBankSelected(bank.id);
            const isHovered = hoveredBank && hoveredBank.id === bank.id;
            const isActive = selectedBank && selectedBank.id === bank.id;
            
            const baseRadius = 8;
            const achievementBonus = (bank.achievement / 100) * 3;
            const selectedBonus = isSelected ? 1 : 0;
            const hoverBonus = isHovered ? 2 : 0;
            const radius = baseRadius + achievementBonus + selectedBonus + hoverBonus;
            
            return (
              <CircleMarker
                key={bank.id}
                center={bank.coordinates}
                radius={radius}
                pathOptions={getMarkerStyle(bank.achievement, isSelected, isHovered)}
                achievement={bank.achievement}
                pane="markersPane"
                eventHandlers={{
                  click: () => handleMarkerClick(bank),
                  mouseover: () => handleMarkerMouseEnter(bank),
                  mouseout: () => handleMarkerMouseLeave(),
                }}
              >
                {isActive && mapReady && (
                  <Tooltip 
                    permanent 
                    direction="top" 
                    offset={[0, -radius - 10]} 
                    opacity={0} 
                    className="empty-tooltip"
                  />
                )}
              </CircleMarker>
            );
          })}
          </MarkerClusterGroup>
        ) : (
          // Individual markers code (unchanged)
          banks.map((bank) => {
            const isSelected = isBankSelected(bank.id);
            const isHovered = hoveredBank && hoveredBank.id === bank.id;
            const isActive = selectedBank && selectedBank.id === bank.id;
            
            const baseRadius = 8;
            const achievementBonus = (bank.achievement / 100) * 3;
            const selectedBonus = isSelected ? 1 : 0;
            const hoverBonus = isHovered ? 2 : 0;
            const radius = baseRadius + achievementBonus + selectedBonus + hoverBonus;
            
            return (
              <CircleMarker
                key={bank.id}
                center={bank.coordinates}
                radius={radius}
                pathOptions={getMarkerStyle(bank.achievement, isSelected, isHovered)}
                pane="markersPane"
                eventHandlers={{
                  click: () => handleMarkerClick(bank),
                  mouseover: () => handleMarkerMouseEnter(bank),
                  mouseout: () => handleMarkerMouseLeave(),
                }}
              >
                {isActive && mapReady && (
                  <Tooltip 
                    permanent 
                    direction="top" 
                    offset={[0, -radius - 10]} 
                    opacity={0} 
                    className="empty-tooltip"
                  />
                )}
              </CircleMarker>
            );
          })
        )}
      </MapContainer>
      
      {/* Tooltip info (unchanged) */}
      {selectedBank && (
        <TooltipInfo 
          bank={selectedBank} 
          onClose={closeTooltip} 
          isSelected={isBankSelected(selectedBank.id)}
          onToggleSelection={() => selectBankForComparison(selectedBank)}
        />
      )}

      {/* Compare button (unchanged) */}
      <CompareButton 
        openComparisonModal={handleOpenComparisonModal} 
        selectedCount={selectedBanks.length} 
      />

      {/* Comparison modal (unchanged) */}
      <ComparisonModal 
        isOpen={showComparisonModal}
        onClose={closeComparisonModal}
        banks={selectedBanks}
        onRemoveBank={removeSelectedBank}
      />
      
      {/* Map Legend (unchanged) */}
      <div className="map-legend">
        <h4>Zielerreichung</h4>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#34c759' }}></div>
          <span>Sehr gut (90-100%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ffcc00' }}></div>
          <span>Gut (70-89%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff9500' }}></div>
          <span>Mittel (40-69%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff3b30' }}></div>
          <span>Niedrig (0-39%)</span>
        </div>
        
        {/* Clustering toggle (unchanged) */}
        <div className="legend-divider"></div>
        <div className="legend-toggle">
          <label className="toggle-label" htmlFor="cluster-toggle">
            <span className="toggle-text">Filial-Clustering</span>
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                id="cluster-toggle"
                className="toggle-input"
                checked={clusteringEnabled}
                onChange={() => setClusteringEnabled(!clusteringEnabled)}
              />
              <div className="toggle-switch"></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default BankMap;