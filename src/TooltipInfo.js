import React from 'react';
import './bankMapStyles.css';

// Tooltip-Komponente mit Klassen statt Inline-Styles
const TooltipInfo = ({ bank, onClose, isSelected, onToggleSelection }) => {
  if (!bank) return null;

  // Berechne Farbklassen basierend auf der Zielerreichung
  const getAchievementColorClass = (achievement) => {
    if (achievement < 40) return 'achievement-red';
    if (achievement < 70) return 'achievement-orange';
    if (achievement < 90) return 'achievement-yellow';
    return 'achievement-green';
  };

  const getProgressBarColorClass = (achievement) => {
    if (achievement < 40) return 'progress-bar-red';
    if (achievement < 70) return 'progress-bar-orange';
    if (achievement < 90) return 'progress-bar-yellow';
    return 'progress-bar-green';
  };
  
  const getBadgeColorClass = (achievement) => {
    if (achievement < 40) return 'badge-red';
    if (achievement < 70) return 'badge-orange';
    if (achievement < 90) return 'badge-yellow';
    return 'badge-green';
  };

  return (
    <div className="tooltip">
      <button 
        onClick={onClose}
        className="close-button"
      >
        ×
      </button>
      
      {/* Header mit Logo und Namen */}
      <div className="tooltip-header">
        <div className="logo-container">
          <img 
            src={`${process.env.PUBLIC_URL}/Santander.svg`} 
            alt="Santander Logo" 
            className="bank-logo"
          />
        </div>
        <div className="name-container">
          <div className="bank-title">{bank.name}</div>
          <div className="bank-subtitle">Filial-ID: #{bank.id}</div>
        </div>
      </div>
      
      {/* Adresse */}
      <div className="section">
        <span className="section-label">Standort</span>
        <span className="section-content">
          {bank.address.street}, {bank.address.zipCode} {bank.address.city}
        </span>
      </div>
      
      {/* Filialleiter */}
      <div className="section">
        <span className="section-label">Filialleiter</span>
        <span className="section-content">{bank.branchManager}</span>
      </div>
      
      {/* Versicherungsansprechpartner */}
      <div className="section">
        <span className="section-label">Versicherungsansprechpartner</span>
        <span className="section-content">{bank.insuranceContact}</span>
      </div>
      
      {/* Zielerreichung */}
      <div className="section">
        <span className="section-label">Zielerreichung</span>
        <div className="flex-center">
          <span className={`section-content ${getAchievementColorClass(bank.achievement)}`}>
            {bank.achievement}%
          </span>
        </div>
        <div className="progress-bar-container">
          <div 
            className={`progress-bar ${getProgressBarColorClass(bank.achievement)}`}
            style={{ width: `${Math.min(bank.achievement, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Mitarbeiter und Gründungsjahr */}
      <div className="flex-between">
        <div className="section flex-1">
          <span className="section-label">Mitarbeiter</span>
          <span className="section-content">{bank.employees}</span>
        </div>
        <div className="section flex-1">
          <span className="section-label">Gegründet</span>
          <span className="section-content">{bank.foundingYear}</span>
        </div>
      </div>
      
      {/* Badge für Status */}
      <div className="text-center">
        <span className={`badge ${getBadgeColorClass(bank.achievement)}`}>
          {bank.achievement >= 90 ? 'Top-Performer' : 
           bank.achievement >= 70 ? 'Gute Leistung' : 
           bank.achievement >= 40 ? 'Verbesserungsbedarf' : 'Kritischer Status'}
        </span>
      </div>
      
      {/* Button zum Hinzufügen/Entfernen aus der Vergleichsliste */}
      <div className="selection-button">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection();
          }}
          className={`button ${isSelected ? 'button-red' : 'button-blue'}`}
        >
          {isSelected ? 'Aus Vergleich entfernen' : 'Zum Vergleich hinzufügen'}
        </button>
      </div>
      
      <div className="footer">
        Letzte Aktualisierung: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default TooltipInfo;