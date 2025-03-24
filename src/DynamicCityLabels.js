import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

// Component to manage city labels based on zoom level and population
const DynamicCityLabels = ({ geoData, banks = [], clusteringEnabled }) => {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [currentCenter, setCurrentCenter] = useState(map.getCenter());
  const [labelGroup, setLabelGroup] = useState(null);
  const allFeaturesRef = useRef([]); // Cache all features with calculated centers
  
  // Initialize on component mount
  useEffect(() => {
    const newLabelGroup = L.layerGroup().addTo(map);
    setLabelGroup(newLabelGroup);

    // Listen for zoom events and map movements
    const handleViewChange = () => {
      setCurrentZoom(map.getZoom());
      setCurrentCenter(map.getCenter());
    };
    
    map.on('zoomend', handleViewChange);
    map.on('moveend', handleViewChange);

    return () => {
      if (map && newLabelGroup) {
        map.removeLayer(newLabelGroup);
      }
      map.off('zoomend', handleViewChange);
      map.off('moveend', handleViewChange);
    };
  }, [map]);
  
  // Process all features once when geoData loads or changes
  useEffect(() => {
    if (!geoData || !geoData.features) return;
    
    try {
      // Pre-process all features to calculate centers
      const processedFeatures = geoData.features
        .filter(feature => feature.properties && feature.properties.population)
        .map(feature => {
          try {
            // Get center point for the feature
            let center;
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              const centerPoint = turf.center(feature);
              center = [centerPoint.geometry.coordinates[1], centerPoint.geometry.coordinates[0]];
            } else if (feature.geometry.type === 'Point') {
              center = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
            } else if (Array.isArray(feature.geometry.coordinates) && 
                       Array.isArray(feature.geometry.coordinates[0])) {
              center = [feature.geometry.coordinates[0][1], feature.geometry.coordinates[0][0]];
            } else {
              return null; // Skip if can't determine center
            }
            
            return {
              id: feature.properties.id,
              population: feature.properties.population,
              center: center,
              properties: feature.properties
            };
          } catch (e) {
            console.warn('Error processing feature:', e);
            return null;
          }
        })
        .filter(feature => feature !== null);
      
      allFeaturesRef.current = processedFeatures;
    } catch (error) {
      console.error('Error preprocessing features:', error);
    }
  }, [geoData]);

  // Update labels when view changes (zoom or pan)
  useEffect(() => {
    if (!labelGroup || allFeaturesRef.current.length === 0) return;

    try {
      // Clear existing labels
      labelGroup.clearLayers();
      
      // Get current map bounds
      const bounds = map.getBounds();
      
      // Dynamic configuration based on zoom level
      const baseLabelsPerView = Math.min(30, Math.max(5, Math.floor(currentZoom * 3)));
      const zoomFactor = Math.max(11 - currentZoom, 1);
      
      // Add margin to bounds to include features just outside view
      // Higher zoom = smaller margin
      const margin = Math.max(0.1, 0.3 / zoomFactor);
      const expandedBounds = bounds.pad(margin);
      
      // Filter features in current view (with margin)
      const visibleFeatures = allFeaturesRef.current.filter(feature => {
        const lat = feature.center[0];
        const lng = feature.center[1];
        return expandedBounds.contains([lat, lng]);
      });
      
      // If very few visible features, expand viewport more
      let featuresForLabels = visibleFeatures;
      
      if (visibleFeatures.length < baseLabelsPerView / 2) {
        // Get more features from just outside the current view
        const expandedMoreBounds = bounds.pad(margin * 2);
        featuresForLabels = allFeaturesRef.current.filter(feature => {
          const lat = feature.center[0];
          const lng = feature.center[1];
          return expandedMoreBounds.contains([lat, lng]);
        });
      }
      
      // Determine dynamic population threshold based on visible features
      let minPopulation = 0;
      if (featuresForLabels.length > baseLabelsPerView * 2) {
        // If we have too many features, use population to filter
        // Sort by population
        const sortedPop = [...featuresForLabels]
          .sort((a, b) => b.population - a.population)
          .map(f => f.population);
        
        // Get population threshold at the cut-off point
        const cutoffIndex = Math.min(sortedPop.length - 1, baseLabelsPerView * 2);
        minPopulation = sortedPop[cutoffIndex] || 0;
        
        // Filter by this dynamic threshold
        featuresForLabels = featuresForLabels.filter(f => f.population >= minPopulation);
      }
      
      // Sort by population (prioritize more populated places)
      featuresForLabels.sort((a, b) => b.population - a.population);
      
      // Function to check if a point is too close to any bank marker
      const isTooCloseToMarker = (labelPoint) => {
        // Adjust distance based on zoom level - smaller buffer at higher zoom
        const minDistance = clusteringEnabled ? 40 / zoomFactor : 25 / zoomFactor;
        
        // Calculate distance to each bank marker
        for (const bank of banks) {
          if (!bank.coordinates || !Array.isArray(bank.coordinates) || bank.coordinates.length < 2) {
            continue; // Skip invalid bank data
          }
          
          const bankPoint = [bank.coordinates[0], bank.coordinates[1]];
          const distance = map.distance(labelPoint, bankPoint);
          if (distance < minDistance) {
            return true; // Too close to a marker
          }
        }
        
        return false; // Not too close to any marker
      };
      
      // Place labels with proper spacing
      const placedLabels = [];
      
      // First place the most important labels (within actual viewport, highest population)
      const priorityFeatures = featuresForLabels.filter(feature => {
        const lat = feature.center[0];
        const lng = feature.center[1];
        return bounds.contains([lat, lng]);
      }).slice(0, baseLabelsPerView);
      
      // Then add additional features if needed
      const additionalFeatures = featuresForLabels.filter(feature => {
        const lat = feature.center[0];
        const lng = feature.center[1];
        return !bounds.contains([lat, lng]);
      }).slice(0, baseLabelsPerView);
      
      // Combine with priority first
      const combinedFeatures = [...priorityFeatures, ...additionalFeatures];
      
      // Place with spacing
      for (const feature of combinedFeatures) {
        // Check if this label is too close to any already placed label
        let tooClose = false;
        
        // Minimum distance between labels (adjust based on zoom)
        const minLabelDistance = 40 / zoomFactor;
        
        for (const placed of placedLabels) {
          const distance = map.distance(feature.center, placed.center);
          if (distance < minLabelDistance) {
            tooClose = true;
            break;
          }
        }
        
        // Skip if too close to another label or marker
        if (tooClose || isTooCloseToMarker(feature.center)) {
          continue;
        }
        
        // Add to placed labels
        placedLabels.push(feature);
        
        // Create and style the label
        const divIcon = L.divIcon({
          className: `map-label ${bounds.contains(feature.center) ? 'in-viewport' : 'outside-viewport'}`,
          html: `<div>${feature.id}</div>`,
          iconSize: [100, 40],
          iconAnchor: [50, 20]
        });

        // Create the marker at the center position
        try {
          const marker = L.marker(feature.center, { 
            icon: divIcon, 
            zIndexOffset: Math.round(feature.population / 1000),
            interactive: false,
            pane: 'labelsPane'
          });
          
          // Add to layer group
          labelGroup.addLayer(marker);
        } catch (e) {
          console.warn('Error creating label marker:', e);
        }
      }
    } catch (error) {
      console.error('Error in DynamicCityLabels:', error);
    }
  }, [currentZoom, currentCenter, labelGroup, banks, clusteringEnabled, map]);

  return null;
};

export default DynamicCityLabels;